import React, { useEffect, useState } from "react";
import { pixelGrayBorderStyle } from "features/game/lib/style";
import { PIXEL_SCALE } from "features/game/lib/constants";
import {
  SLIDING_PUZZLE_IMG,
  SLIDING_PUZZLE_MOVESTOSOLVE,
  VICTORY_TEXT,
} from "features/portal/halloween/HalloweenConstants";

const SIZE_X = 3; // Columns
const SIZE_Y = 3; // Rows
const TOTAL_TILES = SIZE_X * SIZE_Y;

export const SlidingPuzzle: React.FC = () => {
  const [tiles, setTiles] = useState<(number | null)[]>([]);
  const [isSolved, setIsSolved] = useState(false);

  useEffect(() => {
    generatePuzzleAtLeast4MovesAway();
  }, []);

  useEffect(() => {
    if (tiles.length === TOTAL_TILES) {
      setIsSolved(checkIfSolved(tiles));
    }
  }, [tiles]);

  const generatePuzzleAtLeast4MovesAway = () => {
    const solved: (number | null)[] = [0, 1, 2, 3, 4, 5, 6, 7, null];
    const moveCount =
      Math.floor(Math.random() * 3) + SLIDING_PUZZLE_MOVESTOSOLVE;
    let current = [...solved];
    let emptyIndex = current.indexOf(null);

    const visitedStates = new Set<string>();
    visitedStates.add(current.join(","));

    let lastEmptyIndex = emptyIndex;

    for (let moves = 0; moves < moveCount; ) {
      const neighbors = getAdjacentIndices(emptyIndex).filter(
        (n) => n !== lastEmptyIndex,
      ); // avoid undoing
      const randNeighbor =
        neighbors[Math.floor(Math.random() * neighbors.length)];

      const newState = [...current];
      [newState[emptyIndex], newState[randNeighbor]] = [
        newState[randNeighbor],
        newState[emptyIndex],
      ];

      const key = newState.join(",");
      if (!visitedStates.has(key)) {
        visitedStates.add(key);
        lastEmptyIndex = emptyIndex;
        emptyIndex = randNeighbor;
        current = newState;
        moves++;
      }
    }

    setTiles(current);
  };

  const getAdjacentIndices = (index: number) => {
    const x = index % SIZE_X;
    const y = Math.floor(index / SIZE_X);
    const neighbors: number[] = [];

    if (x > 0) neighbors.push(index - 1);
    if (x < SIZE_X - 1) neighbors.push(index + 1);
    if (y > 0) neighbors.push(index - SIZE_X);
    if (y < SIZE_Y - 1) neighbors.push(index + SIZE_X);

    return neighbors;
  };

  const handleTileClick = (index: number) => {
    const emptyIndex = tiles.indexOf(null);
    if (isAdjacent(index, emptyIndex)) {
      const newTiles = [...tiles];
      [newTiles[index], newTiles[emptyIndex]] = [
        newTiles[emptyIndex],
        newTiles[index],
      ];
      setTiles(newTiles);
    }
  };

  const isAdjacent = (i: number, j: number) => {
    const x1 = i % SIZE_X,
      y1 = Math.floor(i / SIZE_X);
    const x2 = j % SIZE_X,
      y2 = Math.floor(j / SIZE_X);
    return Math.abs(x1 - x2) + Math.abs(y1 - y2) === 1;
  };

  const checkIfSolved = (tiles: (number | null)[]) => {
    const solved: (number | null)[] = [0, 1, 2, 3, 4, 5, 6, 7, null];
    return tiles.every((tile, index) => tile === solved[index]);
  };

  const getBackgroundPosition = (index: number) => {
    const x = (index % SIZE_X) * (100 / (SIZE_X - 1));
    const y = Math.floor(index / SIZE_X) * (100 / (SIZE_Y - 1));
    return `${x}% ${y}%`;
  };

  return (
    <div className="fixed top-0 left-0 w-full h-screen bg-black/20 backdrop-blur-md flex items-center justify-center flex-col gap-4">
      <div
        style={{
          width: "min(500px, 90vw)",
          height: "min(500px, 90vw)",
          gridTemplateColumns: `repeat(${SIZE_X}, 1fr)`,
          aspectRatio: "1 / 1", // Ensures it stays square
        }}
        className="grid gap-1"
      >
        {tiles.map((tile, index) => (
          <div
            key={index}
            onClick={() => handleTileClick(index)}
            style={
              tile !== null
                ? {
                    backgroundImage: `url(${SLIDING_PUZZLE_IMG})`,
                    backgroundSize: `${SIZE_X * 100}% ${SIZE_Y * 100}%`,
                    backgroundPosition: getBackgroundPosition(tile),
                  }
                : {}
            }
            className={`w-full h-full rounded cursor-pointer transition-all duration-200 ${
              tile === null ? "bg-black opacity-50" : "bg-cover bg-center"
            }`}
          />
        ))}
      </div>

      {isSolved && (
        <div
          className="absolute bg-blue text-black-400 text-xxl font-bold bg-blue"
          style={{
            ...pixelGrayBorderStyle,
            padding: `${PIXEL_SCALE * 8}px`,
            background: "#546395",
          }}
        >
          {VICTORY_TEXT.SlidinpPuzzle}
        </div>
      )}
    </div>
  );
};
