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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import { formatTanggalWaktu, formatStatus } from "@/lib/utils"
import { Search, FlaskConical, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface ScreeningData {
  id: string
  donor_nama: string
  golongan_darah: string
  rhesus: string
  tanggal: string
  hiv: string | null
  hepatitis_b: string | null
  hepatitis_c: string | null
  sifilis: string | null
  malaria: string | null
  status: string
}

export default function ScreeningPage() {
  const [data, setData] = useState<ScreeningData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState("pending")
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<{ success: boolean; data: ScreeningData[] }>("/api/screening")
      .then((res) => setData(res.data || []))
      .catch(() =>
        setData(
          Array.from({ length: 8 }, (_, i) => ({
            id: `SCR${String(i + 1).padStart(4, "0")}`,
            donor_nama: `Donor ${i + 1}`,
            golongan_darah: ["A", "B", "AB", "O"][i % 4],
            rhesus: "+",
            tanggal: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000).toISOString(),
            hiv: i % 3 === 0 ? null : "negatif",
            hepatitis_b: i % 3 === 0 ? null : "negatif",
            hepatitis_c: i % 3 === 0 ? null : "negatif",
            sifilis: i % 3 === 0 ? null : "negatif",
            malaria: i % 3 === 0 ? null : "negatif",
            status: i % 3 === 0 ? "pending" : "approved",
          }))
        )
      )
      .finally(() => setLoading(false))
  }, [])

  const filtered = data.filter((d) => {
    const matchSearch =
      !search ||
      d.donor_nama.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase())
    const matchTab = tab === "all" || d.status === tab
    return matchSearch && matchTab
  })

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    try {
      await api.patch(`/api/screening/${id}`, { status })
      setData((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status } : d))
      )
      toast.success(`Screening ${status === "approved" ? "disetujui" : "ditolak"}`)
    } catch {
      toast.error("Gagal mengupdate screening")
    } finally {
      setUpdating(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Hasil Screening Laboratorium
          </h1>
          <p className="text-muted-foreground">
            Pemeriksaan sampel darah donor
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList>
              <TabsTrigger value="pending">Menunggu</TabsTrigger>
              <TabsTrigger value="approved">Disetujui</TabsTrigger>
              <TabsTrigger value="rejected">Ditolak</TabsTrigger>
              <TabsTrigger value="all">Semua</TabsTrigger>
            </TabsList>
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value={tab} className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Donor</TableHead>
                      <TableHead>Gol. Darah</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>HIV</TableHead>
                      <TableHead>Hepatitis B</TableHead>
                      <TableHead>Hepatitis C</TableHead>
                      <TableHead>Sifilis</TableHead>
                      <TableHead>Malaria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading
                      ? Array.from({ length: 4 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 11 }).map((_, j) => (
                              <TableCell key={j}>
                                <Skeleton className="h-4 w-full" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      : filtered.map((d) => {
                          const hasil = (v: string | null) =>
                            v === null ? (
                              <span className="text-muted-foreground">-</span>
                            ) : v === "negatif" ? (
                              <span className="text-green-600">Negatif</span>
                            ) : (
                              <span className="text-red-600">Positif</span>
                            )
                          return (
                            <TableRow key={d.id}>
                              <TableCell className="font-medium">
                                {d.id}
                              </TableCell>
                              <TableCell>{d.donor_nama}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {d.golongan_darah}
                                  {d.rhesus}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs">
                                {formatTanggalWaktu(d.tanggal)}
                              </TableCell>
                              <TableCell>{hasil(d.hiv)}</TableCell>
                              <TableCell>{hasil(d.hepatitis_b)}</TableCell>
                              <TableCell>{hasil(d.hepatitis_c)}</TableCell>
                              <TableCell>{hasil(d.sifilis)}</TableCell>
                              <TableCell>{hasil(d.malaria)}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    d.status === "approved"
                                      ? "success"
                                      : d.status === "rejected"
                                      ? "destructive"
                                      : "warning"
                                  }
                                >
                                  {formatStatus(d.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {d.status === "pending" && (
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-green-600"
                                      disabled={updating === d.id}
                                      onClick={() =>
                                        updateStatus(d.id, "approved")
                                      }
                                    >
                                      {updating === d.id ? (
                                        <Loader2 className="size-3 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="size-3" />
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-600"
                                      disabled={updating === d.id}
                                      onClick={() =>
                                        updateStatus(d.id, "rejected")
                                      }
                                    >
                                      <XCircle className="size-3" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
