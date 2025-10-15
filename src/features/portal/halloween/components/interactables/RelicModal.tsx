import { useAppTranslation } from "lib/i18n/useAppTranslations";
import React from "react";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { RELIC_CODEX, Relics } from "../../HalloweenConstants";
import { Label } from "components/ui/Label";

import lightning from "assets/icons/lightning.png";

interface Props {
  onClose: () => void;
  data?: any;
}

export const RelicModal: React.FC<Props> = ({ onClose, data }) => {
  const { t } = useAppTranslation();
  const relic = RELIC_CODEX?.[data?.relicName as Relics];

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
        <img src={relic?.image} alt="fader" className="w-full pb-3" />
        <span>{t("halloween.gotRelic", { relic: data?.relicName })}</span>
        <Label type="info" icon={lightning} style={{ textAlign: "center" }}>
          {relic?.description}
        </Label>
        <span>{t("halloween.tapToContinue")}</span>
      </div>
    </div>
  );
};
