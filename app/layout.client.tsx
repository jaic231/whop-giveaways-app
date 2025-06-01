"use client"; // this line is important
import { FC, PropsWithChildren } from "react";
import { WhopThemeProvider } from "@whop-apps/sdk";
import "@/lib/iframe";

export const ClientLayout: FC<PropsWithChildren> = ({ children }) => {
  return <WhopThemeProvider>{children}</WhopThemeProvider>;
};
