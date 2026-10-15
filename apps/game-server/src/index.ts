import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import {
  defineServer,
  defineRoom,
  WebSocketTransport,
  matchMaker,
} from "colyseus";
import { OfficeRoom } from "./rooms/OfficeRoom.js";
import { allowedOrigins, isAllowedOrigin } from "./security/origins.js";

matchMaker.controller.getCorsHeaders = (headers) => ({
  "Access-Control-Allow-Origin": isAllowedOrigin(headers.get("origin"))
    ? headers.get("origin") || "null"
    : "null",
  Vary: "Origin",
});
const server = defineServer({
  transport: new WebSocketTransport({
    maxPayload: 8192,
    beforeUpgrade: (request) => {
      if (!isAllowedOrigin(request.headers.get("origin")))
        return new Response("Origin not allowed", { status: 403 });
    },
  }),
  express: (app) => {
    app.get("/healthz", (_req: ExpressRequest, res: ExpressResponse) =>
      res.json({ status: "ok", service: "azzo-room-game" }),
    );
    app.get("/readyz", (_req: ExpressRequest, res: ExpressResponse) => {
      const configured = Boolean(
        process.env.SUPABASE_URL &&
        process.env.SUPABASE_ANON_KEY &&
        allowedOrigins().length,
      );
      res
        .status(configured ? 200 : 503)
        .json({ status: configured ? "configured" : "configuration_missing" });
    });
  },
  rooms: { office: defineRoom(OfficeRoom).filterBy(["officeId"]) },
});
const port = Number(process.env.PORT || 2567);
server.listen(port, "0.0.0.0");
console.log(`[AZZO ROOM] Multiplayer disponível na porta ${port}.`);
