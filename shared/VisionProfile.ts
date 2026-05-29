export const VisionProfile = {
  NORMAL: "normal",
  LOW_VISION: "low_vision",
  BLIND: "blind",
} as const;
export type VisionProfile = (typeof VisionProfile)[keyof typeof VisionProfile];
