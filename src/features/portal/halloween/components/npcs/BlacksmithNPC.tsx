import { SpeakingModal } from "features/game/components/SpeakingModal";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import React, { useContext, useEffect, useState } from "react";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { BLACKSMITH_KEY, RELIC_CODEX, Relics } from "../../HalloweenConstants";
import { Label } from "components/ui/Label";
import { EventBus } from "../../lib/EventBus";
import { PortalContext } from "../../lib/PortalProvider";

import blacksmith from "public/world/blacksmithPortrait.png";
import lightning from "assets/icons/lightning.png";
import { useSelector } from "@xstate/react";
import { PortalMachineState } from "../../lib/halloweenMachine";

interface Props {
  onClose: () => void;
  data?: any;
}

const _firstDialogueNPCs = (state: PortalMachineState) =>
  state.context.firstDialogueNPCs;

export const BlacksmithNPC: React.FC<Props> = ({ onClose, data }) => {
  const { portalService } = useContext(PortalContext);
  const [showFirstDialogue, setShowFirstDialogue] = useState(true);
  const [showRepeatDialogue, setShowRepeatDialogue] = useState(false);
  const { t } = useAppTranslation();
  const relic = RELIC_CODEX?.[data?.relicName as Relics];
  const npcName = "blacksmith";

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
            text: t("halloween.blacksmith2"),
          },
        ]}
        onClose={() => onClose()}
        bumpkinImage={blacksmith}
      />
    );
  }

  if (showFirstDialogue) {
    return (
      <SpeakingModal
        message={[
          {
            text: t("halloween.blacksmith1"),
          },
        ]}
        onClose={() => {
          portalService.send("SET_FIRST_DIALOGUE_NPCS", { npcName });
          EventBus.emit("apply-relic-buff", data?.relicName);
          EventBus.emit("get-aura");
          portalService.send("GAIN_POINTS");
          setShowFirstDialogue(false);
        }}
        bumpkinImage={blacksmith}
      />
    );
  }

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        zIndex: -10,
        top: `${PIXEL_SCALE * -61}px`,
        left: `${PIXEL_SCALE * 50}px`,
        width: "100%",

        fontFamily: "Basic",
        color: "white",
      }}
    >
      <div className="absolute w-60 flex flex-col items-center justify-center gap-3">
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
