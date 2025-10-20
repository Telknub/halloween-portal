import React, { useContext, useState } from "react";
import { useSelector } from "@xstate/react";
import { PortalContext } from "../../lib/PortalProvider";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { Label } from "components/ui/Label";
import { PortalMachineState } from "../../lib/halloweenMachine";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { Box } from "components/ui/Box";
import { useSound } from "lib/utils/hooks/useSound";
import { RoundButton } from "components/ui/RoundButton";
import { Modal } from "components/ui/Modal";
import { CloseButtonPanel } from "features/game/components/CloseablePanel";
import {
  Bones,
  Relics,
  STATUE_EFFECTS,
  statueEffects,
} from "../../HalloweenConstants";
import classNames from "classnames";
import { InnerPanel } from "components/ui/Panel";

import sword from "public/world/sword_icon.png";
import pickaxe from "public/world/pickaxe_icon.png";
import lampFront from "assets/halloween/lamp_front.gif";
import relic from "public/world/relic1.png";
import bone from "public/world/bone1.png";
import shopIcon from "assets/icons/shop.png";
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

const _tools = (state: PortalMachineState) => state.context.tools;
const _selectedTool = (state: PortalMachineState) => state.context.selectedTool;
const _boneCodex = (state: PortalMachineState) => state.context.boneCodex;
const _relicCodex = (state: PortalMachineState) => state.context.relicCodex;
const _statueEffects = (state: PortalMachineState) =>
  state.context.statueEffects;

const toolImages = {
  sword: sword,
  pickaxe: pickaxe,
  lamp: lampFront,
};

export const HalloweenInventory: React.FC = () => {
  const { t } = useAppTranslation();
  const { portalService } = useContext(PortalContext);
  const [showInventory, setShowInventory] = useState(false);
  const [tab, setTab] = useState(0);

  const tools = useSelector(portalService, _tools);
  const selectedTool = useSelector(portalService, _selectedTool);

  const button = useSound("button");

  const closeModal = () => {
    setShowInventory(false);
  };

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
        <RoundButton
          onClick={() => {
            button.play();
            setShowInventory(true);
          }}
        >
          <img
            src={shopIcon}
            className="absolute group-active:translate-y-[2px]"
            style={{
              width: `${PIXEL_SCALE * 12}px`,
              left: `${PIXEL_SCALE * 5}px`,
              top: `${PIXEL_SCALE * 4}px`,
            }}
          />
        </RoundButton>
        <Modal show={showInventory} onHide={closeModal}>
          <CloseButtonPanel
            className="overflow-y-hidden"
            currentTab={tab}
            setCurrentTab={setTab}
            onClose={closeModal}
            tabs={[
              {
                icon: shopIcon,
                name: t("halloween.inventory"),
              },
              {
                icon: statue1,
                name: t("halloween.statueEffects"),
              },
            ]}
          >
            {tab === 0 && <ContentModalInventory />}
            {tab === 1 && <ContentStatueEffects />}
          </CloseButtonPanel>
        </Modal>
      </div>
    </>
  );
};

const ContentModalInventory: React.FC = () => {
  const { t } = useAppTranslation();
  const { portalService } = useContext(PortalContext);
  const [selectedItem, setSelectedItem] = useState("");

  const boneCodex = useSelector(portalService, _boneCodex);
  const relicCodex = useSelector(portalService, _relicCodex);
  const itemCodex = { ...relicCodex, ...boneCodex };

  const capitalize = (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  return (
    <>
      <div>
        <Label type="default" icon={relic} className="ml-3 mt-2">
          {t("halloween.relics")}
        </Label>
        <div className="flex flex-wrap p-1 gap-1 max-h-80 overflow-y-auto scrollable">
          {Object.keys(relicCodex).map((relicName, i) => (
            <Box
              key={i}
              iconClassName={classNames({
                silhouette: !relicCodex[relicName as Relics].isFound,
              })}
              image={relicCodex[relicName as Relics].image}
              onClick={() => setSelectedItem(relicName)}
              isSelected={selectedItem === relicName}
            />
          ))}
        </div>
      </div>
      <div>
        <Label type="default" icon={bone} className="ml-3">
          {t("halloween.bones")}
        </Label>
        <div className="flex flex-wrap p-1 gap-1 max-h-80  overflow-y-auto scrollable">
          {Object.keys(boneCodex).map((boneName, i) => (
            <Box
              key={i}
              iconClassName={classNames({
                silhouette: !boneCodex[boneName as Bones].isFound,
              })}
              image={boneCodex[boneName as Bones].image}
              onClick={() => setSelectedItem(boneName)}
              isSelected={selectedItem === boneName}
            />
          ))}
        </div>
      </div>
      {selectedItem && (
        <InnerPanel
          className="relative bottom-[-7px] left-[-7px] !px-2 !pb-1 z-10"
          style={{ width: "calc(100% + 15px)" }}
        >
          <p className="text-xs flex-1">{capitalize(selectedItem)}</p>
          {itemCodex[selectedItem as Relics | Bones]?.description && (
            <div className="mt-1">
              <Label type="info" icon={lightning}>
                {itemCodex[selectedItem as Relics | Bones]?.description}
              </Label>
            </div>
          )}
        </InnerPanel>
      )}
    </>
  );
};

const ContentStatueEffects: React.FC = () => {
  const { t } = useAppTranslation();
  const { portalService } = useContext(PortalContext);
  const [selectedItem, setSelectedItem] = useState("");

  const statueEffects = useSelector(portalService, _statueEffects);

  return (
    <>
      <div>
        <Label type="default" icon={statue1} className="ml-3 mt-2">
          {t("halloween.statueEffects")}
        </Label>
        <div className="flex flex-wrap p-1 gap-1 max-h-80 overflow-y-auto scrollable">
          {statueEffects.map((statueEffect, i) => (
            <Box
              key={i}
              image={statues[statueEffect.statueName]}
              onClick={() => setSelectedItem(statueEffect.effect)}
              isSelected={selectedItem === statueEffect.effect}
            />
          ))}
        </div>
      </div>
      {selectedItem && (
        <InnerPanel
          className="relative bottom-[-7px] left-[-7px] !px-2 !pb-1 z-10"
          style={{ width: "calc(100% + 15px)" }}
        >
          {STATUE_EFFECTS[selectedItem as statueEffects] && (
            <div className="mt-1">
              <Label type="info" icon={lightning}>
                {STATUE_EFFECTS[selectedItem as statueEffects]}
              </Label>
            </div>
          )}
        </InnerPanel>
      )}
    </>
  );
};
