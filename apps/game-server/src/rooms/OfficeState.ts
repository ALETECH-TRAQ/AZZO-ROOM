import { schema, t } from "@colyseus/schema";

export const Player = schema(
  {
    userId: t.string().default(""),
    name: t.string().default("Visitante"),
    avatar: t.string().default(""),
    animation: t.string().default("idle"),
    color: t.string().default("#66ddce"),
    x: t.number().default(0),
    z: t.number().default(5),
    yaw: t.number().default(0),
  },
  "AzzoPlayer",
);

export const OfficeState = schema(
  {
    players: t.map(Player),
  },
  "AzzoOfficeState",
);
