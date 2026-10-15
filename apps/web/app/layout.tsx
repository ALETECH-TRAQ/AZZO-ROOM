import type { Metadata } from "next";
import "./globals.css";
import "@livekit/components-styles";
export const metadata: Metadata = {
  title: "AZZO ROOM | Escritório virtual 3D",
  description:
    "Explore, encontre sua equipe e participe de reuniões dentro de um escritório virtual 3D.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
