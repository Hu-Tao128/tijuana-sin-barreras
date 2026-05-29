export const MobilityProfile = {
  WHEELCHAIR_ELECTRIC: "wheelchair_electric",
  WHEELCHAIR_MANUAL: "wheelchair_manual",
  WALKER: "walker",
  CANE: "cane",
  AMBULATORY_LIMITED: "ambulatory_limited",
  AMBULATORY: "ambulatory",
} as const;
export type MobilityProfile = (typeof MobilityProfile)[keyof typeof MobilityProfile];
