import React, { useContext } from "react";

import { useSelector } from "@xstate/react";
import { Button } from "components/ui/Button";

import { PortalContext } from "../../lib/PortalProvider";
import { Label } from "components/ui/Label";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { PortalMachineState } from "../../lib/halloweenMachine";
import { CloseButtonPanel } from "features/game/components/CloseablePanel";
import {
  PANEL_NPC_WEARABLES,
  RESTOCK_ATTEMPTS,
  UNLIMITED_ATTEMPTS_SFL,
} from "../../HalloweenConstants";
import { purchase } from "features/portal/lib/portalUtil";
import { SUNNYSIDE } from "assets/sunnyside";
import { setPrecision } from "lib/utils/formatNumber";
import flowerIcon from "assets/icons/flower_token.webp";
import Decimal from "decimal.js-light";
import { PIXEL_SCALE } from "features/game/lib/constants";

const PORTAL_NAME = "halloween";

const _sflBalance = (state: PortalMachineState) =>
  state.context.state?.balance ?? new Decimal(0);

export const HalloweenNoAttemptsPanel: React.FC = () => {
  const { portalService } = useContext(PortalContext);
  const { t } = useAppTranslation();

  const sflBalance = useSelector(portalService, _sflBalance);

  return (
    <CloseButtonPanel bumpkinParts={PANEL_NPC_WEARABLES}>
      <div className="p-2">
        <div className="flex gap-1 justify-between items-center mb-2">
          <Label icon={SUNNYSIDE.icons.lock} type="danger">
            {t(`${PORTAL_NAME}.noAttemptsRemaining`)}
          </Label>
          <Label
            icon={flowerIcon}
            type={sflBalance.lt(RESTOCK_ATTEMPTS[0].sfl) ? "danger" : "default"}
          >
            {t(`${PORTAL_NAME}.flowerRequired`)}
          </Label>
        </div>

        <p className="text-sm mb-2">
          {t(`${PORTAL_NAME}.youHaveRunOutOfAttempts`)}
        </p>
        <p className="text-sm mb-2">
          {t(`${PORTAL_NAME}.wouldYouLikeToUnlock`)}
        </p>

        <div className="flex items-center space-x-1 relative">
          <p className="balance-text">{setPrecision(sflBalance).toString()}</p>
          <img
            src={flowerIcon}
            alt="FLOWER"
            style={{
              width: `${PIXEL_SCALE * 11}px`,
            }}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Button onClick={() => portalService.send("CANCEL_PURCHASE")}>
          {t("back")}
        </Button>
        {RESTOCK_ATTEMPTS.map((option, index) => (
          <Button
            key={index}
            disabled={sflBalance.lt(option.sfl)}
            onClick={() =>
              purchase({
                sfl: option.sfl,
                items: {},
              })
            }
          >
            {t(`${PORTAL_NAME}.buyAttempts`, {
              attempts: option.attempts,
              sfl: option.sfl,
            })}
          </Button>
        ))}
        {UNLIMITED_ATTEMPTS_SFL > 0 ? (
          <Button
            disabled={sflBalance.lt(UNLIMITED_ATTEMPTS_SFL)}
            onClick={() =>
              purchase({
                sfl: UNLIMITED_ATTEMPTS_SFL,
                items: {},
              })
            }
          >
            {t(`${PORTAL_NAME}.unlockAttempts`, {
              sfl: UNLIMITED_ATTEMPTS_SFL,
            })}
          </Button>
        ) : (
          ""
        )}
      </div>
    </CloseButtonPanel>
  );
};
