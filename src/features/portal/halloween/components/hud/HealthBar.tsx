import React, { useContext } from "react";
import { useSelector } from "@xstate/react";
import heartIcon from "assets/icons/bw_heart.png";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { PortalContext } from "../../lib/PortalProvider"; 
import { PortalMachineState } from "features/portal/halloween/lib/halloweenMachine";
import { PLAYER_MAX_HEALTH } from "features/portal/halloween/HalloweenConstants";

const _health = (state: PortalMachineState) => state.context.health;

export const HealthBar: React.FC = () => {
  const { portalService } = useContext(PortalContext);
  const health = useSelector(portalService, _health);

  return (
    <div className="flex items-center mb-1">
      {Array.from({ length: PLAYER_MAX_HEALTH }).map((_, index) => (
        <img
          key={index}
          src={heartIcon}
          className="mr-1.5"
          style={{
            width: `${PIXEL_SCALE * 9}px`,
            opacity: index < health ? 1 : 0.4,
          }}
        />
      ))}
    </div>
  );
};