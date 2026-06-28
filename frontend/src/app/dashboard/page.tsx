"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { formatRelative } from "@/lib/utils"
import {
  Droplets,
  Users,
  HeartHandshake,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Package,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface DashboardData {
  total_donor: number
  total_donasi: number
  total_stok: number
  permintaan_aktif: number
  perubahan_donor: number
  perubahan_donasi: number
  perubahan_stok: number
  perubahan_permintaan: number
  tren_donasi: { bulan: string; jumlah: number }[]
  stok_kritis: { golongan: string; jumlah: number }[]
  aktivitas_terbaru: { id: string; tipe: string; deskripsi: string; waktu: string }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<any>("/api/dashboard")
      .then((res) => setData(res.data))
      .catch(() =>
        setData({
          total_donor: 1250,
          total_donasi: 3420,
          total_stok: 856,
          permintaan_aktif: 23,
          perubahan_donor: 12,
          perubahan_donasi: -3,
          perubahan_stok: 8,
          perubahan_permintaan: -5,
          tren_donasi: [
            { bulan: "Jan", jumlah: 280 },
            { bulan: "Feb", jumlah: 310 },
            { bulan: "Mar", jumlah: 290 },
            { bulan: "Apr", jumlah: 350 },
            { bulan: "Mei", jumlah: 320 },
            { bulan: "Jun", jumlah: 380 },
          ],
          stok_kritis: [
            { golongan: "A", jumlah: 5 },
            { golongan: "B", jumlah: 8 },
            { golongan: "O", jumlah: 3 },
            { golongan: "AB", jumlah: 12 },
          ],
          aktivitas_terbaru: [
            { id: "1", tipe: "donasi", deskripsi: "Donasi baru dari Budi", waktu: new Date().toISOString() },
            { id: "2", tipe: "permintaan", deskripsi: "RS Sehat mengajukan permintaan", waktu: new Date().toISOString() },
            { id: "3", tipe: "distribusi", deskripsi: "Distribusi ke RS Harapan", waktu: new Date().toISOString() },
          ],
        })
      )
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    {
      title: "Total Donor",
      value: data?.total_donor ?? 0,
      change: data?.perubahan_donor ?? 0,
      icon: Users,
    },
    {
      title: "Total Donasi",
      value: data?.total_donasi ?? 0,
      change: data?.perubahan_donasi ?? 0,
      icon: HeartHandshake,
    },
    {
      title: "Stok Darah",
      value: data?.total_stok ?? 0,
      change: data?.perubahan_stok ?? 0,
      icon: Droplets,
    },
    {
      title: "Permintaan Aktif",
      value: data?.permintaan_aktif ?? 0,
      change: data?.perubahan_permintaan ?? 0,
      icon: Package,
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Ringkasan data supply chain darah
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon
            const isUp = card.change >= 0
            return (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <Icon className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        {card.value.toLocaleString()}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs">
                        {isUp ? (
                          <TrendingUp className="size-3 text-green-500" />
                        ) : (
                          <TrendingDown className="size-3 text-red-500" />
                        )}
                        <span
                          className={
                            isUp ? "text-green-500" : "text-red-500"
                          }
                        >
                          {isUp ? "+" : ""}
                          {card.change}%
                        </span>
                        <span className="text-muted-foreground">
                          dari bulan lalu
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Tren Donasi Bulanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px]" />
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.tren_donasi}>
                      <defs>
                        <linearGradient
                          id="colorDonasi"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#991b1b"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#991b1b"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="bulan"
                        className="text-xs text-muted-foreground"
                      />
                      <YAxis className="text-xs text-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid var(--border)",
                          background: "var(--card)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="jumlah"
                        stroke="#991b1b"
                        fillOpacity={1}
                        fill="url(#colorDonasi)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stok Kritis */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="size-4 text-yellow-500" />
                Stok Darah Kritis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px]" />
              ) : (
                <div className="space-y-4">
                  {data?.stok_kritis.map((item) => (
                    <div
                      key={item.golongan}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-[#991b1b]/10 font-bold text-[#991b1b]">
                          {item.golongan}
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            Golongan {item.golongan}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Tersisa {item.jumlah} kantong
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={
                          item.jumlah <= 5 ? "destructive" : "warning"
                        }
                      >
                        {item.jumlah <= 5 ? "Kritis" : "Menipis"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Aktivitas Terbaru */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              <div className="flex items-center gap-2">
                <Activity className="size-4" />
                Aktivitas Terbaru
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {data?.aktivitas_terbaru.map((aktivitas) => (
                  <div
                    key={aktivitas.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                      {aktivitas.tipe === "donasi" ? (
                        <HeartHandshake className="size-4 text-green-500" />
                      ) : aktivitas.tipe === "permintaan" ? (
                        <Package className="size-4 text-blue-500" />
                      ) : (
                        <Droplets className="size-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p>{aktivitas.deskripsi}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatRelative(aktivitas.waktu)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
