"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

const WalletProviderInner = dynamic(
  () => import("./WalletProviderInner"),
  { ssr: false }
);

export default function WalletProvider({ children }: { children: ReactNode }) {
  return <WalletProviderInner>{children}</WalletProviderInner>;
}
