import React, { useContext } from "react";
import { PortalLeaderboard } from "features/world/ui/portals/PortalLeaderboard";
// import * as AuthProvider from "features/auth/lib/Provider";
// import { Context } from "features/game/GameProvider";
import { PortalMachineState } from "../../lib/halloweenMachine";
import { PortalContext } from "../../lib/PortalProvider";
import { decodeToken } from "features/auth/actions/login";
import { useSelector } from "@xstate/react";
import { getDaysPassedSince, getScoreTime } from "../../lib/HalloweenUtils";
import { millisecondsToString } from "lib/utils/time";
import {
  INITIAL_DATE_LEADERBOARD,
  TIME_SCORE_BASE,
} from "../../HalloweenConstants";
import { useAppTranslation } from "lib/i18n/useAppTranslations";

const PORTAL_NAME = "halloween";

const _jwt = (state: PortalMachineState) => state.context.jwt;

export const HalloweenLeaderboard: React.FC = () => {
  const { t } = useAppTranslation();
  const { portalService } = useContext(PortalContext);
  //   const { gameService } = useContext(Context);
  //   const { authService } = useContext(AuthProvider.Context);

  const jwt = useSelector(portalService, _jwt);

  const farmId = decodeToken(jwt as string).farmId;

  return (
    <div className="flex flex-col gap-2 overflow-y-auto scrollable max-h-[75vh]">
      <div className="flex flex-col gap-2 px-2 pt-2">
        <p>{t("halloween.competition.description1")}</p>
        <p>{t("halloween.competition.description2")}</p>
      </div>
      <PortalLeaderboard
        isAccumulator
        name={PORTAL_NAME}
        startDate={new Date(Date.UTC(2025, 9, 29))}
        endDate={new Date(Date.UTC(2025, 10, 4))}
        farmId={Number(farmId)}
        formatPoints={(points) => {
          if (points <= 200) return (0).toString();
          const milliseconds = getScoreTime(
            points,
            getDaysPassedSince(INITIAL_DATE_LEADERBOARD),
          );
          if (milliseconds === TIME_SCORE_BASE) return (0).toString();
          return millisecondsToString(milliseconds, { length: "full" });
        }}
        jwt={jwt as string}
      />
    </div>
  );
};
