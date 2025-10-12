import { SpeakingModal } from "features/game/components/SpeakingModal";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import React, { useEffect, useState } from "react";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { FINAL_SKELETON_KEY } from "../../HalloweenConstants";

import skeleton from "public/world/skeletonPortrait.png";
import sword from "public/world/sword.webp";

interface Props {
  onClose: () => void;
}

export const FinalSkeletonNPC: React.FC<Props> = ({ onClose }) => {
  const [showFirstDialogue, setShowFirstDialogue] = useState(true);
  const [showRepeatDialogue, setShowRepeatDialogue] = useState(false);
  const { t } = useAppTranslation();

  useEffect(() => {
    const alreadyCompleted =
      localStorage.getItem(FINAL_SKELETON_KEY) === "true";

    if (alreadyCompleted) {
      setShowRepeatDialogue(true);
    }
  }, []);

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
        <img src={sword} alt="fader" className="w-full pb-3" />
        <span>{t("halloween.gotSword")}</span>
        <span>{t("halloween.tapToContinue")}</span>
      </div>
    </div>
  );
};
