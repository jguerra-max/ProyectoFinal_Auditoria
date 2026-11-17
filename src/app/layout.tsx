import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: "AuditSys Mini",
  description: "Gestión académica de auditorías de seguridad de la información",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className="h-full antialiased"
    >
      <body className="min-h-full"><Toaster richColors position="top-right" />{children}</body>
    </html>
  );
}
