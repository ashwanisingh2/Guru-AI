import "./globals.css";
import type { Metadata } from "next";
import { AppRuntime } from "@/components/AppRuntime";

export const metadata: Metadata = {
  title: "GuruAI",
  description: "Simple learning platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppRuntime />
        {children}
      </body>
    </html>
  );
}
