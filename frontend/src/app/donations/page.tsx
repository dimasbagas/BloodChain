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
import { formatTanggalWaktu, formatGolonganDarah, formatStatus } from "@/lib/utils"
import { STATUS_DONASI } from "@/lib/constants"
import { Search, Plus, Filter } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"

interface Donation {
  id: string
  donor_nama: string
  golongan_darah: string
  rhesus: string
  tanggal_donasi: string
  jumlah_ml: number
  status: string
  lokasi: string
}

export default function DonationsPage() {
  const { role } = useAuth()
  const [data, setData] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")

  useEffect(() => {
    api
      .get<{ success: boolean; data: any[] }>("/api/donations")
      .then((res) => {
        const raw = res.data || []
        const mapped = raw.map((d: any) => {
          let statusMapped = "pending"
          if (d.status === "REGISTERED" || d.status === "ELIGIBILITY_CHECK" || d.status === "ELIGIBLE") {
            statusMapped = "pending"
          } else if (d.status === "SCREENING") {
            statusMapped = "screening"
          } else if (d.status === "SCREENED" || d.status === "COMPLETED") {
            statusMapped = "approved"
          } else if (d.status === "INELIGIBLE" || d.status === "REJECTED") {
            statusMapped = "rejected"
          } else if (d.status === "CANCELLED") {
            statusMapped = "cancelled"
          }

          return {
            id: d.id,
            donor_nama: d.donor?.user?.fullName || "Donor",
            golongan_darah: d.donor?.bloodType || "O",
            rhesus: d.donor?.rhesus === "POSITIVE" ? "+" : "-",
            tanggal_donasi: d.donationDate || d.createdAt,
            jumlah_ml: d.bloodBatch?.volumeMl || 350,
            status: statusMapped,
            lokasi: d.hospital?.name || d.pmi?.name || "PMI",
          }
        })
        setData(mapped)
      })
      .catch(() =>
        setData(
          Array.from({ length: 15 }, (_, i) => ({
            id: `DN${String(i + 1).padStart(4, "0")}`,
            donor_nama: `Donor ${i + 1}`,
            golongan_darah: ["A", "B", "AB", "O"][i % 4],
            rhesus: "+",
            tanggal_donasi: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
            jumlah_ml: 350 + Math.floor(Math.random() * 100),
            status: ["pending", "screening", "approved", "rejected"][i % 4],
            lokasi: "PMI Pusat",
          }))
        )
      )
      .finally(() => setLoading(false))
  }, [])

  const filtered = data.filter((d) => {
    const matchSearch =
      !search ||
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      d.donor_nama.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || filterStatus === "all" || d.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Riwayat Donasi</h1>
            <p className="text-muted-foreground">
              {role === "DONOR"
                ? "Data riwayat donasi darah Anda"
                : "Data seluruh donasi darah"}
            </p>
          </div>
          {role === "DONOR" && (
            <Link href="/donations/new">
              <Button>
                <Plus className="mr-2 size-4" />
                Donasi Baru
              </Button>
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari donasi..."
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
              {STATUS_DONASI.map((s) => (
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
                  <TableHead>ID</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead>Gol. Darah</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : filtered.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.id}</TableCell>
                        <TableCell>{d.donor_nama}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatGolonganDarah(d.golongan_darah, d.rhesus)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{d.lokasi}</TableCell>
                        <TableCell className="text-xs">
                          {formatTanggalWaktu(d.tanggal_donasi)}
                        </TableCell>
                        <TableCell>{d.jumlah_ml} ml</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              d.status === "approved"
                                ? "success"
                                : d.status === "rejected"
                                ? "destructive"
                                : d.status === "screening"
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
