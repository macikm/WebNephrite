import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WebNephrite ERP | Helios Nephrite Cloud Interface",
  description: "Moderní webové rozhraní pro podnikový systém Helios Nephrite s přehlednými moduly a dashboardem.",
  keywords: ["ERP", "Helios", "Nephrite", "Faktury", "Sklad", "Zakázky", "WebNephrite"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <body>
        {children}
      </body>
    </html>
  );
}
