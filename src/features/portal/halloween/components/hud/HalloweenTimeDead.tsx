import React, { useContext, useEffect, useState } from "react";
import { useSelector } from "@xstate/react";
import { PortalContext } from "../../lib/PortalProvider";
import { SUNNYSIDE } from "assets/sunnyside";
import { secondsToString } from "lib/utils/time";
import { Label } from "components/ui/Label";
import { PortalMachineState } from "../../lib/halloweenMachine";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { DURATION_GAME_OVER_WITHOUT_LAMPS_SECONDS } from "../../HalloweenConstants";
import { PIXEL_SCALE } from "features/game/lib/constants";

const _lamps = (state: PortalMachineState) => state.context.lamps;
const _isPlaying = (state: PortalMachineState) => state.matches("playing");

export const HalloweenTimeDead: React.FC = () => {
  const { t } = useAppTranslation();

  const { portalService } = useContext(PortalContext);

  const lamps = useSelector(portalService, _lamps);
  const isPlaying = useSelector(portalService, _isPlaying);

  const [timeLeft, setTimeLeft] = useState(
    DURATION_GAME_OVER_WITHOUT_LAMPS_SECONDS,
  );

  useEffect(() => {
    if (lamps === 0) {
      setTimeLeft(DURATION_GAME_OVER_WITHOUT_LAMPS_SECONDS);
      let time = DURATION_GAME_OVER_WITHOUT_LAMPS_SECONDS;
      const intervalId = setInterval(() => {
        const newTimeLeft = time - 1;
        if (newTimeLeft <= 0) {
          portalService.send("DEAD_LAMP", { lamps: 1 });
          clearInterval(intervalId);
        }

        setTimeLeft(newTimeLeft);
        time = newTimeLeft;
      }, 1000);

      return () => clearInterval(intervalId);
    } else {
      setTimeLeft(DURATION_GAME_OVER_WITHOUT_LAMPS_SECONDS);
    }
  }, [lamps]);

  return (
    <div
      className="absolute flex flex-col items-center w-screen"
      style={{
        bottom: `${PIXEL_SCALE * 3}px`,
      }}
    >
      {lamps === 0 && isPlaying && (
        <Label
          className="space-x-2 text-xs"
          icon={SUNNYSIDE.decorations.skull}
          type={"dead"}
          style={{ fontSize: "28px", paddingTop: "5px", paddingBottom: "5px" }}
        >
          {t("halloween.lose", {
            time: secondsToString(timeLeft, {
              length: "full",
            }),
          })}
        </Label>
      )}
    </div>
  );
};
