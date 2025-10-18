import { SpeakingModal } from "features/game/components/SpeakingModal";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import React, { useContext, useEffect, useState } from "react";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { INITIAL_SKELETON_KEY } from "../../HalloweenConstants";
import { PortalContext } from "../../lib/PortalProvider";

import skeleton from "public/world/skeletonPortrait.png";
import sword from "public/world/sword.webp";
import { EventBus } from "../../lib/EventBus";

interface Props {
  onClose: () => void;
}

export const InitialSkeletonNPC: React.FC<Props> = ({ onClose }) => {
  const { portalService } = useContext(PortalContext);
  const [showFirstDialogue, setShowFirstDialogue] = useState(true);
  const [showRepeatDialogue, setShowRepeatDialogue] = useState(false);
  const { t } = useAppTranslation();

  useEffect(() => {
    const alreadyCompleted =
      localStorage.getItem(INITIAL_SKELETON_KEY) === "true";

    if (alreadyCompleted) {
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
          localStorage.setItem(INITIAL_SKELETON_KEY, "true");
          setShowFirstDialogue(false);
          portalService.send("COLLECT_TOOL", { tool: "sword" });
          EventBus.emit("open-gate");
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
        <img src={sword} alt="fader" className="w-full pb-3" />
        <span>{t("halloween.gotSword")}</span>
        <span>{t("halloween.tapToContinue")}</span>
      </div>
    </div>
  );
};
