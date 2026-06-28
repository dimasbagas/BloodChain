"use client"

import { type ReactNode } from "react"
import { ThemeProvider } from "next-themes"
import { AuthProvider } from "@/hooks/useAuth"
import { SocketProvider } from "@/hooks/useSocket"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "sonner"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <AuthProvider>
          <SocketProvider>
            {children}
            <Toaster
              richColors
              position="top-right"
              closeButton
              toastOptions={{
                style: { fontFamily: "var(--font-sans)" },
              }}
            />
          </SocketProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}
