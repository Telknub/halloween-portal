import React, { useContext } from "react";
import { PortalLeaderboard } from "features/world/ui/portals/PortalLeaderboard";
// import * as AuthProvider from "features/auth/lib/Provider";
// import { Context } from "features/game/GameProvider";
import { PortalMachineState } from "../../lib/halloweenMachine";
import { PortalContext } from "../../lib/PortalProvider";
import { decodeToken } from "features/auth/actions/login";
import { useSelector } from "@xstate/react";

const PORTAL_NAME = "halloween";

const _jwt = (state: PortalMachineState) => state.context.jwt;

export const HalloweenLeaderboard: React.FC = () => {
  const { portalService } = useContext(PortalContext);
  //   const { gameService } = useContext(Context);
  //   const { authService } = useContext(AuthProvider.Context);

  const jwt = useSelector(portalService, _jwt);

  const farmId = decodeToken(jwt as string).farmId;

  return (
    <PortalLeaderboard
      name={PORTAL_NAME}
      startDate={new Date(Date.UTC(2025, 9, 25))}
      endDate={new Date(Date.UTC(2025, 10, 3))}
      farmId={Number(farmId)}
      jwt={jwt as string}
    />
  );
};
