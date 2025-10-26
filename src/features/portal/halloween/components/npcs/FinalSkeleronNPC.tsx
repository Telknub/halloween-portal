import { SpeakingModal } from "features/game/components/SpeakingModal";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import React, { useContext, useEffect, useState } from "react";
import { PIXEL_SCALE } from "features/game/lib/constants";
import {
  FINAL_SKELETON_KEY,
  RELIC_CODEX,
  Relics,
} from "../../HalloweenConstants";
import { Label } from "components/ui/Label";
import { EventBus } from "../../lib/EventBus";
import { PortalContext } from "../../lib/PortalProvider";

import skeleton from "public/world/skeletonPortrait.png";
import lightning from "assets/icons/lightning.png";
import { PortalMachineState } from "../../lib/halloweenMachine";
import { useSelector } from "@xstate/react";

interface Props {
  onClose: () => void;
  data?: any;
}

const _firstDialogueNPCs = (state: PortalMachineState) =>
  state.context.firstDialogueNPCs;

export const FinalSkeletonNPC: React.FC<Props> = ({ onClose, data }) => {
  const { portalService } = useContext(PortalContext);
  const [showFirstDialogue, setShowFirstDialogue] = useState(true);
  const [showRepeatDialogue, setShowRepeatDialogue] = useState(false);
  const { t } = useAppTranslation();
  const relic = RELIC_CODEX?.[data?.relicName as Relics];
  const npcName = "final_skeleton";

  const firstDialogueNPCs = useSelector(portalService, _firstDialogueNPCs);

  useEffect(() => {
    if (firstDialogueNPCs[npcName]) {
      setShowRepeatDialogue(true);
    }
  }, []);

  if (!data?.hasBones) {
    return (
      <SpeakingModal
        message={[
          {
            text: t("halloween.finalSkeleton5"),
          },
        ]}
        onClose={() => onClose()}
        bumpkinImage={skeleton}
      />
    );
  }

  if (showRepeatDialogue) {
    return (
      <SpeakingModal
        message={[
          {
            text: t("halloween.finalSkeleton4"),
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
            text: t("halloween.finalSkeleton1"),
          },
          {
            text: t("halloween.finalSkeleton2"),
          },
          {
            text: t("halloween.finalSkeleton3"),
          },
        ]}
        onClose={() => {
          portalService.send("SET_FIRST_DIALOGUE_NPCS", { npcName });
          EventBus.emit("apply-relic-buff", data?.relicName);
          portalService.send("GAIN_POINTS");
          setShowFirstDialogue(false);
        }}
        bumpkinImage={skeleton}
      />
    );
  }

  return (
    <div className="pointer-events-none flex justify-center fixed top-0 left-0 w-full h-screen">
      <div className="flex flex-col w-[200px] items-center justify-center text-center gap-3">
        <img src={relic.image} alt="fader" className="w-full pb-3" />
        <span>{t("halloween.gotRelic", { relic: data?.relicName })}</span>
        <Label type="info" icon={lightning} style={{ textAlign: "center" }}>
          {relic.description}
        </Label>
        <span>{t("halloween.tapToContinue")}</span>
      </div>
    </div>
  );
};
