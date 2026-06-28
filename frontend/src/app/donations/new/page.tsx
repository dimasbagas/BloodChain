"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { api } from "@/lib/api"
import { GOLONGAN_DARAH, RHESUS } from "@/lib/constants"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function NewDonationPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [locations, setLocations] = useState<{ pmis: any[]; hospitals: any[] }>({ pmis: [], hospitals: [] })
  const [form, setForm] = useState({
    donor_id: "",
    nama: "",
    email: "",
    no_hp: "",
    golongan_darah: "",
    rhesus: "+",
    tanggal_lahir: "",
    berat_badan: "",
    alamat: "",
    lokasi_tipe: "pmi",
    lokasi_id: "",
    // Kuesioner
    demam: false,
    batuk_pilek: false,
    obat_tertentu: false,
    tato_tindik: false,
    transfusi: false,
    hepatitis: false,
    hamil: false,
    operasi: false,
    bepergian: false,
    // Persetujuan
    setuju: false,
  })

  useEffect(() => {
    api.get<{ success: boolean; data: { pmis: any[]; hospitals: any[] } }>("/api/donations/locations")
      .then((res) => {
        setLocations(res.data || { pmis: [], hospitals: [] })
      })
      .catch((err) => {
        console.error("Gagal mengambil lokasi donor", err)
      })
  }, [])

  function updateField(key: string, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.setuju) {
      toast.error("Anda harus menyetujui syarat dan ketentuan")
      return
    }
    if (!form.lokasi_id) {
      toast.error("Anda harus memilih lokasi tempat donor")
      return
    }
    setLoading(true)
    try {
      const payload = {
        ...form,
        pmi_id: form.lokasi_tipe === "pmi" ? form.lokasi_id : undefined,
        hospital_id: form.lokasi_tipe === "hospital" ? form.lokasi_id : undefined,
      }
      await api.post("/api/donations", payload)
      toast.success("Donasi berhasil didaftarkan")
      router.push("/donations")
    } catch {
      toast.error("Gagal mendaftarkan donasi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/donations">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="size-4" />
            Kembali
          </Button>
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Registrasi Donasi Darah
          </h1>
          <p className="text-muted-foreground">
            Isi data diri dan kuesioner kesehatan
          </p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex size-8 items-center justify-center rounded-full text-sm font-medium ${
                  step >= s
                    ? "bg-[#991b1b] text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
              <span
                className={`text-sm ${
                  step >= s ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s === 1
                  ? "Data Diri"
                  : s === 2
                  ? "Kuesioner"
                  : "Persetujuan"}
              </span>
              {s < 3 && <div className="h-px w-8 bg-border" />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Data Diri */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Data Diri Donor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nama">Nama Lengkap</Label>
                    <Input
                      id="nama"
                      value={form.nama}
                      onChange={(e) => updateField("nama", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="no_hp">No. Handphone</Label>
                    <Input
                      id="no_hp"
                      value={form.no_hp}
                      onChange={(e) => updateField("no_hp", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                    <Input
                      id="tanggal_lahir"
                      type="date"
                      value={form.tanggal_lahir}
                      onChange={(e) =>
                        updateField("tanggal_lahir", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="berat_badan">Berat Badan (kg)</Label>
                    <Input
                      id="berat_badan"
                      type="number"
                      value={form.berat_badan}
                      onChange={(e) =>
                        updateField("berat_badan", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Golongan Darah</Label>
                    <Select
                      value={form.golongan_darah}
                      onValueChange={(v) =>
                        updateField("golongan_darah", v)
                      }
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
                  <Label htmlFor="alamat">Alamat</Label>
                  <Input
                    id="alamat"
                    value={form.alamat}
                    onChange={(e) => updateField("alamat", e.target.value)}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tempat / Lokasi Donor</Label>
                    <Select
                      value={form.lokasi_tipe}
                      onValueChange={(v) => {
                        updateField("lokasi_tipe", v)
                        updateField("lokasi_id", "")
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis tempat" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pmi">PMI (Unit Transfusi Darah)</SelectItem>
                        <SelectItem value="hospital">Rumah Sakit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Instansi / Detail Lokasi</Label>
                    <Select
                      value={form.lokasi_id}
                      onValueChange={(v) => updateField("lokasi_id", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={form.lokasi_tipe === "pmi" ? "Pilih PMI" : "Pilih Rumah Sakit"} />
                      </SelectTrigger>
                      <SelectContent>
                        {form.lokasi_tipe === "pmi"
                          ? locations.pmis.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} ({p.city || "Daerah"})
                              </SelectItem>
                            ))
                          : locations.hospitals.map((h) => (
                              <SelectItem key={h.id} value={h.id}>
                                {h.name} ({h.city || "Daerah"})
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Kuesioner */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Kuesioner Kesehatan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {kuesionerItems.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <Label className="cursor-pointer text-sm font-normal">
                      {item.question}
                    </Label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1 text-sm">
                        <RadioGroup
                          value={form[item.key as keyof typeof form] ? "ya" : "tidak"}
                          onValueChange={(v) =>
                            updateField(item.key, v === "ya")
                          }
                          className="flex"
                        >
                          <div className="flex items-center gap-1">
                            <RadioGroupItem value="ya" id={`${item.key}-ya`} />
                            <label htmlFor={`${item.key}-ya`}>Ya</label>
                          </div>
                          <div className="flex items-center gap-1">
                            <RadioGroupItem
                              value="tidak"
                              id={`${item.key}-tidak`}
                            />
                            <label htmlFor={`${item.key}-tidak`}>Tidak</label>
                          </div>
                        </RadioGroup>
                      </label>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Persetujuan */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Persetujuan Donor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4 text-sm leading-relaxed text-muted-foreground">
                  <p className="mb-2">
                    Saya yang bertanda tangan di bawah ini menyatakan bahwa:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>
                      Semua informasi yang saya berikan adalah benar dan
                      akurat.
                    </li>
                    <li>
                      Saya memahami risiko dan prosedur donor darah.
                    </li>
                    <li>
                      Saya menyetujui pemeriksaan sampel darah saya untuk
                      penyakit menular.
                    </li>
                    <li>
                      Saya bersedia dihubungi jika ditemukan kondisi
                      kesehatan tertentu.
                    </li>
                  </ol>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="setuju"
                    checked={form.setuju}
                    onCheckedChange={(v) => updateField("setuju", v)}
                  />
                  <Label htmlFor="setuju" className="text-sm font-normal">
                    Saya menyetujui syarat dan ketentuan di atas
                  </Label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              Sebelumnya
            </Button>
            {step < 3 ? (
              <Button
                type="button"
                onClick={() => setStep(Math.min(3, step + 1))}
              >
                Selanjutnya
              </Button>
            ) : (
              <Button type="submit" disabled={loading}>
                {loading && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Daftarkan Donasi
              </Button>
            )}
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

const kuesionerItems = [
  { key: "demam", question: "Apakah Anda sedang demam dalam 3 hari terakhir?" },
  { key: "batuk_pilek", question: "Apakah Anda sedang batuk/pilek?" },
  { key: "obat_tertentu", question: "Apakah Anda sedang mengonsumsi obat-obatan tertentu?" },
  { key: "tato_tindik", question: "Apakah Anda membuat tato/tindik dalam 6 bulan terakhir?" },
  { key: "transfusi", question: "Apakah Anda menerima transfusi darah dalam 6 bulan terakhir?" },
  { key: "hepatitis", question: "Apakah Anda pernah menderita hepatitis B/C?" },
  { key: "hamil", question: "Apakah Anda sedang hamil atau menyusui?" },
  { key: "operasi", question: "Apakah Anda menjalani operasi dalam 6 bulan terakhir?" },
  { key: "bepergian", question: "Apakah Anda bepergian ke daerah endemis malaria?" },
]
