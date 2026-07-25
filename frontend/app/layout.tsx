import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "UndoPay",
  description: "Send crypto payments with a 30-second reclaim window",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
