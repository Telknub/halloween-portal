import { SpeakingModal } from "features/game/components/SpeakingModal";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import React, { useContext, useEffect, useState } from "react";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { INITIAL_SKELETON_KEY } from "../../HalloweenConstants";
import { PortalContext } from "../../lib/PortalProvider";

import skeleton from "public/world/skeletonPortrait.png";
import sword from "public/world/sword.webp";
import { EventBus } from "../../lib/EventBus";
import { useSelector } from "@xstate/react";
import { PortalMachineState } from "../../lib/halloweenMachine";

interface Props {
  onClose: () => void;
}

const _firstDialogueNPCs = (state: PortalMachineState) =>
  state.context.firstDialogueNPCs;

export const InitialSkeletonNPC: React.FC<Props> = ({ onClose }) => {
  const { portalService } = useContext(PortalContext);
  const [showFirstDialogue, setShowFirstDialogue] = useState(true);
  const [showRepeatDialogue, setShowRepeatDialogue] = useState(false);
  const { t } = useAppTranslation();
  const npcName = "initial_skeleton";

  const firstDialogueNPCs = useSelector(portalService, _firstDialogueNPCs);

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
            text: t("halloween.initialSkeleton4"),
          },
        ]}
        onClose={() => onClose()}
        bumpkinImage={skeleton}
      />
    );
  }

  if (showFirstDialogue) {
    return (
      <SpeakingModal
        message={[
          {
            text: t("halloween.initialSkeleton1"),
          },
          {
            text: t("halloween.initialSkeleton2"),
          },
          {
            text: t("halloween.initialSkeleton3"),
          },
        ]}
        onClose={() => {
          portalService.send("SET_FIRST_DIALOGUE_NPCS", { npcName });
          setShowFirstDialogue(false);
          portalService.send("COLLECT_TOOL", { tool: "sword" });
          EventBus.emit("open-gate");
        }}
        bumpkinImage={skeleton}
      />
    );
  }

  return (
    <div className="pointer-events-none flex justify-center fixed top-0 left-0 w-full h-screen">
      <div className="flex flex-col w-[200px] items-center justify-center text-center gap-3">
        <img src={sword} alt="fader" className="w-full pb-3" />
        <span>{t("halloween.gotSword")}</span>
        <span>{t("halloween.tapToContinue")}</span>
      </div>
    </div>
  );
};
