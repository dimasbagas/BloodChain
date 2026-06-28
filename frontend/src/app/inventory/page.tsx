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
import {
  formatTanggal,
  formatGolonganDarah,
  formatKomponenDarah,
  formatStatus,
} from "@/lib/utils"
import {
  GOLONGAN_DARAH,
  KOMPONEN_DARAH,
  STATUS_INVENTARIS,
} from "@/lib/constants"
import { Search, Filter, Package, AlertTriangle } from "lucide-react"

interface InventoryItem {
  id: string
  kode_kantong: string
  golongan_darah: string
  rhesus: string
  komponen: string
  volume_ml: number
  tanggal_donasi: string
  tanggal_kadaluwarsa: string
  status: string
  lokasi: string
}

interface InventorySummary {
  total_kantong: number
  total_volume: number
  hampir_kadaluwarsa: number
  by_golongan: { golongan: string; jumlah: number }[]
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [summary, setSummary] = useState<InventorySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterGol, setFilterGol] = useState("")
  const [filterKomponen, setFilterKomponen] = useState("")
  const [filterStatus, setFilterStatus] = useState("")

  useEffect(() => {
    Promise.all([
      api.get<InventoryItem[]>("/api/inventory").catch(() =>
        Array.from({ length: 20 }, (_, i) => ({
          id: `INV${String(i + 1).padStart(4, "0")}`,
          kode_kantong: `BAG-${String(i + 1).padStart(6, "0")}`,
          golongan_darah: ["A", "B", "AB", "O"][i % 4],
          rhesus: i % 5 === 0 ? "-" : "+",
          komponen: ["whole_blood", "prc", "platelet", "ffp"][i % 4],
          volume_ml: 250 + Math.floor(Math.random() * 200),
          tanggal_donasi: new Date(Date.now() - i * 10 * 24 * 60 * 60 * 1000).toISOString(),
          tanggal_kadaluwarsa: new Date(Date.now() + (i % 2 === 0 ? 10 : -5) * 24 * 60 * 60 * 1000).toISOString(),
          status: ["tersedia", "tersedia", "dipesan", "kedaluwarsa"][i % 4],
          lokasi: ["PMI Pusat", "PMI Cabang A", "RS Sehat"][i % 3],
        }))
      ),
      api.get<InventorySummary>("/api/inventory/summary").catch(() => ({
        total_kantong: 856,
        total_volume: 342400,
        hampir_kadaluwarsa: 23,
        by_golongan: [
          { golongan: "A", jumlah: 220 },
          { golongan: "B", jumlah: 185 },
          { golongan: "AB", jumlah: 95 },
          { golongan: "O", jumlah: 356 },
        ],
      })),
    ])
      .then(([itemsRes, summaryRes]) => {
        const rawItems = Array.isArray((itemsRes as any)?.data) ? (itemsRes as any).data : []
        const mappedItems = rawItems.map((item: any) => {
          let komponenMapped = "whole_blood"
          if (item.batch?.component === "PRC") komponenMapped = "prc"
          else if (item.batch?.component === "TC") komponenMapped = "platelet"
          else if (item.batch?.component === "FFP") komponenMapped = "ffp"

          let statusMapped = "tersedia"
          if (item.status === "RESERVED") statusMapped = "dipesan"
          else if (item.status === "EXPIRED") statusMapped = "kedaluwarsa"
          else if (item.status === "USED") statusMapped = "dipakai"
          else if (item.status === "DISTRIBUTED") statusMapped = "dikirim"

          return {
            id: item.id,
            kode_kantong: item.batch?.batchCode || "",
            golongan_darah: item.batch?.bloodType || "O",
            rhesus: item.batch?.rhesus === "POSITIVE" ? "+" : "-",
            komponen: komponenMapped,
            volume_ml: item.batch?.volumeMl || 350,
            tanggal_donasi: item.batch?.createdAt || item.receivedAt,
            tanggal_kadaluwarsa: item.batch?.expiryDate || new Date().toISOString(),
            status: statusMapped,
            lokasi: item.batch?.location || item.pmi?.name || "PMI",
          }
        })

        const rawSummary = (summaryRes as any)?.data
        const totalKantong = rawSummary?.grandTotal || 0
        const totalVolume = rawItems.reduce((acc: number, item: any) => acc + (item.batch?.volumeMl || 0), 0)
        
        const sevenDays = new Date()
        sevenDays.setDate(sevenDays.getDate() + 7)
        const hampirKadaluwarsa = rawItems.filter((item: any) => {
          if (!item.batch?.expiryDate) return false
          const exp = new Date(item.batch.expiryDate)
          return item.status === "AVAILABLE" && exp <= sevenDays && exp >= new Date()
        }).length

        const byGolongan = ["A", "B", "AB", "O"].map((gol) => ({
          golongan: gol,
          jumlah: rawSummary?.summary?.[gol]?.total || 0,
        }))

        setItems(mappedItems)
        setSummary({
          total_kantong: totalKantong,
          total_volume: totalVolume,
          hampir_kadaluwarsa: hampirKadaluwarsa,
          by_golongan: byGolongan,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter((item) => {
    const matchSearch =
      !search ||
      item.kode_kantong.toLowerCase().includes(search.toLowerCase()) ||
      item.lokasi.toLowerCase().includes(search.toLowerCase())
    const matchGol = !filterGol || item.golongan_darah === filterGol
    const matchKomponen = !filterKomponen || item.komponen === filterKomponen
    const matchStatus = !filterStatus || item.status === filterStatus
    return matchSearch && matchGol && matchKomponen && matchStatus
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Inventori Darah
          </h1>
          <p className="text-muted-foreground">
            Manajemen stok kantong darah
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Total Kantong
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  {summary?.total_kantong}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Total Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  {(summary?.total_volume ?? 0).toLocaleString()} ml
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="size-3 text-yellow-500" />
                Hampir Kadaluwarsa
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-yellow-500">
                  {summary?.hampir_kadaluwarsa}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Per Golongan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {summary?.by_golongan.map((g) => (
                    <div key={g.golongan} className="flex justify-between">
                      <span className="font-medium">{g.golongan}</span>
                      <span>{g.jumlah}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari kode kantong..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterGol} onValueChange={setFilterGol}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Gol. Darah" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              {GOLONGAN_DARAH.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterKomponen} onValueChange={setFilterKomponen}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Komponen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              {KOMPONEN_DARAH.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              {STATUS_INVENTARIS.map((s) => (
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

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Kantong</TableHead>
                  <TableHead>Gol. Darah</TableHead>
                  <TableHead>Komponen</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Tanggal Donasi</TableHead>
                  <TableHead>Kadaluwarsa</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : filtered.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs font-medium">
                          {item.kode_kantong}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatGolonganDarah(
                              item.golongan_darah,
                              item.rhesus
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatKomponenDarah(item.komponen)}
                        </TableCell>
                        <TableCell>{item.volume_ml} ml</TableCell>
                        <TableCell className="text-xs">
                          {formatTanggal(item.tanggal_donasi)}
                        </TableCell>
                        <TableCell
                          className={`text-xs ${
                            new Date(item.tanggal_kadaluwarsa) < new Date()
                              ? "text-red-500"
                              : ""
                          }`}
                        >
                          {formatTanggal(item.tanggal_kadaluwarsa)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {item.lokasi}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.status === "tersedia"
                                ? "success"
                                : item.status === "kedaluwarsa"
                                ? "destructive"
                                : item.status === "dipesan"
                                ? "info"
                                : "secondary"
                            }
                          >
                            {formatStatus(item.status)}
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
