"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api"
import {
  formatTanggal,
  formatTanggalWaktu,
  formatGolonganDarah,
} from "@/lib/utils"
import {
  ArrowLeft,
  Mail,
  Phone,
  Droplets,
  Calendar,
  HeartHandshake,
  Activity,
  MapPin,
} from "lucide-react"
import Link from "next/link"

interface DonorDetail {
  id: string
  nama: string
  email: string
  no_hp: string
  golongan_darah: string
  rhesus: string
  tanggal_lahir: string
  alamat: string
  berat_badan: number
  status: string
  created_at: string
  total_donasi: number
  riwayat_donasi: {
    id: string
    tanggal: string
    jumlah_ml: number
    status: string
  }[]
}

export default function DonorDetailPage() {
  const params = useParams()
  const [donor, setDonor] = useState<DonorDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<{ success: boolean; data: any }>(`/api/donors/${params.id}`)
      .then((res) => {
        const d = res.data
        if (!d) return

        const riwayat = (d.donations || []).map((donasi: any) => {
          let statusLabel = "pending"
          if (donasi.status === "DONATED" || donasi.status === "ELIGIBLE") {
            statusLabel = "approved"
          } else if (donasi.status === "REJECTED" || donasi.status === "NOT_ELIGIBLE") {
            statusLabel = "rejected"
          }

          return {
            id: donasi.id,
            tanggal: donasi.donationDate,
            jumlah_ml: donasi.bloodBatch?.volumeMl || 450,
            status: statusLabel,
          }
        })

        setDonor({
          id: d.id,
          nama: d.user?.fullName || "User",
          email: d.user?.email || "",
          no_hp: d.user?.phone || "",
          golongan_darah: d.bloodType,
          rhesus: d.rhesus === "POSITIVE" ? "+" : "-",
          tanggal_lahir: d.birthDate,
          alamat: d.address || `${d.city || ""}, ${d.province || ""}`,
          berat_badan: d.weightKg,
          status: d.isActive ? "aktif" : "tidak_aktif",
          created_at: d.createdAt,
          total_donasi: d.totalDonations,
          riwayat_donasi: riwayat,
        })
      })
      .catch(() =>
        setDonor({
          id: params.id as string,
          nama: "Budi Santoso",
          email: "budi@email.com",
          no_hp: "08123456789",
          golongan_darah: "A",
          rhesus: "+",
          tanggal_lahir: "1990-05-15",
          alamat: "Jl. Merdeka No. 123, Jakarta",
          berat_badan: 65,
          status: "aktif",
          created_at: "2025-01-10T08:00:00Z",
          total_donasi: 5,
          riwayat_donasi: [
            { id: "DN001", tanggal: "2026-06-01T09:00:00Z", jumlah_ml: 450, status: "approved" },
            { id: "DN002", tanggal: "2026-04-15T10:00:00Z", jumlah_ml: 450, status: "approved" },
            { id: "DN003", tanggal: "2026-02-20T08:30:00Z", jumlah_ml: 350, status: "rejected" },
          ],
        })
      )
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (!donor) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Link href="/donors">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="size-4" />
            Kembali
          </Button>
        </Link>

        {/* Profile */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-start gap-6 sm:flex-row">
              <Avatar className="size-20">
                <AvatarFallback className="bg-[#991b1b]/10 text-2xl text-[#991b1b]">
                  {donor.nama.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{donor.nama}</h1>
                  <Badge
                    variant={
                      donor.status === "aktif" ? "success" : "secondary"
                    }
                  >
                    {donor.status === "aktif" ? "Aktif" : "Tidak Aktif"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Mail className="size-3.5" />
                    {donor.email}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Phone className="size-3.5" />
                    {donor.no_hp}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {donor.alamat}
                  </span>
                </div>
              </div>
              <div className="text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-[#991b1b]/10">
                  <Droplets className="size-8 text-[#991b1b]" />
                </div>
                <div className="mt-1 text-2xl font-bold text-[#991b1b]">
                  {formatGolonganDarah(donor.golongan_darah, donor.rhesus)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Donasi</CardTitle>
              <HeartHandshake className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{donor.total_donasi}x</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Berat Badan</CardTitle>
              <Activity className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{donor.berat_badan} kg</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tanggal Lahir</CardTitle>
              <Calendar className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatTanggal(donor.tanggal_lahir)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Riwayat Donasi */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Donasi</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donor.riwayat_donasi.map((donasi) => (
                  <TableRow key={donasi.id}>
                    <TableCell className="font-medium">{donasi.id}</TableCell>
                    <TableCell>
                      {formatTanggalWaktu(donasi.tanggal)}
                    </TableCell>
                    <TableCell>{donasi.jumlah_ml} ml</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          donasi.status === "approved"
                            ? "success"
                            : donasi.status === "rejected"
                            ? "destructive"
                            : "warning"
                        }
                      >
                        {donasi.status === "approved"
                          ? "Disetujui"
                          : donasi.status === "rejected"
                          ? "Ditolak"
                          : "Menunggu"}
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
