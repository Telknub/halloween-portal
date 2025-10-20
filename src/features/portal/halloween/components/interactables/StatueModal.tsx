import { useAppTranslation } from "lib/i18n/useAppTranslations";
import React from "react";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { STATUE_EFFECTS, statueEffects } from "../../HalloweenConstants";
import { Label } from "components/ui/Label";

import lightning from "assets/icons/lightning.png";
import statue1 from "public/world/statue1_idle.webp";
import statue2 from "public/world/statue2_idle.webp";
import statue3 from "public/world/statue3_idle.webp";
import statue4 from "public/world/statue4_idle.webp";

const statues: Record<string, string> = {
  statue1,
  statue2,
  statue3,
  statue4,
};

interface Props {
  onClose: () => void;
  data?: any;
}

export const StatueModal: React.FC<Props> = ({ onClose, data }) => {
  const { t } = useAppTranslation();
  const description = STATUE_EFFECTS?.[data?.effect as statueEffects];
  const image = statues[data?.statueName];

  return (
    <div className="pointer-events-none flex justify-center fixed top-0 left-0 w-full h-screen">
      <div className="flex flex-col w-[200px] items-center justify-center text-center gap-3">
        <img src={image} alt="fader" className="w-full pb-3" />
        <Label type="info" icon={lightning} style={{ textAlign: "center" }}>
          {description}
        </Label>
        <span>{t("halloween.tapToContinue")}</span>
      </div>
    </div>
  );
};
