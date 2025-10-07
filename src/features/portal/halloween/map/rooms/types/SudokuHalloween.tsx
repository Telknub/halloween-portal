import React, { useState } from "react";
import { SUNNYSIDE } from "assets/sunnyside";
import { pixelGrayBorderStyle } from "features/game/lib/style";
import {
  SUDOKU_COMPLEXITY,
  TEXT,
} from "features/portal/halloween/HalloweenConstants";
import { PIXEL_SCALE } from "features/game/lib/constants";
import eye from "public/world/halloween/Eye.webp";
import brain from "public/world/halloween/Brain.webp";
import skull from "public/world/halloween/Skull.webp";
import bone from "public/world/halloween/Bone.webp";

const shovel = SUNNYSIDE.tools.rusty_shovel;

type ItemID = "eye" | "brain" | "skull" | "bone";
type PuzzleRow = (ItemID | null)[];
type PuzzleGrid = PuzzleRow[];

const ITEM: ItemID[] = ["eye", "brain", "skull", "bone"];

const ITEM_IMAGES: Record<ItemID, string> = {
  eye,
  brain,
  skull,
  bone,
};

// Helper function
function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

function isValid(
  grid: PuzzleGrid,
  row: number,
  col: number,
  item: ItemID,
): boolean {
  for (let i = 0; i < 4; i++) {
    if (grid[row][i] === item || grid[i][col] === item) return false;
  }

  const startRow = Math.floor(row / 2) * 2;
  const startCol = Math.floor(col / 2) * 2;

  for (let r = startRow; r < startRow + 2; r++) {
    for (let c = startCol; c < startCol + 2; c++) {
      if (grid[r][c] === item) return false;
    }
  }

  return true;
}

function generateSolutionGrid(): ItemID[][] {
  const grid: PuzzleGrid = Array.from({ length: 4 }, () => Array(4).fill(null));

  function solve(row = 0, col = 0): boolean {
    if (row === 4) return true;

    const nextRow = col === 3 ? row + 1 : row;
    const nextCol = (col + 1) % 4;

    for (const item of shuffle(ITEM)) {
      if (isValid(grid, row, col, item)) {
        grid[row][col] = item;
        if (solve(nextRow, nextCol)) return true;
        grid[row][col] = null;
      }
    }

    return false;
  }

  if (!solve()) throw new Error("Failed to generate a valid Sudoku solution");

  return grid as ItemID[][];
}

function removeItems(grid: ItemID[][], totalToRemove = 0): PuzzleGrid {
  const flatIndices = shuffle(
    Array.from({ length: 16 }, (_, i) => i), // 4x4 = 16 cells
  ).slice(0, totalToRemove);

  const puzzle: PuzzleGrid = grid.map((row) => row.map((cell) => cell));

  for (const index of flatIndices) {
    const row = Math.floor(index / SUDOKU_COMPLEXITY);
    const col = index % 4;
    puzzle[row][col] = null;
  }

  return puzzle;
}

function generateSudokuPuzzle() {
  const solution = generateSolutionGrid();
  const puzzle = removeItems(solution, 4);
  return { puzzle, solution };
}

export const SudokuHalloween: React.FC = () => {
  const { puzzle: initialPuzzle, solution } = React.useMemo(
    () => generateSudokuPuzzle(),
    [],
  );

  const [puzzle, setPuzzle] = useState<(ItemID | null)[][]>(initialPuzzle);
  const [originalEmptyCells] = useState(
    initialPuzzle.map((row) => row.map((cell) => cell === null)),
  );
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [isSolved, setIsSolved] = useState(false);

  const ItemIDs: ItemID[] = ITEM;

  const handleItemSelect = (item: ItemID) => {
    if (selectedCell) {
      const newPuzzle = puzzle.map((row, rowIndex) =>
        row.map((cell, colIndex) =>
          rowIndex === selectedCell.row && colIndex === selectedCell.col
            ? item
            : cell,
        ),
      );

      setPuzzle(newPuzzle);
      setSelectedCell(null);

      // Check if all user-input cells are filled
      const allFilled = originalEmptyCells.every((row, rowIndex) =>
        row.every((isEditable, colIndex) => {
          return !isEditable || newPuzzle[rowIndex][colIndex] !== null;
        }),
      );

      // Check for solution immediately after move
      if (isPuzzleSolved(newPuzzle, solution)) {
        setIsSolved(true);
      }
    }
  };

  function isPuzzleSolved(puzzle: PuzzleGrid, solution: PuzzleGrid): boolean {
    return puzzle.every((row, rowIndex) =>
      row.every((cell, colIndex) => cell === solution[rowIndex][colIndex]),
    );
  }

  const isCellChangeable = (rowIndex: number, colIndex: number) => {
    return originalEmptyCells[rowIndex][colIndex];
  };

  return (
    <>
      <div className="fixed inset-0 flex flex-row justify-center items-center z-5 w-full h-full bg-black">
        <div className="absolute grid grid-cols-4 gap-2">
          {puzzle.map((row, rowIndex) =>
            row.map((item, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
          relative flex justify-center items-center
          ${selectedCell?.row === rowIndex && selectedCell?.col === colIndex ? "ring-0 ring-blue-500" : ""}
          ${!isCellChangeable(rowIndex, colIndex) ? "opacity-70" : "cursor-pointer hover:img-highlight"}
          w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28
        `}
                onClick={() => {
                  if (!isSolved && isCellChangeable(rowIndex, colIndex)) {
                    setSelectedCell({ row: rowIndex, col: colIndex });
                  }
                }}
              >
                <img
                  src={SUNNYSIDE.ui.grayBorder}
                  alt="border"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
                {item && (
                  <img
                    src={ITEM_IMAGES[item]}
                    alt={item}
                    className="w-10 h-10 sm:w-12 sm:h-12 object-contain z-10"
                  />
                )}
              </div>
            )),
          )}
        </div>
        {/* <img src={item_box} className="relevant w-[27rem] z-11" alt="box"/> */}

        {/* VERTICAL Divider */}
        {/* <div className="absolute top-1/3 bottom-0 h-1/3 left-1/2 w-1 border-black-300 bg-black z-10" /> */}

        {/* HORIZONTAL Divider */}
        {/* <div className="absolute left-1/3 right-0 w-1/3 top-1/2 h-1 border-black-300 bg-black z-10" /> */}
      </div>

      {selectedCell && !isSolved && (
        <div className="fixed top-[10rem] md:top-[15rem] left-1/2 z-50 sm:px-6 md:px-10 transform -translate-x-1/2 -translate-y-[0rem] flex shadow-lg">
          {ItemIDs.map((id) => (
            <div
              key={id}
              className="relative w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center hover:img-highlight"
            >
              <img
                className="w-full h-full object-contain"
                src={SUNNYSIDE.ui.round_button}
                alt="empty-bar"
              />
              <img
                src={ITEM_IMAGES[id]}
                alt={`select-${id}`}
                className="absolute w-1/2 h-full cursor-pointer object-contain transition hover:scale-110 absolute top-0"
                onClick={() => handleItemSelect(id)}
              />
            </div>
          ))}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center hover:img-highlight">
            <img
              className="w-full h-full object-contain"
              src={SUNNYSIDE.ui.round_button}
              alt="empty-bar"
            />
            <img
              src={shovel}
              alt="shovel"
              className="absolute w-1/2 h-full cursor-pointer object-contain rotate-180 hover:scale-110 transition hover:img-highlight"
              onClick={() => {
                if (selectedCell) {
                  const { row, col } = selectedCell;
                  if (isCellChangeable(row, col)) {
                    const newPuzzle = [...puzzle];
                    newPuzzle[row][col] = null;
                    setPuzzle(newPuzzle);
                    setSelectedCell(null);
                    setIsSolved(false); // In case user undoes correct solution
                  }
                }
              }}
            />
          </div>
        </div>
      )}
      {isSolved && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-70">
          <div
            className="flex flex-row justify-center items-center w-[15rem] text-black shadow-xl text-2xxl font-bold"
            style={{
              ...pixelGrayBorderStyle,
              padding: `${PIXEL_SCALE * 8}px`,
              background: "#c0cbdc",
            }}
          >
            <div className="pr-3">{TEXT}</div>
          </div>
        </div>
      )}
    </>
  );
};
