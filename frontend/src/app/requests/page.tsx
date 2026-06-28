"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
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
  formatTanggalWaktu,
  formatGolonganDarah,
  formatStatus,
} from "@/lib/utils"
import { STATUS_PERMINTAAN, TIPE_PERMINTAAN } from "@/lib/constants"
import { Search, Plus, Filter } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"

interface BloodRequest {
  id: string
  rumah_sakit: string
  pmi_name: string
  golongan_darah: string
  rhesus: string
  komponen: string
  jumlah_kantong: number
  tipe: string
  status: string
  tanggal: string
  keterangan: string
}

export default function RequestsPage() {
  const { role } = useAuth()
  const [data, setData] = useState<BloodRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterTipe, setFilterTipe] = useState("")

  useEffect(() => {
    api
      .get<{ success: boolean; data: any[] }>("/api/requests")
      .then((res) => {
        const mapped = (res.data || []).map((req: any) => {
          const firstItem = req.items?.[0] || {}
          const jumlahKantong = (req.items || []).reduce((acc: number, item: any) => acc + (item.quantity || 0), 0)

          let komponenMapped = "prc"
          if (firstItem.component === "WB") komponenMapped = "whole_blood"
          else if (firstItem.component === "PRC") komponenMapped = "prc"
          else if (firstItem.component === "TC") komponenMapped = "platelet"
          else if (firstItem.component === "FFP") komponenMapped = "ffp"

          let statusMapped = "pending"
          if (req.status === "PROCESSING") statusMapped = "diproses"
          else if (req.status === "COMPLETED") statusMapped = "dipenuhi"
          else if (req.status === "REJECTED") statusMapped = "dibatalkan"
          else if (req.status === "PENDING") statusMapped = "pending"
          else if (req.status === "APPROVED" || req.status === "SHIPPED") statusMapped = "diproses"

          return {
            id: req.requestCode || req.id,
            rumah_sakit: req.hospital?.name || "Rumah Sakit",
            pmi_name: req.pmi?.name || "PMI",
            golongan_darah: firstItem.bloodType || "A",
            rhesus: firstItem.rhesus === "POSITIVE" ? "+" : "-",
            komponen: komponenMapped,
            jumlah_kantong: jumlahKantong,
            tipe: (req.requestType || "REGULAR").toLowerCase(),
            status: statusMapped,
            tanggal: req.requestedAt || req.createdAt,
            keterangan: req.notes || "",
          }
        })
        setData(mapped)
      })
      .catch(() =>
        setData(
          Array.from({ length: 12 }, (_, i) => ({
            id: `REQ${String(i + 1).padStart(4, "0")}`,
            rumah_sakit: ["RS Sehat", "RS Harapan", "RS Umum"][i % 3],
            pmi_name: "PMI Pusat",
            golongan_darah: ["A", "B", "AB", "O"][i % 4],
            rhesus: "+",
            komponen: ["prc", "platelet", "ffp", "whole_blood"][i % 4],
            jumlah_kantong: Math.ceil(Math.random() * 10),
            tipe: i % 4 === 0 ? "cito" : "regular",
            status: ["pending", "diproses", "dipenuhi", "dibatalkan"][i % 4],
            tanggal: new Date(Date.now() - i * 5 * 24 * 60 * 60 * 1000).toISOString(),
            keterangan: "",
          }))
        )
      )
      .finally(() => setLoading(false))
  }, [])

  const filtered = data.filter((r) => {
    const matchSearch =
      !search ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.rumah_sakit.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || filterStatus === "all" || r.status === filterStatus
    const matchTipe = !filterTipe || filterTipe === "all" || r.tipe === filterTipe
    return matchSearch && matchStatus && matchTipe
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {role === "PMI" ? "Permintaan Masuk" : "Permintaan Darah"}
            </h1>
            <p className="text-muted-foreground">
              {role === "PMI"
                ? "Daftar permintaan darah dari rumah sakit ke PMI Anda"
                : "Kelola permintaan darah dari rumah sakit ke PMI"}
            </p>
          </div>
          {(role === "HOSPITAL" || role === "PMI") && (
            <Link href="/requests/new">
              <Button>
                <Plus className="mr-2 size-4" />
                {role === "PMI" ? "Ajukan Permintaan" : "Buat Permintaan Baru"}
              </Button>
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari permintaan..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              {STATUS_PERMINTAAN.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTipe} onValueChange={setFilterTipe}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              {TIPE_PERMINTAAN.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
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
                  <TableHead>ID</TableHead>
                  <TableHead>
                    {role === "PMI" ? "Rumah Sakit" : "PMI Tujuan"}
                  </TableHead>
                  <TableHead>Gol. Darah</TableHead>
                  <TableHead>Komponen</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
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
                  : filtered.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">
                          {req.id}
                        </TableCell>
                        <TableCell>
                          {role === "PMI" ? req.rumah_sakit : req.pmi_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatGolonganDarah(
                              req.golongan_darah,
                              req.rhesus
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {req.komponen}
                        </TableCell>
                        <TableCell>{req.jumlah_kantong}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              req.tipe === "cito" ? "destructive" : "secondary"
                            }
                          >
                            {formatStatus(req.tipe)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatTanggalWaktu(req.tanggal)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              req.status === "dipenuhi"
                                ? "success"
                                : req.status === "dibatalkan"
                                ? "destructive"
                                : req.status === "diproses"
                                ? "info"
                                : "warning"
                            }
                          >
                            {formatStatus(req.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Detail
                          </Button>
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
