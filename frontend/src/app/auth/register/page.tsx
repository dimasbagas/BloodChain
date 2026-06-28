"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Droplets, Loader2 } from "lucide-react"
import { ROLE, ROLE_LABEL, GOLONGAN_DARAH, RHESUS } from "@/lib/constants"

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    nama: "",
    role: ROLE.DONOR,
    golongan_darah: "",
    rhesus: "+",
    no_hp: "",
  })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form.email, form.password, {
        nama: form.nama,
        role: form.role,
        golongan_darah: form.golongan_darah,
        rhesus: form.rhesus,
        no_hp: form.no_hp,
      })
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#991b1b]/5 to-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#991b1b]">
              <Droplets className="size-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Daftar BloodChain</CardTitle>
          <CardDescription>Buat akun baru Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="nama@email.com"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="no_hp">No. Handphone</Label>
              <Input
                id="no_hp"
                placeholder="08123456789"
                value={form.no_hp}
                onChange={(e) => updateField("no_hp", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Daftar Sebagai</Label>
              <Select
                value={form.role}
                onValueChange={(v) => updateField("role", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROLE.DONOR}>
                    {ROLE_LABEL[ROLE.DONOR]}
                  </SelectItem>
                  <SelectItem value={ROLE.PMI}>
                    {ROLE_LABEL[ROLE.PMI]}
                  </SelectItem>
                  <SelectItem value={ROLE.RUMAH_SAKIT}>
                    {ROLE_LABEL[ROLE.RUMAH_SAKIT]}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.role === ROLE.DONOR && (
              <div className="grid grid-cols-2 gap-4">
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
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                minLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Daftar
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link href="/auth/login" className="text-[#991b1b] hover:underline">
              Masuk
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
