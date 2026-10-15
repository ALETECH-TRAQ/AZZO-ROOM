export type AvatarConfig = {
  schemaVersion: 1;
  base: "masc" | "fem" | "custom";
  displayName: string;
  pronoun: string;
  skin: number;
  hair: number;
  hairColor: number;
  eyes: string;
  glasses: number;
  top: number;
  topColor: number;
  bottom: number;
  bottomColor: number;
  shoes: number;
  accessories: number[];
  height: number;
  body: number;
  face: number;
};
export const skins: string[],
  hairColors: string[],
  clothingColors: string[],
  hairs: string[],
  glasses: string[],
  tops: string[],
  accessories: string[],
  presetNames: string[];
export const defaultAvatar: AvatarConfig;
export const presets: { name: string; config: AvatarConfig }[];
export function validateAvatar(value: unknown): AvatarConfig | null;
export const manifest: object;
export const obstacles: { x: number; z: number; w: number; d: number }[];
export function collides(x: number, z: number): boolean;
export function resolveMovement(
  x: number,
  z: number,
  targetX: number,
  targetZ: number,
): { x: number; z: number };
