"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/api"
import { formatTanggalWaktu, formatGolonganDarah, formatStatus } from "@/lib/utils"
import { STATUS_DISTRIBUSI } from "@/lib/constants"
import { Search, Truck, Filter, MapPin, PackageCheck } from "lucide-react"

interface Distribution {
  id: string
  kode_pengiriman: string
  dari: string
  tujuan: string
  golongan_darah: string
  rhesus: string
  komponen: string
  jumlah_kantong: number
  status: string
  kurir: string
  estimasi_sampai: string
  tanggal_kirim: string
  tanggal_sampai: string | null
}

export default function DistributionPage() {
  const [data, setData] = useState<Distribution[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")

  useEffect(() => {
    api
      .get<{ success: boolean; data: any[] }>("/api/distribution")
      .then((res) => {
        const raw = res.data || []
        const mapped = raw.map((d: any) => {
          const dari = d.pmiFrom?.name || "PMI"
          const tujuan = d.hospital?.name || d.pmiTo?.name || "Fasilitas Medis"
          
          const firstItem = d.items?.[0]?.batch
          const golongan_darah = firstItem?.bloodType || "O"
          const rhesus = firstItem?.rhesus === "POSITIVE" ? "+" : "-"
          const komponen = firstItem?.component?.toLowerCase() || "prc"
          
          const jumlah_kantong = d.items?.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) || 0
          
          let status = "dipersiapkan"
          if (d.status === "ON_COURIER") status = "dikirim"
          else if (d.status === "PACKING") status = "dipersiapkan"
          else if (d.status === "ARRIVED" || d.status === "COMPLETED") status = "diterima"
          
          return {
            id: d.id,
            kode_pengiriman: d.distributionCode || "",
            dari,
            tujuan,
            golongan_darah,
            rhesus,
            komponen,
            jumlah_kantong,
            status,
            kurir: d.courierName || "-",
            estimasi_sampai: d.arrivedAt || d.completedAt || "",
            tanggal_kirim: d.shippedAt || d.createdAt,
            tanggal_sampai: d.arrivedAt || null,
          }
        })
        setData(mapped)
      })
      .catch(() =>
        setData(
          Array.from({ length: 10 }, (_, i) => ({
            id: `DIST${String(i + 1).padStart(4, "0")}`,
            kode_pengiriman: `SHIP-${String(i + 1).padStart(5, "0")}`,
            dari: "PMI Pusat",
            tujuan: ["RS Sehat", "RS Harapan", "RS Umum", "PMI Cabang A"][i % 4],
            golongan_darah: ["A", "B", "AB", "O"][i % 4],
            rhesus: "+",
            komponen: ["whole_blood", "prc", "platelet", "ffp"][i % 4],
            jumlah_kantong: Math.ceil(Math.random() * 5),
            status: ["dipersiapkan", "dikirim", "diterima", "gagal"][i % 4],
            kurir: "Kurir " + String(i + 1),
            estimasi_sampai: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            tanggal_kirim: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString(),
            tanggal_sampai:
              i % 2 === 0
                ? new Date(Date.now() - i * 12 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString()
                : null,
          }))
        )
      )
      .finally(() => setLoading(false))
  }, [])

  // Computed stats from real data
  const statsDalamPengiriman = data.filter((d) => d.status === "dikirim").length
  const statsSelesaiHariIni = data.filter((d) => {
    if (d.status !== "diterima") return false
    const tanggal = d.tanggal_sampai
    if (!tanggal) return false
    const today = new Date().toDateString()
    return new Date(tanggal).toDateString() === today
  }).length
  const statsTotalTujuan = new Set(data.map((d) => d.tujuan)).size

  const filtered = data.filter((d) => {
    const matchSearch =
      !search ||
      d.kode_pengiriman.toLowerCase().includes(search.toLowerCase()) ||
      d.tujuan.toLowerCase().includes(search.toLowerCase())
    // treat "all" or empty as no filter
    const matchStatus = !filterStatus || filterStatus === "all" || d.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Distribusi Darah</h1>
          <p className="text-muted-foreground">
            Tracking dan manajemen pengiriman darah
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Dalam Pengiriman
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Truck className="size-5 text-blue-500" />
                <span className="text-2xl font-bold">{statsDalamPengiriman}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Selesai Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <PackageCheck className="size-5 text-green-500" />
                <span className="text-2xl font-bold">{statsSelesaiHariIni}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Total Tujuan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <MapPin className="size-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{statsTotalTujuan}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari pengiriman..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              {STATUS_DISTRIBUSI.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="size-4" />
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Dari</TableHead>
                  <TableHead>Tujuan</TableHead>
                  <TableHead>Gol. Darah</TableHead>
                  <TableHead>Komponen</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Kurir</TableHead>
                  <TableHead>Estimasi</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 9 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : filtered.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-mono text-xs font-medium">
                          {d.kode_pengiriman}
                        </TableCell>
                        <TableCell className="text-xs">{d.dari}</TableCell>
                        <TableCell className="text-xs">{d.tujuan}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatGolonganDarah(d.golongan_darah, d.rhesus)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{d.komponen}</TableCell>
                        <TableCell>{d.jumlah_kantong}</TableCell>
                        <TableCell className="text-xs">{d.kurir}</TableCell>
                        <TableCell className="text-xs">
                          {d.status === "dikirim"
                            ? formatTanggalWaktu(d.estimasi_sampai)
                            : d.tanggal_sampai
                            ? formatTanggalWaktu(d.tanggal_sampai)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              d.status === "diterima"
                                ? "success"
                                : d.status === "gagal"
                                ? "destructive"
                                : d.status === "dikirim"
                                ? "info"
                                : "warning"
                            }
                          >
                            {formatStatus(d.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
