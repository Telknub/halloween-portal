import React, { useEffect } from "react";
import { useInterpret } from "@xstate/react";
import { MachineInterpreter, portalMachine } from "./halloweenMachine";
import {
  RESTOCK_ATTEMPTS,
  UNLIMITED_ATTEMPTS_SFL,
} from "../HalloweenConstants";

interface PortalContext {
  portalService: MachineInterpreter;
}

export const PortalContext = React.createContext<PortalContext>(
  {} as PortalContext,
);

export const PortalProvider: React.FC = ({ children }) => {
  const portalService = useInterpret(
    portalMachine,
  ) as unknown as MachineInterpreter;

  /**
   * Below is how we can listen to messages from the parent window
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const option = RESTOCK_ATTEMPTS.find(
        (option) => option.sfl === event.data.sfl,
      );
      if (event.data.event === "purchased" && option) {
        portalService.send("PURCHASED_RESTOCK", { sfl: option.sfl });
      } else if (
        event.data.event === "purchased" &&
        event.data.sfl === UNLIMITED_ATTEMPTS_SFL
      ) {
        portalService.send("PURCHASED_UNLIMITED");
      }
    };

    // Add event listener to listen for messages from the parent window
    window.addEventListener("message", handleMessage);

    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <PortalContext.Provider value={{ portalService }}>
      {children}
    </PortalContext.Provider>
  );
};
