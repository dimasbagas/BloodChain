"use client"

import { useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, ClipboardCheck, Loader2 } from "lucide-react"

interface EligibilityResult {
  eligible: boolean
  alasan: string[]
  rekomendasi: string
  persyaratan: { label: string; terpenuhi: boolean }[]
}

export default function EligibilityPage() {
  const [form, setForm] = useState({
    usia: "",
    berat_badan: "",
    tekanan_darah_sistolik: "",
    tekanan_darah_diastolik: "",
    hemoglobin: "",
    demam: "tidak",
    penyakit_kronis: "tidak",
    puasa: "tidak",
    alkohol: "tidak",
  })
  const [result, setResult] = useState<EligibilityResult | null>(null)
  const [loading, setLoading] = useState(false)

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function checkEligibility(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const usia = Number(form.usia)
    const bb = Number(form.berat_badan)
    const sistolik = Number(form.tekanan_darah_sistolik)
    const hb = Number(form.hemoglobin)

    const persyaratan = [
      { label: "Usia 17-65 tahun", terpenuhi: usia >= 17 && usia <= 65 },
      { label: "Berat badan >= 55 kg", terpenuhi: bb >= 55 },
      {
        label: "Tekanan darah normal (sistolik 100-180)",
        terpenuhi: sistolik >= 100 && sistolik <= 180,
      },
      {
        label: "Hemoglobin normal (12.5-17 g/dL)",
        terpenuhi: hb >= 12.5 && hb <= 17,
      },
      { label: "Tidak sedang demam", terpenuhi: form.demam === "tidak" },
      {
        label: "Tidak memiliki penyakit kronis",
        terpenuhi: form.penyakit_kronis === "tidak",
      },
      { label: "Tidak dalam kondisi puasa", terpenuhi: form.puasa === "tidak" },
      {
        label: "Tidak dalam pengaruh alkohol",
        terpenuhi: form.alkohol === "tidak",
      },
    ]

    const tidakTerpenuhi = persyaratan.filter((p) => !p.terpenuhi)
    const eligible = tidakTerpenuhi.length === 0

    setResult({
      eligible,
      alasan: tidakTerpenuhi.map((p) => p.label),
      rekomendasi: eligible
        ? "Anda memenuhi syarat untuk donor darah. Silakan kunjungi PMI terdekat."
        : "Beberapa syarat belum terpenuhi. Konsultasikan dengan petugas PMI.",
      persyaratan,
    })
    setLoading(false)
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Cek Eligibilitas Donor
          </h1>
          <p className="text-muted-foreground">
            Periksa apakah Anda memenuhi syarat untuk donor darah
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="size-4" />
                Data Pemeriksaan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={checkEligibility} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Usia (tahun)</Label>
                    <Input
                      type="number"
                      value={form.usia}
                      onChange={(e) => updateField("usia", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Berat Badan (kg)</Label>
                    <Input
                      type="number"
                      value={form.berat_badan}
                      onChange={(e) =>
                        updateField("berat_badan", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tek. Sistolik (mmHg)</Label>
                    <Input
                      type="number"
                      value={form.tekanan_darah_sistolik}
                      onChange={(e) =>
                        updateField("tekanan_darah_sistolik", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hemoglobin (g/dL)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={form.hemoglobin}
                      onChange={(e) =>
                        updateField("hemoglobin", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>
                {(
                  [
                    ["demam", "Apakah sedang demam?"],
                    ["penyakit_kronis", "Memiliki penyakit kronis?"],
                    ["puasa", "Sedang puasa?"],
                    ["alkohol", "Dalam pengaruh alkohol?"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-2">
                    <Label>{label}</Label>
                    <RadioGroup
                      value={form[key]}
                      onValueChange={(v) => updateField(key, v)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center gap-1">
                        <RadioGroupItem value="tidak" id={`${key}-tidak`} />
                        <label htmlFor={`${key}-tidak`}>Tidak</label>
                      </div>
                      <div className="flex items-center gap-1">
                        <RadioGroupItem value="ya" id={`${key}-ya`} />
                        <label htmlFor={`${key}-ya`}>Ya</label>
                      </div>
                    </RadioGroup>
                  </div>
                ))}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Cek Eligibilitas
                </Button>
              </form>
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.eligible ? (
                    <>
                      <CheckCircle2 className="size-5 text-green-500" />
                      Hasil Eligibilitas
                    </>
                  ) : (
                    <>
                      <XCircle className="size-5 text-red-500" />
                      Hasil Eligibilitas
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={result.eligible ? "success" : "destructive"}
                    className="text-sm px-3 py-1"
                  >
                    {result.eligible
                      ? "LAYAK DONOR"
                      : "BELUM LAYAK DONOR"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {result.persyaratan.map((p) => (
                    <div
                      key={p.label}
                      className="flex items-center justify-between rounded-lg border p-3 text-sm"
                    >
                      <span>{p.label}</span>
                      {p.terpenuhi ? (
                        <CheckCircle2 className="size-4 text-green-500" />
                      ) : (
                        <XCircle className="size-4 text-red-500" />
                      )}
                    </div>
                  ))}
                </div>

                {result.alasan.length > 0 && (
                  <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                    <p className="font-medium">Syarat tidak terpenuhi:</p>
                    <ul className="mt-1 list-disc pl-4">
                      {result.alasan.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {result.rekomendasi}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
