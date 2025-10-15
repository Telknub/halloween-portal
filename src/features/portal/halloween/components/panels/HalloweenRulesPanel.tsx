import React, { useState } from "react";

import { SUNNYSIDE } from "assets/sunnyside";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { CloseButtonPanel } from "features/game/components/CloseablePanel";
import { HalloweenMission } from "./HalloweenMission";
import { HALLOWEEN_NPC_WEARABLES } from "../../HalloweenConstants";
import { HalloweenDonations } from "./HalloweenDonations";

interface Props {
  mode: "introduction" | "success" | "failed";
  showScore: boolean;
  showExitButton: boolean;
  confirmButtonText: string;
  onConfirm: () => void;
}
export const HalloweenRulesPanel: React.FC<Props> = ({
  mode,
  showScore,
  showExitButton,
  confirmButtonText,
  onConfirm,
}) => {
  const { t } = useAppTranslation();
  const [tab, setTab] = useState(0);

  return (
    <CloseButtonPanel
      className="overflow-y-hidden"
      bumpkinParts={HALLOWEEN_NPC_WEARABLES}
      currentTab={tab}
      setCurrentTab={setTab}
      tabs={[
        {
          icon: SUNNYSIDE.icons.plant,
          name: t("halloween.mission"),
        },
        // {
        //   icon: SUNNYSIDE.icons.heart,
        //   name: t("donate"),
        // },
      ]}
    >
      <>
        {tab === 0 && (
          <HalloweenMission
            mode={mode}
            showScore={showScore}
            showExitButton={showExitButton}
            confirmButtonText={confirmButtonText}
            onConfirm={onConfirm}
          />
        )}
        {/* {tab === 1 && <HalloweenDonations />} */}
      </>
    </CloseButtonPanel>
  );
};
