import { Panel } from "components/ui/Panel";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Modal } from "components/ui/Modal";

import { InventoryItemName, Reward } from "features/game/types/game";

import { Context } from "features/game/GameProvider";

import { StopTheGoblins } from "features/island/common/chest-reward/StopTheGoblins";
import { ChestCaptcha } from "features/island/common/chest-reward/ChestCaptcha";
import { Loading } from "features/auth/components";
import { ClaimReward } from "features/game/expansion/components/ClaimReward";
import Decimal from "decimal.js-light";
import { translate } from "lib/i18n/translate";
import classNames from "classnames";
import { useSelector } from "@xstate/react";
import { MachineState } from "features/game/lib/gameMachine";
import { getBumpkinLevel } from "features/game/lib/level";
import { hasActiveSeasonBanner } from "features/game/lib/collectibleBuilt";

interface Props {
  collectedItem?: InventoryItemName;
  reward?: Reward;
  onCollected: (success: boolean) => void;
  onOpen: () => void;
}

type Challenge = "goblins" | "chest";

// Consider new during first 24 hours
const isNewGame = (state: MachineState) =>
  state.context.state.createdAt + 24 * 60 * 60 * 1000 > Date.now();

// A player that has been vetted and is engaged in the season.
const isSeasonedPlayer = (state: MachineState) =>
  // - level 60+
  getBumpkinLevel(state.context.state.bumpkin?.experience ?? 0) >= 60 &&
  // - verified (personhood verification)
  state.context.verified &&
  // - has active seasonal banner
  hasActiveSeasonBanner({ game: state.context.state });

export const ChestReward: React.FC<Props> = ({
  collectedItem,
  reward,
  onCollected,
  onOpen,
}) => {
  const { gameService } = useContext(Context);
  const isNew = useSelector(gameService, isNewGame);
  const isSeasoned = useSelector(gameService, isSeasonedPlayer);
  const [opened, setOpened] = useState(isNew || isSeasoned);
  const [loading, setLoading] = useState(false);
  const challenge = useRef<Challenge>(
    Math.random() > 0.3 ? "chest" : "goblins",
  );

  useEffect(() => {
    if (reward && !isNew && !isSeasoned) {
      setLoading(true);
      setTimeout(() => setLoading(false), 500);
    }
  }, [reward]);

  if (!reward) {
    return null;
  }

  const open = () => {
    setOpened(true);
    onOpen();
  };

  const fail = () => {
    close(false);
    gameService.send("bot.detected");
    gameService.send("REFRESH");
  };

  const close = (success: boolean) => {
    onCollected(success);
    setOpened(false);
  };

  const { items, sfl, coins } = reward;

  return (
    <Modal show={true}>
      <Panel>
        {loading && <Loading />}
        {opened ? (
          <ClaimReward
            reward={{
              id: "chest-reward",
              createdAt: Date.now(),
              items:
                items?.reduce(
                  (acc, { name, amount }) => {
                    return { ...acc, [name]: amount };
                  },
                  {} as Record<InventoryItemName, number>,
                ) ?? {},
              wearables: {},
              sfl: sfl ? new Decimal(sfl).toNumber() : 0,
              coins: coins ?? 0,
              message: translate("reward.woohoo"),
            }}
            onClose={() => close(true)}
          />
        ) : (
          <div
            // render and hide captchas so images have time to load
            className={classNames(
              "flex flex-col items-center justify-between",
              { hidden: loading },
            )}
          >
            {challenge.current === "goblins" && (
              <StopTheGoblins
                onFail={fail}
                onOpen={open}
                collectedItem={collectedItem}
              />
            )}
            {challenge.current === "chest" && (
              <ChestCaptcha onFail={fail} onOpen={open} />
            )}
          </div>
        )}
      </Panel>
    </Modal>
  );
};
