import React, { useState } from "react";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { CloseButtonPanel } from "features/game/components/CloseablePanel";
import { HalloweenMission } from "./HalloweenMission";
import { PANEL_NPC_WEARABLES } from "../../HalloweenConstants";
import { HalloweenGuide } from "./HalloweenGuide";

import page from "public/world/page.png";
import envy from "public/world/relic1.png";
import trophy from "assets/icons/trophy.png";
import { HalloweenLeaderboard } from "./HalloweenLeaderboard";

interface Props {
  mode: "introduction" | "success" | "failed";
  showScore: boolean;
  showExitButton: boolean;
  confirmButtonText: string;
  onConfirm: () => void;
  trainingButtonText?: string;
  onTraining?: () => void;
}
export const HalloweenRulesPanel: React.FC<Props> = ({
  mode,
  showScore,
  showExitButton,
  confirmButtonText,
  onConfirm,
  trainingButtonText,
  onTraining,
}) => {
  const { t } = useAppTranslation();
  const [tab, setTab] = useState(0);

  return (
    <CloseButtonPanel
      className="overflow-y-hidden"
      bumpkinParts={PANEL_NPC_WEARABLES}
      currentTab={tab}
      setCurrentTab={setTab}
      tabs={[
        {
          icon: envy,
          name: t("halloween.mission"),
        },
        {
          icon: page,
          name: t("guide"),
        },
        {
          icon: trophy,
          name: t("competition.leaderboard"),
        },
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
            trainingButtonText={trainingButtonText}
            onTraining={onTraining}
          />
        )}
        {tab === 1 && <HalloweenGuide />}
        {tab === 2 && <HalloweenLeaderboard />}
      </>
    </CloseButtonPanel>
  );
};
