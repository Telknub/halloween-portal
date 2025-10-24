import React, { useContext, useEffect } from "react";
import { SlidingPuzzle } from "../../map/rooms/types/SlidingPuzzle";
import { RelicModal } from "../interactables/RelicModal";
import { EventBus } from "../../lib/EventBus";
import { PortalContext } from "../../lib/PortalProvider";
import { SudokuHalloween } from "../../map/rooms/types/SudokuHalloween";
import { useSelector } from "@xstate/react";
import { PortalMachineState } from "../../lib/halloweenMachine";

import owl from "public/world/owl_portrait.png";
import { SpeakingModal } from "features/game/components/SpeakingModal";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { HalloweenNpcNames, TIME_PUZZLE } from "../../HalloweenConstants";
import { useSound } from "lib/utils/hooks/useSound";

interface Props {
  onClose: () => void;
  data?: any;
}

const _firstDialogueNPCs = (state: PortalMachineState) =>
  state.context.firstDialogueNPCs;

export const OwlNPC: React.FC<Props> = ({ onClose, data }) => {
  const { t } = useAppTranslation();
  const { portalService } = useContext(PortalContext);
  const [showPuzzle, setShowPuzzle] = React.useState(true);
  const [showRepeatDialogue, setShowRepeatDialogue] = React.useState(false);
  const [puzzleType] = React.useState(() =>
    Math.random() < 0.5 ? "sudoku" : "sliding",
  );
  const [seconds, setSeconds] = React.useState(TIME_PUZZLE);
  const [isCompleted, setIsCompleted] = React.useState(false);
  const npcName: HalloweenNpcNames = data?.npcName;

  const button = useSound("tab");

  const firstDialogueNPCs = useSelector(portalService, _firstDialogueNPCs);

  const getRelic = () => {
    setIsCompleted(true);
    setTimeout(() => {
      setShowPuzzle(false);
      portalService.send("SET_FIRST_DIALOGUE_NPCS", { npcName });
      EventBus.emit("apply-relic-buff", data?.relicName);
      portalService.send("GAIN_POINTS");
    }, 1000);
  };

  const onFinish = () => {
    onClose();
    EventBus.emit("hurt-player", "owl");
  };

  useEffect(() => {
    if (isCompleted) return;
    if (seconds <= 0) {
      onFinish();
      return;
    }

    const interval = setInterval(() => {
      button.play();
      setSeconds((s: number) => s - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  useEffect(() => {
    if (firstDialogueNPCs[npcName]) {
      setShowRepeatDialogue(true);
    }
  }, []);

  if (showRepeatDialogue) {
    return (
      <SpeakingModal
        message={[
          {
            text: t("halloween.owl"),
          },
        ]}
        onClose={() => onClose()}
        bumpkinImage={owl}
      />
    );
  }

  if (showPuzzle) {
    if (puzzleType === "sudoku") {
      return (
        <SudokuHalloween
          onClose={onClose}
          onAction={getRelic}
          seconds={seconds}
        />
      );
    }
    return (
      <SlidingPuzzle onClose={onClose} onAction={getRelic} seconds={seconds} />
    );
  }

  return <RelicModal onClose={onClose} data={data} />;
};
