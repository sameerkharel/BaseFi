import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import { AppProviders } from "./providers";

export const metadata: Metadata = {
  title: "BaseFi",
  description: "Read-only Base portfolio dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
