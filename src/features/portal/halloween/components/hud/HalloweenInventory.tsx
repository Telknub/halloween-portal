import React, { useContext } from "react";
import { useSelector } from "@xstate/react";
import { PortalContext } from "../../lib/PortalProvider";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { Label } from "components/ui/Label";
import { PortalMachineState } from "../../lib/halloweenMachine";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { Box } from "components/ui/Box";
import Decimal from "decimal.js-light";

import sword from "public/world/sword_icon.png";
import pickaxe from "public/world/pickaxe_icon.png";
import lampFront from "assets/halloween/lamp_front.gif";
import bone from "public/world/bone1.png";

const _tools = (state: PortalMachineState) => state.context.tools;
const _selectedTool = (state: PortalMachineState) => state.context.selectedTool;
const _bones = (state: PortalMachineState) => state.context.bones;

const toolImages = {
  sword: sword,
  pickaxe: pickaxe,
  lamp: lampFront,
};

export const HalloweenInventory: React.FC = () => {
  const { t } = useAppTranslation();

  const { portalService } = useContext(PortalContext);

  const tools = useSelector(portalService, _tools);
  const selectedTool = useSelector(portalService, _selectedTool);
  const bones = useSelector(portalService, _bones);

  return (
    <>
      <div
        className="absolute flex flex-col items-center"
        style={{
          top: `${PIXEL_SCALE * 3}px`,
          right: `${PIXEL_SCALE * 3}px`,
        }}
      >
        {tools.length ? (
          <>
            <Label type={"default"}>{t("halloween.tools")}</Label>
            <div className="relative flex flex-col items-center">
              {tools.map((tool, i) => (
                <Box
                  key={i}
                  image={toolImages[tool]}
                  onClick={() => {
                    return;
                  }}
                  isSelected={selectedTool === tool}
                />
              ))}
            </div>
          </>
        ) : (
          ""
        )}
        {bones ? (
          <>
            <Label type={"default"}>{t("halloween.items")}</Label>
            <div className="relative flex flex-col items-center">
              <Box image={bone} count={new Decimal(bones)} />
            </div>
          </>
        ) : (
          ""
        )}
      </div>
    </>
  );
};
