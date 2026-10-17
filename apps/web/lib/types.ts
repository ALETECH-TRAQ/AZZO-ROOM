import type { AvatarConfig } from "@azzo/avatar";
export type Position = {
  x: number;
  y?: number;
  z: number;
  yaw: number;
  animation?: string;
};
export type CameraMode = "iso" | "third";
export type OnlinePlayer = Position & {
  avatar?: AvatarConfig;
  animation?: string;
  sessionId: string;
  userId: string;
  name: string;
  color: string;
};
export type MediaMode = "office" | "meeting";
export const OFFICE_ID = "azzo-hq"; // ID de demonstração; em produção vem da empresa autenticada
export const MEETING_CENTER = { x: 7.5, z: -3.5 };
export const isNearMeeting = (p: Position) =>
  Math.hypot(p.x - MEETING_CENTER.x, p.z - MEETING_CENTER.z) < 4.3 ||
  Math.hypot(p.x - 7.8, p.z - 2.2) < 2.7;
export const PROXIMITY = { min: 1.2, max: 8.0 };
export function distanceVolume(a: Position, b: Position) {
  const d = Math.hypot(a.x - b.x, a.z - b.z);
  if (d >= PROXIMITY.max) return 0;
  if (d <= PROXIMITY.min) return 1;
  const t = (d - PROXIMITY.min) / (PROXIMITY.max - PROXIMITY.min);
  return Math.pow(1 - t, 2);
}
