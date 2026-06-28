"use client"

import { useAuth } from "@/hooks/useAuth"
import { ROLE_LABEL } from "@/lib/constants"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Bell, Menu, LogOut, User, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSocket } from "@/hooks/useSocket"

interface NavbarProps {
  onMenuClick: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, role, logout } = useAuth()
  const { isConnected } = useSocket()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="size-5" />
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {isConnected ? (
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-green-500" />
              Terhubung
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-red-500" />
              Terputus
            </span>
          )}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4" />
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[#dc2626] text-[9px] text-white">
            3
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-[#991b1b]/10 text-[#991b1b] text-xs">
                  {user?.email?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <span className="font-medium">
                  {user?.email ?? "User"}
                </span>
                {role && (
                  <Badge variant="outline" className="w-fit text-[10px]">
                    {ROLE_LABEL[role] ?? role}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="size-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="size-4" />
              Pengaturan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="size-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
