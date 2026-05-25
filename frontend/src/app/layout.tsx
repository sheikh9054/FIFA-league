import type { Metadata, Viewport } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/providers/AppProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "FIFA 25 Local League | Esports Dashboard",
  description: "Professional FIFA 25 local league management platform with live standings, ELO ratings, and match tracking.",
  keywords: ["FIFA 25", "FC 25", "league", "esports", "standings", "ELO"],
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0a1628",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${orbitron.variable} font-body min-h-screen`}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
