import React, { useContext } from "react";
import { SlidingPuzzle } from "../../map/rooms/types/SlidingPuzzle";
import { RelicModal } from "../interactables/RelicModal";
import { EventBus } from "../../lib/EventBus";
import { PortalContext } from "../../lib/PortalProvider";
import { SudokuHalloween } from "../../map/rooms/types/SudokuHalloween";

interface Props {
  onClose: () => void;
  data?: any;
}

export const OwlNPC: React.FC<Props> = ({ onClose, data }) => {
  const { portalService } = useContext(PortalContext);
  const [showPuzzle, setShowPuzzle] = React.useState(true);

  const [puzzleType] = React.useState(() =>
    Math.random() < 0.5 ? "sudoku" : "sliding",
  );

  const getRelic = () => {
    setShowPuzzle(false);
    EventBus.emit("apply-relic-buff", data?.relicName);
    portalService.send("GAIN_POINTS");
  };

  if (showPuzzle) {
    if (puzzleType === "sudoku") {
      return <SudokuHalloween onClose={onClose} onAction={getRelic} />;
    }
    return <SlidingPuzzle onClose={onClose} onAction={getRelic} />;
  }

  return <RelicModal onClose={onClose} data={data} />;
};
