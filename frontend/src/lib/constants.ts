export const GOLONGAN_DARAH = ["A", "B", "AB", "O"] as const
export const RHESUS = ["+", "-"] as const

export const KOMPONEN_DARAH = [
  { value: "whole_blood", label: "Darah Lengkap (WB)" },
  { value: "prc", label: "Packed Red Cells (PRC)" },
  { value: "platelet", label: "Platelet Concentrate (TC)" },
  { value: "ffp", label: "Fresh Frozen Plasma (FFP)" },
  { value: "cryoprecipitate", label: "Cryoprecipitate" },
] as const

export const STATUS_DONASI = [
  { value: "pending", label: "Menunggu", color: "bg-yellow-500" },
  { value: "screening", label: "Skrining", color: "bg-blue-500" },
  { value: "approved", label: "Disetujui", color: "bg-green-500" },
  { value: "rejected", label: "Ditolak", color: "bg-red-500" },
  { value: "cancelled", label: "Dibatalkan", color: "bg-gray-500" },
] as const

export const STATUS_PERMINTAAN = [
  { value: "pending", label: "Menunggu", color: "bg-yellow-500" },
  { value: "diproses", label: "Diproses", color: "bg-blue-500" },
  { value: "dipenuhi", label: "Dipenuhi", color: "bg-green-500" },
  { value: "dibatalkan", label: "Dibatalkan", color: "bg-red-500" },
] as const

export const STATUS_DISTRIBUSI = [
  { value: "dipersiapkan", label: "Dipersiapkan" },
  { value: "dikirim", label: "Dikirim" },
  { value: "diterima", label: "Diterima" },
  { value: "gagal", label: "Gagal" },
] as const

export const STATUS_INVENTARIS = [
  { value: "tersedia", label: "Tersedia", color: "bg-green-500" },
  { value: "dipesan", label: "Dipesan", color: "bg-blue-500" },
  { value: "kedaluwarsa", label: "Kedaluwarsa", color: "bg-red-500" },
  { value: "dipakai", label: "Dipakai", color: "bg-gray-500" },
] as const

export const ROLE = {
  ADMIN: "admin",
  PMI: "pmi",
  RUMAH_SAKIT: "rumah_sakit",
  DONOR: "donor",
} as const

export const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  pmi: "PMI",
  rumah_sakit: "Rumah Sakit",
  donor: "Donor",
}

export const TIPE_PERMINTAAN = [
  { value: "regular", label: "REGULAR" },
  { value: "cito", label: "CITO (Darurat)" },
] as const

export const ALERT_LEVELS = [
  { value: "critical", label: "Kritis", color: "bg-red-600" },
  { value: "warning", label: "Peringatan", color: "bg-yellow-500" },
  { value: "info", label: "Info", color: "bg-blue-500" },
] as const
