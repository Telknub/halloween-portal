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

interface Props {
  onClose: () => void;
  data?: any;
}

export const FinalSkeletonNPC: React.FC<Props> = ({ onClose, data }) => {
  const { portalService } = useContext(PortalContext);
  const [showFirstDialogue, setShowFirstDialogue] = useState(true);
  const [showRepeatDialogue, setShowRepeatDialogue] = useState(false);
  const { t } = useAppTranslation();
  const relic = RELIC_CODEX?.[data?.relicName as Relics];

  useEffect(() => {
    const alreadyCompleted =
      localStorage.getItem(FINAL_SKELETON_KEY) === "true";

    if (alreadyCompleted) {
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
          localStorage.setItem(FINAL_SKELETON_KEY, "true");
          EventBus.emit("apply-relic-buff", data?.relicName);
          portalService.send("GAIN_POINTS");
          setShowFirstDialogue(false);
        }}
        bumpkinImage={skeleton}
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
