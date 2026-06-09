import "./globals.css";
import type { Metadata } from "next";
import { ClientProviders } from "./ClientProviders";

export const metadata: Metadata = {
  title: "Collaborative Task Management",
  description: "A collaborative task management application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
