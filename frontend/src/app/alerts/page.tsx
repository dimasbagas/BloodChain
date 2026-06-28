"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { formatTanggalWaktu, formatRelative } from "@/lib/utils"
import { ALERT_LEVELS } from "@/lib/constants"
import {
  AlertTriangle,
  Bell,
  Droplets,
  Package,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

interface Alert {
  id: string
  tipe: string
  level: string
  judul: string
  pesan: string
  dibaca: boolean
  created_at: string
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingDismiss, setLoadingDismiss] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<{ success: boolean; data: any[] }>("/api/alerts")
      .then((res) => {
        const mapped = (res.data || []).map((alert: any) => {
          const ratio = alert.currentStock / alert.safetyStock
          const levelMapped = ratio <= 0.25 ? "critical" : "warning"
          
          return {
            id: alert.id,
            tipe: "stok",
            level: levelMapped,
            judul: `Stok Darah ${alert.bloodType} (${alert.component}) Kritis`,
            pesan: `Sisa ${alert.currentStock} kantong di ${alert.pmi?.name || "PMI"}. Batas aman: ${alert.safetyStock} kantong.`,
            dibaca: alert.isResolved,
            created_at: alert.createdAt,
          }
        })
        setAlerts(mapped)
      })
      .catch(() =>
        setAlerts(
          Array.from({ length: 8 }, (_, i) => ({
            id: `ALR${String(i + 1).padStart(4, "0")}`,
            tipe: i < 3 ? "stok" : "kadaluwarsa",
            level: ["critical", "warning", "warning", "info", "critical", "info", "warning", "info"][i],
            judul: [
              "Stok Darah O Positif Kritis",
              "Stok Darah A Negatif Menipis",
              "Kadaluwarsa: 5 Kantong PRC",
              "Pengiriman Berhasil",
              "Stok Darah B Positif Kritis",
              "Permintaan Baru dari RS Sehat",
              "Stok Platelet Menipis",
              "Jadwal Donasi Besok",
            ][i],
            pesan: [
              "Sisa 3 kantong. Segera lakukan replenish.",
              "Tersisa 8 kantong. Perhatikan permintaan.",
              "Kadaluwarsa dalam 2 hari.",
              "Pengiriman ke RS Harapan telah sampai.",
              "Sisa 2 kantong. Kondisi darurat.",
              "Permintaan 5 kantong PRC gol B.",
              "Tersisa 4 kantong platelet.",
              "3 donor dijadwalkan donasi besok.",
            ][i],
            dibaca: i > 3,
            created_at: new Date(Date.now() - i * 2 * 60 * 60 * 1000).toISOString(),
          }))
        )
      )
      .finally(() => setLoading(false))
  }, [])

  async function dismissAlert(id: string) {
    setLoadingDismiss(id)
    try {
      await api.put(`/api/alerts/${id}/resolve`)
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, dibaca: true } : a))
      )
      toast.success("Peringatan ditandai sudah dibaca")
    } catch {
      toast.error("Gagal memperbarui peringatan")
    } finally {
      setLoadingDismiss(null)
    }
  }

  const unreadCount = alerts.filter((a) => !a.dibaca).length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Peringatan</h1>
            <p className="text-muted-foreground">
              Notifikasi dan peringatan sistem
            </p>
          </div>
          <Badge variant="destructive" className="text-sm">
            {unreadCount} Belum Dibaca
          </Badge>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="mb-2 size-8 text-muted-foreground" />
              <p className="text-muted-foreground">Tidak ada peringatan</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const level = ALERT_LEVELS.find(
                (l) => l.value === alert.level
              )
              return (
                <Card
                  key={alert.id}
                  className={`transition-opacity ${
                    !alert.dibaca ? "border-l-4" : "opacity-60"
                  }`}
                  style={{
                    borderLeftColor: !alert.dibaca
                      ? level?.color
                      : undefined,
                  }}
                >
                  <CardContent className="flex items-start gap-4 p-4">
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                        alert.level === "critical"
                          ? "bg-red-100 dark:bg-red-950"
                          : alert.level === "warning"
                          ? "bg-yellow-100 dark:bg-yellow-950"
                          : "bg-blue-100 dark:bg-blue-950"
                      }`}
                    >
                      {alert.tipe === "stok" ? (
                        <Droplets
                          className={`size-5 ${
                            alert.level === "critical"
                              ? "text-red-500"
                              : alert.level === "warning"
                              ? "text-yellow-500"
                              : "text-blue-500"
                          }`}
                        />
                      ) : (
                        <AlertTriangle
                          className={`size-5 ${
                            alert.level === "critical"
                              ? "text-red-500"
                              : alert.level === "warning"
                              ? "text-yellow-500"
                              : "text-blue-500"
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{alert.judul}</p>
                        <Badge
                          variant={
                            alert.level === "critical"
                              ? "destructive"
                              : alert.level === "warning"
                              ? "warning"
                              : "info"
                          }
                          className="text-[10px]"
                        >
                          {level?.label}
                        </Badge>
                        {!alert.dibaca && (
                          <span className="size-2 rounded-full bg-[#dc2626]" />
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {alert.pesan}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatRelative(alert.created_at)}
                      </p>
                    </div>
                    {!alert.dibaca && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        disabled={loadingDismiss === alert.id}
                        onClick={() => dismissAlert(alert.id)}
                      >
                        {loadingDismiss === alert.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="size-4" />
                        )}
                        Tandai Dibaca
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
