import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, parseISO } from "date-fns"
import { id } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTanggal(date: string | Date | null | undefined): string {
  if (!date) return "-"
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "dd MMMM yyyy", { locale: id })
}

export function formatTanggalWaktu(date: string | Date | null | undefined): string {
  if (!date) return "-"
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "dd MMMM yyyy HH:mm", { locale: id })
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return "-"
  const d = typeof date === "string" ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: id })
}

export function formatGolonganDarah(golongan: string, rhesus?: string): string {
  const Rh = rhesus ?? "+"
  return `${golongan}${Rh}`
}

export function formatKomponenDarah(value: string): string {
  const map: Record<string, string> = {
    whole_blood: "Darah Lengkap (WB)",
    prc: "Packed Red Cells (PRC)",
    platelet: "Platelet Concentrate",
    ffp: "Fresh Frozen Plasma (FFP)",
    cryoprecipitate: "Cryoprecipitate",
  }
  return map[value] ?? value
}

export function formatStatus(value: string): string {
  const map: Record<string, string> = {
    pending: "Menunggu",
    screening: "Skrining",
    approved: "Disetujui",
    rejected: "Ditolak",
    cancelled: "Dibatalkan",
    diproses: "Diproses",
    dipenuhi: "Dipenuhi",
    dibatalkan: "Dibatalkan",
    tersedia: "Tersedia",
    dipesan: "Dipesan",
    kedaluwarsa: "Kedaluwarsa",
    dipakai: "Dipakai",
    regular: "REGULAR",
    cito: "CITO (Darurat)",
    dipersiapkan: "Dipersiapkan",
    dikirim: "Dikirim",
    diterima: "Diterima",
    gagal: "Gagal",
    critical: "Kritis",
    warning: "Peringatan",
    info: "Info",
  }
  return map[value] ?? value
}

export function formatNomorRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
