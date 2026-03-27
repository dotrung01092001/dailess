export const cameraFilters = [
  { id: "soft", label: "Soft" },
  { id: "warm", label: "Warm" },
  { id: "ocean", label: "Ocean" },
  { id: "rose", label: "Rose" },
  { id: "mono", label: "Mono" },
  { id: "golden", label: "Golden" },
  { id: "dreamy", label: "Dreamy" },
  { id: "mocha", label: "Mocha" },
  { id: "pearl", label: "Pearl" },
  { id: "sunset", label: "Sunset" },
  { id: "forest", label: "Forest" },
  { id: "vivid", label: "Vivid" }
] as const;

export type CameraFilterId = (typeof cameraFilters)[number]["id"];

const filterStyles: Record<CameraFilterId, string> = {
  soft: "brightness(1.05) saturate(1.02)",
  warm: "sepia(0.18) saturate(1.14) brightness(1.03)",
  ocean: "hue-rotate(165deg) saturate(1.14) brightness(1.02)",
  rose: "hue-rotate(330deg) saturate(1.16) brightness(1.05)",
  mono: "grayscale(1) contrast(1.1)",
  golden: "sepia(0.3) saturate(1.25) brightness(1.08) contrast(1.04)",
  dreamy: "brightness(1.1) saturate(0.95) contrast(0.92) blur(0.2px)",
  mocha: "sepia(0.38) saturate(0.88) contrast(1.08) brightness(0.96)",
  pearl: "brightness(1.12) saturate(0.86) contrast(0.94)",
  sunset: "sepia(0.24) saturate(1.24) hue-rotate(-18deg) brightness(1.03)",
  forest: "hue-rotate(60deg) saturate(1.08) contrast(1.04) brightness(0.98)",
  vivid: "saturate(1.35) contrast(1.08) brightness(1.04)"
};

export function getCameraFilterStyle(filter: string) {
  return filterStyles[(filter as CameraFilterId) || "soft"] ?? filterStyles.soft;
}
