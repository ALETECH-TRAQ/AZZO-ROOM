import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";
import { authorizedWorkspace } from "@/lib/auth/server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let data: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 4096) throw new Error("payload");
    data = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw new Error("payload");
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const { mode } = data,
    officeId = String(data.officeId ?? "");
  if (
    !/^[a-zA-Z0-9_-]{1,48}$/.test(officeId) ||
    !["office", "meeting"].includes(String(mode))
  )
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const auth = await authorizedWorkspace(request, officeId);
  const demo =
    !auth &&
    process.env.NODE_ENV === "development" &&
    process.env.ENABLE_DEV_DEMO_TOKENS === "true" &&
    officeId === "azzo-hq";
  if (!auth && !demo)
    return NextResponse.json(
      { error: "Entre com uma conta autorizada para acessar a comunicação." },
      { status: 403 },
    );
  const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET)
    return NextResponse.json(
      { error: "Áudio e vídeo ainda não estão configurados neste ambiente." },
      { status: 503 },
    );
  const identity = auth?.user.id || String(data.userId ?? "");
  if (!/^[a-zA-Z0-9_-]{1,48}$/.test(identity))
    return NextResponse.json({ error: "Identidade inválida" }, { status: 400 });
  let mediaRoom = `${demo ? "demo" : "workspace"}:${officeId}:office`;
  if (mode === "meeting") {
    if (auth) {
      const meetingId = String(data.meetingId ?? "");
      const meeting = await auth.db
        .from("meeting_rooms")
        .select("id")
        .eq("id", meetingId)
        .eq("workspace_id", officeId)
        .maybeSingle();
      if (!meeting.data)
        return NextResponse.json(
          { error: "Você não tem permissão para esta reunião." },
          { status: 403 },
        );
      mediaRoom = `workspace:${officeId}:meeting:${meeting.data.id}`;
    } else mediaRoom = `demo:${officeId}:meeting:boardroom`;
  }
  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
    name:
      auth?.user.user_metadata.full_name ||
      String(data.name ?? "Visitante").slice(0, 28),
    ttl: "5m",
  });
  token.addGrant({
    roomJoin: true,
    room: mediaRoom,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });
  return NextResponse.json(
    { token: await token.toJwt(), serverUrl: LIVEKIT_URL },
    { headers: { "Cache-Control": "no-store" } },
  );
}
