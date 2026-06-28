"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { formatTanggal, formatGolonganDarah } from "@/lib/utils"
import {
  Search,
  Plus,
  Users,
  Filter,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GOLONGAN_DARAH } from "@/lib/constants"
import Link from "next/link"

interface Donor {
  id: string
  nama: string
  email: string
  no_hp: string
  golongan_darah: string
  rhesus: string
  total_donasi: number
  terakhir_donasi: string | null
  status: string
  created_at: string
}

export default function DonorsPage() {
  const [donors, setDonors] = useState<Donor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterGol, setFilterGol] = useState("")

  useEffect(() => {
    api
      .get<{ success: boolean; data: any[] }>("/api/donors")
      .then((res) => {
        const mapped = (res.data || []).map((d: any) => ({
          id: d.id,
          nama: d.user?.fullName || "User",
          email: d.user?.email || "",
          no_hp: d.user?.phone || "",
          golongan_darah: d.bloodType,
          rhesus: d.rhesus === "POSITIVE" ? "+" : "-",
          total_donasi: d.totalDonations,
          terakhir_donasi: d.lastDonationAt,
          status: d.isActive ? "aktif" : "tidak_aktif",
          created_at: d.createdAt,
        }))
        setDonors(mapped)
      })
      .catch(() =>
        setDonors(
          Array.from({ length: 12 }, (_, i) => ({
            id: `D${String(i + 1).padStart(4, "0")}`,
            nama: `Donor ${i + 1}`,
            email: `donor${i + 1}@email.com`,
            no_hp: "08123456789",
            golongan_darah: ["A", "B", "AB", "O"][i % 4],
            rhesus: "+",
            total_donasi: Math.floor(Math.random() * 10),
            terakhir_donasi: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: ["aktif", "aktif", "aktif", "tidak_aktif"][i % 4],
            created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          }))
        )
      )
      .finally(() => setLoading(false))
  }, [])

  async function handleToggleStatus(id: string, currentStatus: string) {
    const nextStatus = currentStatus === "aktif" ? false : true;
    try {
      await api.put(`/api/donors/${id}`, { isActive: nextStatus });
      setDonors((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, status: nextStatus ? "aktif" : "tidak_aktif" } : d
        )
      );
      toast.success(`Status donor berhasil diperbarui`);
    } catch {
      toast.error("Gagal memperbarui status donor");
    }
  }

  const filtered = donors.filter((d) => {
    const matchSearch =
      !search ||
      d.nama.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase())
    const matchGol = !filterGol || d.golongan_darah === filterGol
    return matchSearch && matchGol
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Manajemen Donor</h1>
            <p className="text-muted-foreground">
              Kelola data donor darah
            </p>
          </div>
          <Link href="/donations/new">
            <Button>
              <Plus className="mr-2 size-4" />
              Donor Baru
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari donor..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterGol} onValueChange={setFilterGol}>
            <SelectTrigger className="w-40">
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
                  <TableHead>ID</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Gol. Darah</TableHead>
                  <TableHead>Total Donasi</TableHead>
                  <TableHead>Terakhir Donasi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
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
                  : filtered.map((donor) => (
                      <TableRow key={donor.id}>
                        <TableCell className="font-medium">
                          {donor.id}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/donors/${donor.id}`}
                            className="text-[#991b1b] hover:underline"
                          >
                            {donor.nama}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">{donor.email}</div>
                          <div className="text-xs text-muted-foreground">
                            {donor.no_hp}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatGolonganDarah(
                              donor.golongan_darah,
                              donor.rhesus
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>{donor.total_donasi}x</TableCell>
                        <TableCell className="text-xs">
                          {formatTanggal(donor.terakhir_donasi)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              donor.status === "aktif"
                                ? "success"
                                : "secondary"
                            }
                          >
                            {donor.status === "aktif" ? "Aktif" : "Tidak Aktif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Link href={`/donors/${donor.id}`} passHref>
                                <DropdownMenuItem className="cursor-pointer">
                                  Lihat Detail
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => handleToggleStatus(donor.id, donor.status)}
                              >
                                {donor.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
