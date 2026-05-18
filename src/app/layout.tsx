import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sagva System",
  description: "Sistema Automatizado de Gestión de Ventas y Análisis"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
