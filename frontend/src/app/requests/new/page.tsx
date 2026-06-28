"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/api"
import { GOLONGAN_DARAH, RHESUS, KOMPONEN_DARAH, TIPE_PERMINTAAN } from "@/lib/constants"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"

interface LocationItem {
  id: string
  name: string
  city: string
}

export default function NewRequestPage() {
  const router = useRouter()
  const { role } = useAuth()
  const [loading, setLoading] = useState(false)
  const [hospitals, setHospitals] = useState<LocationItem[]>([])
  const [pmis, setPmis] = useState<LocationItem[]>([])
  const [form, setForm] = useState({
    hospitalId: "",
    pmiId: "",
    golongan_darah: "",
    rhesus: "+",
    komponen: "",
    jumlah_kantong: "",
    tipe: "regular",
    keterangan: "",
    kebutuhan: "",
  })

  useEffect(() => {
    api.get<{ success: boolean; data: { pmis: LocationItem[]; hospitals: LocationItem[] } }>("/api/donations/locations")
      .then((res) => {
        const data = res.data || { pmis: [], hospitals: [] }
        setPmis(data.pmis)
        setHospitals(data.hospitals)
      })
      .catch(() => {})
  }, [])

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload: any = {
        golongan_darah: form.golongan_darah,
        rhesus: form.rhesus,
        komponen: form.komponen,
        jumlah_kantong: Number(form.jumlah_kantong),
        tipe: form.tipe,
        keterangan: form.keterangan,
        kebutuhan: form.kebutuhan,
      }
      // PMI role: direct PMI-to-PMI request, hospitalId auto-resolved by backend
      // HOSPITAL role: set hospitalId explicitly
      if (form.hospitalId) payload.hospitalId = form.hospitalId
      if (form.pmiId) payload.pmiId = form.pmiId

      await api.post("/api/requests", payload)
      toast.success("Permintaan darah berhasil dibuat")
      router.push("/requests")
    } catch {
      toast.error("Gagal membuat permintaan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/requests">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="size-4" />
            Kembali
          </Button>
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Buat Permintaan Darah
          </h1>
          <p className="text-muted-foreground">
            Ajukan permintaan darah untuk rumah sakit
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Detail Permintaan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Hospital role: select which PMI to request blood from */}
              {role === "HOSPITAL" && (
                <div className="space-y-2">
                  <Label>PMI Tujuan</Label>
                  <Select
                    value={form.pmiId}
                    onValueChange={(v) => updateField("pmiId", v)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih PMI" />
                    </SelectTrigger>
                    <SelectContent>
                      {pmis.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} – {p.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* PMI role: select target PMI for cross-PMI request */}
              {role === "PMI" && (
                <div className="space-y-2">
                  <Label>PMI Asal (Cross-PMI)</Label>
                  <Select
                    value={form.pmiId}
                    onValueChange={(v) => updateField("pmiId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih PMI lain (opsional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {pmis.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} – {p.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Golongan Darah</Label>
                  <Select
                    value={form.golongan_darah}
                    onValueChange={(v) => updateField("golongan_darah", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      {GOLONGAN_DARAH.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rhesus</Label>
                  <Select
                    value={form.rhesus}
                    onValueChange={(v) => updateField("rhesus", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RHESUS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r === "+" ? "Positif (+)" : "Negatif (-)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Komponen Darah</Label>
                <Select
                  value={form.komponen}
                  onValueChange={(v) => updateField("komponen", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih komponen" />
                  </SelectTrigger>
                  <SelectContent>
                    {KOMPONEN_DARAH.map((k) => (
                      <SelectItem key={k.value} value={k.value}>
                        {k.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="jumlah">Jumlah Kantong</Label>
                  <Input
                    id="jumlah"
                    type="number"
                    min={1}
                    value={form.jumlah_kantong}
                    onChange={(e) =>
                      updateField("jumlah_kantong", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipe Permintaan</Label>
                  <Select
                    value={form.tipe}
                    onValueChange={(v) => updateField("tipe", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPE_PERMINTAAN.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="kebutuhan">Keperluan / Indikasi</Label>
                <Input
                  id="kebutuhan"
                  placeholder="Contoh: Operasi jantung, thalassemia, dll"
                  value={form.kebutuhan}
                  onChange={(e) => updateField("kebutuhan", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keterangan">Keterangan Tambahan</Label>
                <Textarea
                  id="keterangan"
                  placeholder="Informasi tambahan..."
                  value={form.keterangan}
                  onChange={(e) => updateField("keterangan", e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 flex justify-end gap-3">
            <Link href="/requests">
              <Button variant="outline">Batal</Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Ajukan Permintaan
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
