import React, { useContext, useEffect, useState } from "react";
import { PortalContext } from "../../lib/PortalProvider";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { ConfirmationModal } from "components/ui/ConfirmationModal";
import { PANEL_NPC_WEARABLES } from "../../HalloweenConstants";

class TravelModalManager {
  private listener?: (isOpen: boolean) => void;

  public open(isOpen: boolean) {
    if (this.listener) {
      this.listener(isOpen);
    }
  }

  public listen(cb: (isOpen: boolean) => void) {
    this.listener = cb;
  }
}

export const travelModalManager = new TravelModalManager();

export const HalloweenTravel: React.FC = () => {
  const { portalService } = useContext(PortalContext);
  const { t } = useAppTranslation();

  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  useEffect(() => {
    travelModalManager.listen((isOpen) => {
      setShowExitConfirmation(isOpen);
    });
  }, []);

  return (
    <>
      <ConfirmationModal
        bumpkinParts={PANEL_NPC_WEARABLES}
        show={showExitConfirmation}
        onHide={() => setShowExitConfirmation(false)}
        messages={[t("halloween.endGameConfirmation")]}
        onCancel={() => setShowExitConfirmation(false)}
        onConfirm={() => {
          portalService.send("END_GAME_EARLY");
          setShowExitConfirmation(false);
        }}
        confirmButtonLabel={t("halloween.endGame")}
      />
    </>
  );
};
