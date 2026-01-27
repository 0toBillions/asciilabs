import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import WalletProvider from "@/components/nft/WalletProvider";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ASCII LABS - ASCII & Dithering Effects",
  description: "Convert images into ASCII art, dithered graphics, and retro effects",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistMono.variable} font-mono antialiased bg-zinc-950 text-zinc-100`}>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
