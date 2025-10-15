import React, { useContext } from "react";
import { useSelector } from "@xstate/react";
import { PortalContext } from "../../lib/PortalProvider";
import { PortalMachineState } from "../../lib/halloweenMachine";
import { SUNNYSIDE } from "assets/sunnyside";
import { SquareIcon } from "components/ui/SquareIcon";

import emptyHeart from "public/world/empty_heart.png";

const _lives = (state: PortalMachineState) => state.context.lives;
const _maxLives = (state: PortalMachineState) => state.context.maxLives;

export const HalloweenLives: React.FC = () => {
  const { portalService } = useContext(PortalContext);

  const lives = useSelector(portalService, _lives);
  const maxLives = useSelector(portalService, _maxLives);
  const arrLives = Array.from({ length: lives }, (_, index) => index);
  const arrMaxLives = Array.from(
    { length: maxLives - lives },
    (_, index) => index,
  );

  return (
    <div className="flex gap-2">
      {arrLives.map((_, index) => (
        <SquareIcon key={index} icon={SUNNYSIDE.icons.heart} width={10} />
      ))}
      {arrMaxLives.map((_, index) => (
        <SquareIcon key={index} icon={emptyHeart} width={10} />
      ))}
    </div>
  );
};
