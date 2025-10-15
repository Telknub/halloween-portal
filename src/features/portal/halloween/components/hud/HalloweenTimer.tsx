import React, { useContext } from "react";
import { useSelector } from "@xstate/react";
import { PortalContext } from "../../lib/PortalProvider";
import { SUNNYSIDE } from "assets/sunnyside";
import { millisecondsToString } from "lib/utils/time";
import useUiRefresher from "lib/utils/hooks/useUiRefresher";
import { Label } from "components/ui/Label";
import { PortalMachineState } from "../../lib/halloweenMachine";

const _startedAt = (state: PortalMachineState) => state.context.startedAt;

export const HalloweenTimer: React.FC = () => {
  useUiRefresher({ delay: 100 });

  const { portalService } = useContext(PortalContext);

  const startedAt = useSelector(portalService, _startedAt);

  const millisecondsPassed = !startedAt
    ? 0
    : Math.max(Date.now() - startedAt, 0);

  return (
    <Label icon={SUNNYSIDE.icons.stopwatch} type={"info"}>
      {millisecondsToString(millisecondsPassed, {
        length: "full",
      })}
    </Label>
  );
};
