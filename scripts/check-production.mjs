const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_GAME_SERVER_URL",
  "LIVEKIT_URL",
  "LIVEKIT_API_KEY",
  "LIVEKIT_API_SECRET",
];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error("Configuração ausente: " + missing.join(", "));
  process.exit(1);
}
for (const name of [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_GAME_SERVER_URL",
  "LIVEKIT_URL",
]) {
  try {
    const url = new URL(process.env[name]);
    if (
      !["https:", "wss:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
      throw Error();
  } catch {
    console.error("Use uma URL pública segura para " + name);
    process.exit(1);
  }
}
console.log(
  "Configuração de produção presente. Ainda é necessário validar os serviços reais.",
);
