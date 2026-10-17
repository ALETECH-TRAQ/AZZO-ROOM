import { defaultAvatar, validateAvatar } from "@azzo/avatar";
import type { OnlinePlayer } from "./types";

export type NetworkPlayer = {
  userId: string;
  name: string;
  color: string;
  x: number;
  y?: number;
  z: number;
  yaw: number;
  avatar: string;
  animation: string;
};
export type NetworkState = { players?: Map<string, NetworkPlayer> };

export function remotePlayers(
  state: NetworkState,
  localSessionId: string,
): OnlinePlayer[] {
  const players: OnlinePlayer[] = [];
  state.players?.forEach((player, sessionId) => {
    // Accounts can have multiple independent sessions. Hide only this socket.
    if (sessionId === localSessionId) return;
    if (![player.x, player.z, player.yaw].every(Number.isFinite)) return;
    let avatar = defaultAvatar;
    try {
      avatar = validateAvatar(JSON.parse(player.avatar)) || defaultAvatar;
    } catch {
      /* One bad payload must not hide the entire room. */
    }
    players.push({
      ...player,
      y: Number.isFinite(player.y) ? player.y : 0,
      sessionId,
      avatar,
      animation: ["walk", "run"].includes(player.animation)
        ? player.animation
        : "idle",
    });
  });
  return players;
}

export function networkLog(event: string, data: Record<string, unknown>) {
  if (
    process.env.NODE_ENV === "development" &&
    new URLSearchParams(location.search).has("debugNetwork")
  ) {
    console.debug("[AZZO multiplayer]", event, data);
  }
}
