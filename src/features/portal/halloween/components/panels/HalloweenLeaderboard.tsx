import React, { useContext } from "react";
import { PortalLeaderboard } from "features/world/ui/portals/PortalLeaderboard";
import * as AuthProvider from "features/auth/lib/Provider";
import { Context } from "features/game/GameProvider";

const PORTAL_NAME = "halloween";

export const HalloweenLeaderboard: React.FC = () => {
  const { gameService } = useContext(Context);
  const { authService } = useContext(AuthProvider.Context);

  return (
    <PortalLeaderboard
      name={PORTAL_NAME}
      startDate={new Date(Date.UTC(2025, 5, 30))}
      endDate={new Date(Date.UTC(2025, 6, 6))}
      farmId={gameService.getSnapshot().context.farmId}
      jwt={authService.getSnapshot().context.user.rawToken as string}
    />
  );
};
