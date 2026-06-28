"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { formatGolonganDarah } from "@/lib/utils"
import { Search, Building2, Droplets, Phone, MapPin, ArrowRightLeft } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GOLONGAN_DARAH } from "@/lib/constants"

interface PMI {
  id: string
  nama: string
  alamat: string
  kota: string
  no_telp: string
  jarak_km: number
  stok: { golongan: string; jumlah: number }[]
  status: string
}

export default function CrossPMIPage() {
  const [pmis, setPmis] = useState<PMI[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterGol, setFilterGol] = useState("")

  useEffect(() => {
    api
      .get<{ success: boolean; data: PMI[] }>("/api/cross-pmi")
      .then((res) => setPmis(res.data || []))
      .catch(() =>
        setPmis(
          Array.from({ length: 6 }, (_, i) => ({
            id: `PMI${String(i + 1).padStart(3, "0")}`,
            nama: `PMI ${["Jakarta", "Bandung", "Surabaya", "Yogyakarta", "Semarang", "Bogor"][i]}`,
            alamat: `Jl. Merdeka No. ${i + 1}`,
            kota: ["Jakarta", "Bandung", "Surabaya", "Yogyakarta", "Semarang", "Bogor"][i],
            no_telp: "021-1234567",
            jarak_km: (i + 1) * 15,
            stok: GOLONGAN_DARAH.map((g) => ({
              golongan: g,
              jumlah: Math.floor(Math.random() * 50) + 10,
            })),
            status: i < 4 ? "aktif" : "offline",
          }))
        )
      )
      .finally(() => setLoading(false))
  }, [])

  const filtered = pmis.filter((pmi) => {
    const matchSearch =
      !search ||
      pmi.nama.toLowerCase().includes(search.toLowerCase()) ||
      pmi.kota.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  async function handleRequestTransfer(pmi: PMI) {
    try {
      await api.post("/api/cross-pmi/request", {
        supplyingPmiId: pmi.id,
        notes: `Permintaan transfer stok darurat dari ${pmi.nama}`,
        items: [
          {
            quantity: 5,
          }
        ]
      })
      toast.success(`Berhasil mengajukan transfer 5 kantong darah dari ${pmi.nama}`)
    } catch {
      toast.error("Gagal mengajukan transfer stok")
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cross PMI</h1>
          <p className="text-muted-foreground">
            Berbagi stok darah antar PMI
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari PMI..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((pmi) => (
              <Card key={pmi.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-[#991b1b]/10">
                        <Building2 className="size-5 text-[#991b1b]" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{pmi.nama}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {pmi.kota}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={pmi.status === "aktif" ? "success" : "secondary"}
                    >
                      {pmi.status === "aktif" ? "Aktif" : "Offline"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      {pmi.alamat}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="size-3" />
                      {pmi.no_telp}
                    </div>
                    <div className="flex items-center gap-1">
                      <Droplets className="size-3" />
                      Jarak: {pmi.jarak_km} km
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium">Stok Darah:</p>
                    <div className="grid grid-cols-4 gap-1">
                      {pmi.stok.map((s) => (
                        <div
                          key={s.golongan}
                          className="rounded-md border p-2 text-center"
                        >
                          <div className="text-xs font-bold text-[#991b1b]">
                            {s.golongan}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {s.jumlah}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="w-full gap-2"
                    size="sm"
                    disabled={pmi.status !== "aktif"}
                    onClick={() => handleRequestTransfer(pmi)}
                  >
                    <ArrowRightLeft className="size-3" />
                    Ajukan Transfer Stok
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
