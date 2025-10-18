import { SpeakingModal } from "features/game/components/SpeakingModal";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import React from "react";

interface Props {
  onClose: () => void;
  data?: any;
}

export const PlayerNPC: React.FC<Props> = ({ onClose, data }) => {
  const { t } = useAppTranslation();

  return (
    <SpeakingModal
      message={[
        {
          text: t("halloween.playerBlockedDoor", {
            amount: data?.requiredRelics,
          }),
        },
      ]}
      onClose={() => onClose()}
      bumpkinParts={data?.bumpkinParts}
    />
  );
};
