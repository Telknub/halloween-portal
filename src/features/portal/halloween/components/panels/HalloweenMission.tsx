import React, { useContext } from "react";

import { Button } from "components/ui/Button";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { useSelector } from "@xstate/react";
import { PortalContext } from "../../lib/PortalProvider";
import { HalloweenAttempts } from "./HalloweenAttempts";
import {
  getAttemptsLeft,
  getScoreTime,
  isWithinRange,
} from "../../lib/HalloweenUtils";
import { goHome } from "features/portal/lib/portalUtil";
import { PortalMachineState } from "../../lib/halloweenMachine";
import { Controls } from "./HalloweenControls";
import { OuterPanel } from "../../../../../components/ui/Panel";
import { Label } from "components/ui/Label";

import key from "public/world/key.png";
import { decodeToken } from "features/auth/actions/login";
import { getUrl } from "features/portal/actions/loadPortal";
import { HalloweenPrize } from "./HalloweenPrize";
import { millisecondsToString } from "lib/utils/time";
import { RELIC_GOAL } from "../../HalloweenConstants";

const PORTAL_NAME = "halloween";

interface Props {
  mode: "introduction" | "success" | "failed";
  showScore: boolean;
  showExitButton: boolean;
  confirmButtonText: string;
  onConfirm: () => void;
  trainingButtonText?: string;
  onTraining?: () => void;
}

// const _isJoystickActive = (state: PortalMachineState) =>
//   state.context.isJoystickActive;
const _lastScore = (state: PortalMachineState) => state.context.lastScore;
// const _state = (state: PortalMachineState) => state.context.state;
const _minigame = (state: PortalMachineState) =>
  state.context.state?.minigames.games[PORTAL_NAME];
const _jwt = (state: PortalMachineState) => state.context.jwt;
const _score = (state: PortalMachineState) => state.context.score;

export const HalloweenMission: React.FC<Props> = ({
  mode,
  showScore,
  showExitButton,
  confirmButtonText,
  onConfirm,
  trainingButtonText,
  onTraining,
}) => {
  const { t } = useAppTranslation();

  const { portalService } = useContext(PortalContext);

  // const isJoystickActive = useSelector(portalService, _isJoystickActive);
  const lastScore = useSelector(portalService, _lastScore);
  // const state = useSelector(portalService, _state);
  const minigame = useSelector(portalService, _minigame);
  const jwt = useSelector(portalService, _jwt);
  const score = useSelector(portalService, _score);

  const farmId = !getUrl() ? 0 : decodeToken(jwt as string).farmId;
  const attemptsLeft = getAttemptsLeft(minigame, farmId);

  const dateKey = new Date().toISOString().slice(0, 10);

  const [page, setPage] = React.useState<
    "main" | "achievements" | "guide" | "controls"
  >("main");

  // const hasBetaAccess = state
  //   ? hasFeatureAccess(state, "")
  //   : false;

  return (
    <>
      {page === "main" && (
        <div className="px-2">
          <div>
            <div className="w-full relative flex justify-between gap-1 items-center pt-1">
              <HalloweenAttempts attemptsLeft={attemptsLeft} />
              <div className="gap-1">
                <Button
                  className="whitespace-nowrap capitalize w-32 p-0"
                  onClick={() => setPage("controls")}
                >
                  <div className="flex flex-row gap-1 justify-center items-center">
                    <img src={key} className="h-5 mt-1" />
                    {t(`${PORTAL_NAME}.controls`)}
                  </div>
                </Button>
              </div>
            </div>

            <div className="w-full mt-1 mb-3 flex flex-col gap-2">
              <p>{t(`${PORTAL_NAME}.intro.description1`)}</p>
              <p>{t(`${PORTAL_NAME}.intro.description2`)}</p>
            </div>

            <div className="w-full flex flex-col gap-1 mb-3">
              {showScore && score === RELIC_GOAL ? (
                <>
                  <OuterPanel className="w-full flex flex-col items-center">
                    <Label type="info">{t(`${PORTAL_NAME}.time`)}</Label>
                    <div>
                      {millisecondsToString(getScoreTime(lastScore), {
                        length: "full",
                      })}
                    </div>
                  </OuterPanel>
                  <div className="flex gap-1">
                    <OuterPanel className="w-full flex flex-col items-center">
                      <Label type="default">
                        {t(`${PORTAL_NAME}.bestToday`)}
                      </Label>
                      <div>
                        {millisecondsToString(
                          getScoreTime(
                            minigame?.history[dateKey]?.highscore || 0,
                          ),
                          {
                            length: "full",
                          },
                        )}
                      </div>
                    </OuterPanel>
                    <OuterPanel className="w-full flex flex-col items-center">
                      <Label type="default">
                        {t(`${PORTAL_NAME}.bestTime`)}
                      </Label>
                      <div>
                        {millisecondsToString(
                          getScoreTime(
                            Object.entries(minigame?.history ?? {}).reduce(
                              (acc, [date, entry]) => {
                                if (!isWithinRange(date)) return acc;
                                return Math.max(acc, entry.highscore);
                              },
                              0,
                            ),
                          ),
                          {
                            length: "full",
                          },
                        )}
                      </div>
                    </OuterPanel>
                  </div>
                </>
              ) : (
                <div className="w-full">
                  <HalloweenPrize />
                </div>
              )}
            </div>
          </div>

          {trainingButtonText ? (
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex gap-1">
                <Button
                  className="whitespace-nowrap capitalize"
                  onClick={onTraining}
                >
                  {trainingButtonText}
                </Button>
                {confirmButtonText && (
                  <Button
                    className="whitespace-nowrap capitalize"
                    onClick={onConfirm}
                  >
                    {confirmButtonText}
                  </Button>
                )}
              </div>
              {showExitButton && (
                <Button
                  className="whitespace-nowrap capitalize"
                  onClick={goHome}
                >
                  {t("exit")}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex mt-1 space-x-1">
              {showExitButton && (
                <Button
                  className="whitespace-nowrap capitalize"
                  onClick={goHome}
                >
                  {t("exit")}
                </Button>
              )}
              {confirmButtonText && (
                <Button
                  className="whitespace-nowrap capitalize"
                  onClick={onConfirm}
                >
                  {confirmButtonText}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      {/* {page === "achievements" && (
        <AchievementsList onBack={() => setPage("main")} />
      )} */}
      {page === "controls" && <Controls onBack={() => setPage("main")} />}
    </>
  );
};
