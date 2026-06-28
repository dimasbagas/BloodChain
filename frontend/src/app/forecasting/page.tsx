"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { GOLONGAN_DARAH } from "@/lib/constants"
import { TrendingUp, CalendarDays } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface ForecastingData {
  bulan: string
  aktual: number
  prediksi: number
}

interface ForecastByType {
  golongan: string
  data: ForecastingData[]
}

export default function ForecastingPage() {
  const [data, setData] = useState<ForecastByType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGol, setSelectedGol] = useState("A")

  useEffect(() => {
    api
      .get<ForecastByType[]>("/api/forecasting")
      .then(setData)
      .catch(() => {
        const months = [
          "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
          "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
        ]
        const mockData = GOLONGAN_DARAH.map((gol) => ({
          golongan: gol,
          data: months.map((bulan, i) => ({
            bulan,
            aktual: Math.floor(Math.random() * 100) + 50,
            prediksi:
              i < months.length - 3
                ? 0
                : Math.floor(Math.random() * 100) + 50,
          })),
        }))
        setData(mockData)
      })
      .finally(() => setLoading(false))
  }, [])

  const currentData = data.find((d) => d.golongan === selectedGol)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Demand Forecasting
          </h1>
          <p className="text-muted-foreground">
            Prediksi permintaan darah berdasarkan data historis
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {GOLONGAN_DARAH.map((gol) => {
            const golData = data.find((d) => d.golongan === gol)
            const trend =
              golData?.data
                ?.filter((d) => d.prediksi > 0)
                .reduce((acc, d) => acc + d.prediksi, 0) ?? 0
            return (
              <Card
                key={gol}
                className={`cursor-pointer transition-colors hover:border-[#991b1b]/30 ${
                  selectedGol === gol ? "border-[#991b1b] ring-1 ring-[#991b1b]" : ""
                }`}
                onClick={() => setSelectedGol(gol)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Golongan {gol}</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-[#991b1b]">
                        {trend}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Prediksi permintaan
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4" />
              Grafik Permintaan - Golongan {selectedGol}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[400px]" />
            ) : (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentData?.data}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
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
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="aktual"
                      name="Aktual"
                      stroke="#6b7280"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="prediksi"
                      name="Prediksi"
                      stroke="#991b1b"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ r: 4, fill: "#991b1b" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-4" />
              Rekomendasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  gol: "O",
                  rekom: "Tingkatkan donor untuk golongan O. Prediksi kenaikan 20%.",
                  urgent: true,
                },
                {
                  gol: "A",
                  rekom: "Stok aman untuk 2 bulan ke depan.",
                  urgent: false,
                },
                {
                  gol: "B",
                  rekom: "Permintaan stabil. Pertahankan stok.",
                  urgent: false,
                },
                {
                  gol: "AB",
                  rekom: "Kebutuhan rendah. Sesuaikan jadwal donor.",
                  urgent: false,
                },
              ].map((item) => (
                <div
                  key={item.gol}
                  className={`flex items-center justify-between rounded-lg border p-4 ${
                    item.urgent ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-[#991b1b]/10 font-bold text-[#991b1b]">
                      {item.gol}
                    </div>
                    <div>
                      <p className="text-sm">{item.rekom}</p>
                    </div>
                  </div>
                  {item.urgent && (
                    <Badge variant="destructive">Urgent</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
