export const INNER_WALLS = {
  TL_IN: 17, // Top Left Inner
  TR_IN: 21, // Top Right Inner
  BL_IN: 51, // Bottom Left Inner
  BR_IN: 53, // Bottom Right Inner
  T_IN: 46, // Top Inner
  B_IN: 52, // Bottom Inner
  L_IN: 28, // Left Inner
  R_IN: 32, // Right Inner
};

export const OUTER_WALLS = {
  TL_OUT: 11, // Top Left Outer
  TR_OUT: 15, // Top Right Outer
  BL_OUT: 45, // Bottom Left Outer
  BR_OUT: 47, // Bottom Right Outer
  T_OUT: 52, // Top Outer
  B_OUT: 46, // Bottom Outer
  L_OUT: 32, // Left Outer
  R_OUT: 28, // Right Outer
};

export const DECORATION = {
  GROUND_1: 27,
  GROUND_2: 48,
  GROUND_3: 49,
  GROUND_4: 50,
  TL_IN_1: 18, // Top Left Inner
  TL_IN_2: 0,
  TR_IN_1: 20, // Top Right Inner
  TR_IN_2: 4,
  BL_IN: 40, // Bottom Left Inner
  BR_IN: 42, // Bottom Right Inner
  T_IN_1: 19, // Top Inner
  T_IN_2: 5,
  T_IN_3: 6,
  T_IN_4: 7,
  B_IN: 41, // Bottom Inner
  L_IN: 29, // Left Inner
  R_IN: 31, // Right Inner
  TL_OUT: 12, // Top Left Outer
  TR_OUT: 14, // Top Right Outer
  BL_OUT_1: 34, // Bottom Left Outer
  BL_OUT_2: 0,
  BR_OUT_1: 36, // Bottom Right Outer
  BR_OUT_2: 4,
  T_OUT: 41, // Top Outer
  B_OUT_1: 19, // Bottom Outer
  B_OUT_2: 5,
  B_OUT_3: 6,
  B_OUT_4: 7,
  L_OUT: 31, // Left OuterS
  R_OUT: 29, // Right Outer
};

export const WALLS = {
  ...INNER_WALLS,
  ...OUTER_WALLS,
  WALL: 16, // Wall
};

export const TILES = {
  GROUND: 38, // Another wall: 27
  ...WALLS,
} as const;

// Utility to build rows of tiles
export const repeat = (tile: number | number[], count: number) =>
  Array(count).fill(tile);

export const ROOM_INNER_WIDTH = 11;
export const ROOM_INNER_HEIGHT = 9;
export const ROOM_TOTAL_WIDTH = ROOM_INNER_WIDTH + 3;
export const ROOM_TOTAL_HEIGHT = ROOM_INNER_HEIGHT + 3;
export const basicRoom = [
  // Top corners and edges
  [TILES.TL_OUT, ...repeat(TILES.T_OUT, ROOM_INNER_WIDTH + 4), TILES.TR_OUT],
  // Side edges and top walls
  [TILES.L_OUT, ...repeat(TILES.WALL, ROOM_INNER_WIDTH + 4), TILES.R_OUT],
  // Side edges and inner top walls
  [
    TILES.L_OUT,
    TILES.WALL,
    TILES.TL_IN,
    ...repeat(TILES.T_IN, ROOM_INNER_WIDTH),
    TILES.TR_IN,
    TILES.WALL,
    TILES.R_OUT,
  ],
  // Central rows with inner entry/exit
  ...repeat(
    [
      TILES.L_OUT,
      TILES.WALL,
      TILES.L_IN,
      ...repeat(TILES.GROUND, ROOM_INNER_WIDTH),
      TILES.R_IN,
      TILES.WALL,
      TILES.R_OUT,
    ],
    ROOM_INNER_HEIGHT,
  ),
  // Side edges and inner bottom walls
  [
    TILES.L_OUT,
    TILES.WALL,
    TILES.BL_IN,
    ...repeat(TILES.B_IN, ROOM_INNER_WIDTH),
    TILES.BR_IN,
    TILES.WALL,
    TILES.R_OUT,
  ],
  // Side edges and bottom walls
  [TILES.L_OUT, ...repeat(TILES.WALL, ROOM_INNER_WIDTH + 4), TILES.R_OUT],
  // Bottom corners and edges
  [TILES.BL_OUT, ...repeat(TILES.B_OUT, ROOM_INNER_WIDTH + 4), TILES.BR_OUT],
];

export const contentCenterRoom = [
  [
    ...repeat(TILES.WALL, 4),
    TILES.TL_IN,
    ...repeat(TILES.T_IN, 3),
    TILES.TR_IN,
    ...repeat(TILES.WALL, 4),
  ],
  [
    ...repeat(TILES.WALL, 3),
    TILES.TL_IN,
    TILES.BR_OUT,
    ...repeat(TILES.GROUND, 3),
    TILES.BL_OUT,
    TILES.TR_IN,
    ...repeat(TILES.WALL, 3),
  ],
  [
    ...repeat(TILES.WALL, 2),
    TILES.TL_IN,
    TILES.BR_OUT,
    ...repeat(TILES.GROUND, 5),
    TILES.BL_OUT,
    TILES.TR_IN,
    ...repeat(TILES.WALL, 2),
  ],
  [
    ...repeat(TILES.WALL, 1),
    TILES.TL_IN,
    TILES.BR_OUT,
    ...repeat(TILES.GROUND, 7),
    TILES.BL_OUT,
    TILES.TR_IN,
    ...repeat(TILES.WALL, 1),
  ],
  [
    TILES.TL_IN,
    TILES.BR_OUT,
    ...repeat(TILES.GROUND, 9),
    TILES.BL_OUT,
    TILES.TR_IN,
  ],
  ...repeat(
    [TILES.L_IN, ...repeat(TILES.GROUND, ROOM_INNER_WIDTH), TILES.R_IN],
    1,
  ),
  [
    TILES.BL_IN,
    TILES.TR_OUT,
    ...repeat(TILES.GROUND, 9),
    TILES.TL_OUT,
    TILES.BR_IN,
  ],
  [
    ...repeat(TILES.WALL, 1),
    TILES.BL_IN,
    TILES.TR_OUT,
    ...repeat(TILES.GROUND, 7),
    TILES.TL_OUT,
    TILES.BR_IN,
    ...repeat(TILES.WALL, 1),
  ],
  [
    ...repeat(TILES.WALL, 2),
    TILES.BL_IN,
    TILES.TR_OUT,
    ...repeat(TILES.GROUND, 5),
    TILES.TL_OUT,
    TILES.BR_IN,
    ...repeat(TILES.WALL, 2),
  ],
  [
    ...repeat(TILES.WALL, 3),
    TILES.BL_IN,
    TILES.TR_OUT,
    ...repeat(TILES.GROUND, 3),
    TILES.TL_OUT,
    TILES.BR_IN,
    ...repeat(TILES.WALL, 3),
  ],
  [
    ...repeat(TILES.WALL, 4),
    TILES.BL_IN,
    ...repeat(TILES.B_IN, 3),
    TILES.BR_IN,
    ...repeat(TILES.WALL, 4),
  ],
];

export const smallRoom = [
  [TILES.TL_OUT, TILES.T_OUT, TILES.T_OUT, TILES.T_OUT, TILES.TR_OUT],
  [TILES.L_OUT, TILES.TL_IN, TILES.T_IN, TILES.TR_IN, TILES.R_OUT],
  [TILES.L_OUT, TILES.L_IN, TILES.GROUND, TILES.R_IN, TILES.R_OUT],
  [TILES.L_OUT, TILES.L_IN, TILES.GROUND, TILES.R_IN, TILES.R_OUT],
  [TILES.BL_OUT, TILES.BR_OUT, TILES.GROUND, TILES.BL_OUT, TILES.BR_OUT],
];

export const smallRoom2 = [
  [TILES.GROUND, TILES.TL_OUT, TILES.T_OUT, TILES.TR_OUT, TILES.GROUND],
  [TILES.GROUND, TILES.BL_OUT, TILES.B_OUT, TILES.BR_OUT, TILES.GROUND],
  [TILES.GROUND, TILES.GROUND, TILES.GROUND, TILES.GROUND, TILES.GROUND],
  [TILES.GROUND, TILES.TL_OUT, TILES.T_OUT, TILES.TR_OUT, TILES.GROUND],
  [TILES.GROUND, TILES.BL_OUT, TILES.B_OUT, TILES.BR_OUT, TILES.GROUND],
];

// Walls inside the room
const wall1 = [
  [TILES.TL_OUT, TILES.TR_OUT],
  [TILES.L_OUT, TILES.R_OUT],
  [TILES.BL_OUT, TILES.BR_OUT],
];
const wall2 = [
  [TILES.TL_OUT, TILES.T_OUT, TILES.TR_OUT],
  [TILES.BL_OUT, TILES.B_OUT, TILES.BR_OUT],
];
const wall3 = [
  [TILES.TL_OUT, TILES.T_OUT, TILES.TR_OUT],
  [TILES.L_OUT, TILES.TL_IN, TILES.BR_OUT],
  [TILES.BL_OUT, TILES.BR_OUT, TILES.GROUND],
];
const wall4 = [
  [TILES.TL_OUT, TILES.T_OUT, TILES.TR_OUT],
  [TILES.BL_OUT, TILES.TR_IN, TILES.R_OUT],
  [TILES.GROUND, TILES.BL_OUT, TILES.BR_OUT],
];
const wall5 = [
  [TILES.TL_OUT, TILES.TR_OUT, TILES.GROUND],
  [TILES.L_OUT, TILES.BL_IN, TILES.TR_OUT],
  [TILES.BL_OUT, TILES.B_OUT, TILES.BR_OUT],
];
const wall6 = [
  [TILES.GROUND, TILES.TL_OUT, TILES.TR_OUT],
  [TILES.TL_OUT, TILES.BR_IN, TILES.R_OUT],
  [TILES.BL_OUT, TILES.B_OUT, TILES.BR_OUT],
];
const wall7 = [
  [TILES.GROUND, TILES.TL_OUT, TILES.TR_OUT],
  [TILES.TL_OUT, TILES.BR_IN, TILES.R_OUT],
  [TILES.L_OUT, TILES.TL_IN, TILES.BR_OUT],
  [TILES.BL_OUT, TILES.BR_OUT, TILES.GROUND],
];
const wall8 = [
  [TILES.TL_OUT, TILES.TR_OUT, TILES.GROUND],
  [TILES.L_OUT, TILES.BL_IN, TILES.TR_OUT],
  [TILES.BL_OUT, TILES.TR_IN, TILES.R_OUT],
  [TILES.GROUND, TILES.BL_OUT, TILES.BR_OUT],
];
const wall9 = [
  [TILES.GROUND, TILES.TL_OUT, TILES.T_OUT, TILES.TR_OUT],
  [TILES.TL_OUT, TILES.BR_IN, TILES.TL_IN, TILES.BR_OUT],
  [TILES.BL_OUT, TILES.B_OUT, TILES.BR_OUT, TILES.GROUND],
];
const wall10 = [
  [TILES.TL_OUT, TILES.T_OUT, TILES.TR_OUT, TILES.GROUND],
  [TILES.BL_OUT, TILES.TR_IN, TILES.BL_IN, TILES.TR_OUT],
  [TILES.GROUND, TILES.BL_OUT, TILES.B_OUT, TILES.BR_OUT],
];
const wall11 = [
  [TILES.TL_OUT, TILES.TR_OUT],
  [TILES.BL_OUT, TILES.BR_OUT],
];

export const ROOM_WALLS = [
  wall1,
  wall2,
  wall3,
  wall4,
  wall5,
  wall6,
  wall7,
  wall8,
  wall9,
  wall10,
  wall11,
];

export const DECORATION_TILES = {
  [TILES.GROUND]: [
    DECORATION.GROUND_1,
    DECORATION.GROUND_2,
    DECORATION.GROUND_3,
    DECORATION.GROUND_4,
  ],
  [TILES.TL_IN]: [DECORATION.TL_IN_1, DECORATION.TL_IN_2],
  [TILES.TR_IN]: [DECORATION.TR_IN_1, DECORATION.TR_IN_2],
  [TILES.BL_IN]: [DECORATION.BL_IN],
  [TILES.BR_IN]: [DECORATION.BR_IN],
  [TILES.T_IN]: [
    DECORATION.T_IN_1,
    DECORATION.T_IN_2,
    DECORATION.T_IN_3,
    DECORATION.T_IN_4,
  ],
  [TILES.B_IN]: [DECORATION.B_IN],
  [TILES.L_IN]: [DECORATION.L_IN],
  [TILES.R_IN]: [DECORATION.R_IN],
  [TILES.TL_OUT]: [DECORATION.TL_OUT],
  [TILES.TR_OUT]: [DECORATION.TR_OUT],
  [TILES.BL_OUT]: [DECORATION.BL_OUT_1, DECORATION.BL_OUT_2],
  [TILES.BR_OUT]: [DECORATION.BR_OUT_1, DECORATION.BR_OUT_2],
  [TILES.T_OUT]: [DECORATION.T_OUT],
  [TILES.B_OUT]: [
    DECORATION.B_OUT_1,
    DECORATION.B_OUT_2,
    DECORATION.B_OUT_3,
    DECORATION.B_OUT_4,
  ],
  [TILES.L_OUT]: [DECORATION.L_OUT],
  [TILES.R_OUT]: [DECORATION.R_OUT],
};
