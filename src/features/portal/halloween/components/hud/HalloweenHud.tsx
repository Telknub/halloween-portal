import React, { useContext, useEffect } from "react";
import { useSelector } from "@xstate/react";
import { PortalContext } from "../../lib/PortalProvider";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { HudContainer } from "components/ui/HudContainer";
import { PortalMachineState } from "../../lib/halloweenMachine";
import { HalloweenScore } from "./HalloweenScore";
import { HalloweenInventory } from "./HalloweenInventory";
import { useAchievementToast } from "../../providers/AchievementToastProvider";
import { HalloweenTarget } from "./HalloweenTarget";
import { HalloweenLives } from "./HalloweenLives";
import { HalloweenTimer } from "./HalloweenTimer";
import { HalloweenTravel } from "./HalloweenTravel";

const _isJoystickActive = (state: PortalMachineState) =>
  state.context.isJoystickActive;
const _achievements = (state: PortalMachineState) =>
  state.context.state?.minigames.games["halloween"]?.achievements ?? {};
const _isPlaying = (state: PortalMachineState) => state.matches("playing");

export const HalloweenHud: React.FC = () => {
  const { portalService } = useContext(PortalContext);

  const isJoystickActive = useSelector(portalService, _isJoystickActive);
  const achievements = useSelector(portalService, _achievements);
  const isPlaying = useSelector(portalService, _isPlaying);

  // achievement toast provider
  const { showAchievementToasts } = useAchievementToast();

  // show new achievements
  const [existingAchievementNames, setExistingAchievements] = React.useState(
    Object.keys(achievements),
  );
  useEffect(() => {
    const achievementNames = Object.keys(achievements);
    const newAchievementNames = achievementNames.filter(
      (achievement) => !existingAchievementNames.includes(achievement),
    );

    if (newAchievementNames.length > 0) {
      showAchievementToasts(newAchievementNames);
      setExistingAchievements(achievementNames);
    }
  }, [achievements]);

  return (
    <HudContainer>
      <div>
        <div
          className="absolute flex flex-col gap-1"
          style={{
            top: `${PIXEL_SCALE * 4}px`,
            left: `${PIXEL_SCALE * 6}px`,
          }}
        >
          {isPlaying && (
            <>
              <HalloweenLives />
              <HalloweenTimer />
              <HalloweenTarget />
              <HalloweenScore />
            </>
          )}
        </div>

        <HalloweenTravel />
        {/* <HalloweenSettings /> */}
        {isPlaying && (
          <>
            <HalloweenInventory />
          </>
        )}
      </div>
    </HudContainer>
  );
};
