export const BarrierType = {
  BROKEN_SIDEWALK: "broken_sidewalk",
  BLOCKED_RAMP: "blocked_ramp",
  NO_SIDEWALK: "no_sidewalk",
  CONSTRUCTION: "construction",
  OBSTACLE: "obstacle",
  DANGEROUS_CROSSING: "dangerous_crossing",
  OTHER: "other",
} as const;
export type BarrierType = (typeof BarrierType)[keyof typeof BarrierType];
