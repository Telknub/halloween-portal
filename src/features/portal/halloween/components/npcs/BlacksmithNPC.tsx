import { SpeakingModal } from "features/game/components/SpeakingModal";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import React, { useEffect, useState } from "react";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { BLACKSMITH_KEY, RELIC_CODEX, Relics } from "../../HalloweenConstants";
import { Label } from "components/ui/Label";

import blacksmith from "public/world/blacksmithPortrait.png";
import lightning from "assets/icons/lightning.png";
import { EventBus } from "../../lib/EventBus";

interface Props {
  onClose: () => void;
  data?: any;
}

export const BlacksmithNPC: React.FC<Props> = ({ onClose, data }) => {
  const [showFirstDialogue, setShowFirstDialogue] = useState(true);
  const [showRepeatDialogue, setShowRepeatDialogue] = useState(false);
  const { t } = useAppTranslation();
  const relic = RELIC_CODEX?.[data?.relicName as Relics];

  useEffect(() => {
    const alreadyCompleted = localStorage.getItem(BLACKSMITH_KEY) === "true";

    if (alreadyCompleted) {
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
          localStorage.setItem(BLACKSMITH_KEY, "true");
          EventBus.emit("apply-relic-buff", data?.relicName);
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
