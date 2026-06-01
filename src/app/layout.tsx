import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sejura",
  description: "Asistent de rezervari pentru pensiuni, cabane si vile locale."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  );
}
