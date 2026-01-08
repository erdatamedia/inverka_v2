"use client";
import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class" // pakai class "dark" di <html>
      defaultTheme="system" // ikuti OS by default
      enableSystem // izinkan follow system
      disableTransitionOnChange // biar gak flicker
    >
      {children}
    </NextThemesProvider>
  );
}
