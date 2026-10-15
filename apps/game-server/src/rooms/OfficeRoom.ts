import { Room, type Client } from "colyseus";
import { OfficeState, Player } from "./OfficeState.js";

import { validateAvatar, defaultAvatar, resolveMovement } from "@azzo/avatar";
import { authorize } from "../auth/session.js";

type JoinOptions = {
  officeId?: string;
  userId?: string;
  name?: string;
  color?: string;
  avatar?: unknown;
  accessToken?: string;
};
type MoveMessage = { x?: number; z?: number; yaw?: number; animation?: string };
const VALID_ID = /^[a-zA-Z0-9_-]{1,48}$/;
const VALID_COLOR = /^#[\da-fA-F]{6}$/;
const BOUNDS = { minX: -12.8, maxX: 12.8, minZ: -8.6, maxZ: 8.6 };
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

export class OfficeRoom extends Room {
  maxClients = 20;
  maxMessagesPerSecond = 25;
  state = new OfficeState();
  private lastPositionTime = new Map<string, number>();
  private officeId = "";

  onCreate(options: JoinOptions) {
    this.officeId = options.officeId ?? "azzo-hq";
  }

  async onAuth(client: Client, options: JoinOptions) {
    if (
      options.officeId !== this.officeId ||
      !VALID_ID.test(options.officeId ?? "")
    )
      return false;
    const user = await authorize(options.accessToken, options.officeId);
    if (user) {
      client.userData = { userId: user.id };
      return true;
    }
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.ALLOW_DEV_GUESTS === "true" &&
      options.officeId === "azzo-hq" &&
      VALID_ID.test(options.userId ?? "")
    ) {
      client.userData = { userId: options.userId };
      return true;
    }
    return false;
  }

  onJoin(client: Client, options: JoinOptions) {
    const p = new Player();
    p.userId = client.userData.userId;
    const avatar = validateAvatar(options.avatar) || defaultAvatar;
    p.avatar = JSON.stringify(avatar);
    p.name = avatar.displayName;
    p.color = VALID_COLOR.test(options.color ?? "")
      ? options.color!
      : "#66ddce";
    p.x = 0;
    p.z = 5;
    this.state.players.set(client.sessionId, p);
    this.lastPositionTime.set(client.sessionId, Date.now());
  }

  messages = {
    avatar: (client: Client, value: unknown) => {
      const p = this.state.players.get(client.sessionId);
      const valid = validateAvatar(value);
      if (p && valid) {
        p.avatar = JSON.stringify(valid);
        p.name = valid.displayName;
      }
    },
    move: (client: Client, msg: MoveMessage) => {
      const p = this.state.players.get(client.sessionId);
      if (
        !p ||
        !msg ||
        typeof msg.x !== "number" ||
        typeof msg.z !== "number" ||
        typeof msg.yaw !== "number" ||
        !Number.isFinite(msg.x) ||
        !Number.isFinite(msg.z) ||
        !Number.isFinite(msg.yaw)
      )
        return;
      const now = Date.now();
      const last = this.lastPositionTime.get(client.sessionId) ?? now;
      const dtReal = (now - last) / 1000;
      if (dtReal < 0.075) return; // limita atualização a ~13 Hz; mitiga spam
      const dt = clamp(dtReal, 0, 0.4);
      // Rejeita teleporte arbitrário; velocidade de referência 5,8 u/s.
      const dx = msg.x! - p.x;
      const dz = msg.z! - p.z;
      const distance = Math.hypot(dx, dz);
      const allowed = 5.8 * dt + 0.06;
      const scale = distance > allowed ? allowed / distance : 1;
      const nx = clamp(p.x + dx * scale, BOUNDS.minX, BOUNDS.maxX),
        nz = clamp(p.z + dz * scale, BOUNDS.minZ, BOUNDS.maxZ);
      const resolved = resolveMovement(p.x, p.z, nx, nz);
      p.x = resolved.x;
      p.z = resolved.z;
      p.animation =
        distance > 0.01 ? (msg.animation === "run" ? "run" : "walk") : "idle";
      p.yaw = clamp(msg.yaw!, -Math.PI * 2, Math.PI * 2);
      this.lastPositionTime.set(client.sessionId, now);
    },
  };

  async onDrop(client: Client) {
    await this.allowReconnection(client, 15);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    this.lastPositionTime.delete(client.sessionId);
  }
}
