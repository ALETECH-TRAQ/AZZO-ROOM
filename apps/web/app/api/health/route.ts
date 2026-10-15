import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export function GET() {
  const configuration = {
    authentication: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    multiplayer: Boolean(process.env.NEXT_PUBLIC_GAME_SERVER_URL),
    media: Boolean(
      process.env.LIVEKIT_URL &&
      process.env.LIVEKIT_API_KEY &&
      process.env.LIVEKIT_API_SECRET,
    ),
  };
  const configured = Object.values(configuration).every(Boolean);
  return NextResponse.json(
    {
      status: configured ? "configured" : "configuration_missing",
      configuration,
    },
    {
      status: configured ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
