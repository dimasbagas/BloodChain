"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { ROLE_LABEL } from "@/lib/constants"
import {
  Droplets,
  LayoutDashboard,
  Users,
  HeartHandshake,
  FlaskConical,
  ClipboardCheck,
  Package,
  FileText,
  Truck,
  Building2,
  Bell,
  BarChart3,
  LogOut,
  User,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "pmi", "rumah_sakit", "donor"],
  },
  {
    title: "Donor",
    href: "/donors",
    icon: Users,
    roles: ["admin", "pmi"],
  },
  {
    title: "Donasi",
    href: "/donations",
    icon: HeartHandshake,
    roles: ["admin", "pmi", "donor"],
  },
  {
    title: "Cek Eligibilitas",
    href: "/eligibility",
    icon: ClipboardCheck,
    roles: ["donor"],
  },
  {
    title: "Skrining",
    href: "/screening",
    icon: FlaskConical,
    roles: ["admin", "pmi"],
  },
  {
    title: "Inventori",
    href: "/inventory",
    icon: Package,
    roles: ["admin", "pmi", "rumah_sakit"],
  },
  {
    title: "Permintaan",
    href: "/requests",
    icon: FileText,
    roles: ["admin", "pmi", "rumah_sakit"],
  },
  {
    title: "Distribusi",
    href: "/distribution",
    icon: Truck,
    roles: ["admin", "pmi"],
  },
  {
    title: "Cross PMI",
    href: "/cross-pmi",
    icon: Building2,
    roles: ["admin", "pmi"],
  },
  {
    title: "Peringatan",
    href: "/alerts",
    icon: Bell,
    roles: ["admin", "pmi", "rumah_sakit"],
  },
  {
    title: "Forecasting",
    href: "/forecasting",
    icon: BarChart3,
    roles: ["admin", "pmi"],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, role, logout } = useAuth()

  const filteredMenu = menuItems.filter(
    (item) => role && item.roles.includes(role)
  )

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-sidebar">
      <div className="flex items-center gap-2 border-b px-6 py-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-[#991b1b]">
          <Droplets className="size-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-sidebar-foreground">
            BloodChain
          </span>
          <span className="text-[10px] text-muted-foreground">
            Supply Chain Darah
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="flex flex-col gap-1">
          {filteredMenu.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#991b1b] text-white"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      <Separator />

      <div className="p-4">
        <div className="mb-3 flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-[#991b1b]/10 text-[#991b1b]">
              {user?.email?.charAt(0).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {user?.email?.split("@")[0] ?? "User"}
            </span>
            <Badge
              variant="outline"
              className="w-fit text-[10px] text-muted-foreground"
            >
              {role ? ROLE_LABEL[role] ?? role : "Guest"}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={logout}
        >
          <LogOut className="size-4" />
          Keluar
        </Button>
      </div>
    </aside>
  )
}
