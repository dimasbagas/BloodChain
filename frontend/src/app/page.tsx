import Link from "next/link"
import { Droplets, Shield, Heart, TrendingUp, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 flex h-16 w-full items-center border-b bg-background/80 backdrop-blur-sm px-6">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#991b1b]">
              <Droplets className="size-5 text-white" />
            </div>
            <span className="text-lg font-bold">BloodChain</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost">Masuk</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Daftar</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-[90vh] items-center justify-center px-6 pt-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#991b1b]/10 via-background to-background" />
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
            <span className="size-2 rounded-full bg-green-500" />
            Platform Digital Supply Chain Darah
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
            Kelola Rantai Pasok Darah{" "}
            <span className="text-[#991b1b]">Secara Digital</span>
          </h1>
          <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
            BloodChain menghubungkan PMI, rumah sakit, dan donor dalam satu
            platform terintegrasi untuk memastikan ketersediaan darah yang aman
            dan tepat waktu.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="gap-2">
                Mulai Sekarang
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg">Sudah Punya Akun?</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold">
              Fitur Unggulan BloodChain
            </h2>
            <p className="text-muted-foreground">
              Solusi lengkap untuk ekosistem darah digital
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border p-6 transition-colors hover:border-[#991b1b]/30"
              >
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-[#991b1b]/10">
                  <feature.icon className="size-6 text-[#991b1b]" />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t bg-muted/30 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 text-center md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-[#991b1b]">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold">
            Siap Bergabung?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Daftarkan diri Anda sekarang dan jadilah bagian dari ekosistem
            darah digital Indonesia.
          </p>
          <Link href="/auth/register">
            <Button size="lg">Daftar Akun</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-sm text-muted-foreground">
          <span>&copy; 2026 BloodChain. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-foreground">
              Kebijakan Privasi
            </Link>
            <Link href="#" className="hover:text-foreground">
              Syarat & Ketentuan
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: Shield,
    title: "Manajemen Donor",
    description:
      "Kelola data donor dengan e-kuesioner kesehatan dan riwayat donasi lengkap.",
  },
  {
    icon: Heart,
    title: "Inventori Real-time",
    description:
      "Pantau stok darah secara real-time dengan notifikasi stok menipis.",
  },
  {
    icon: TrendingUp,
    title: "Forecasting",
    description:
      "Prediksi permintaan darah dengan analisis data historis dan AI.",
  },
  {
    icon: Droplets,
    title: "Distribusi Terpadu",
    description:
      "Tracking pengiriman darah dari PMI ke rumah sakit secara end-to-end.",
  },
]

const stats = [
  { value: "50+", label: "PMI Terhubung" },
  { value: "200+", label: "Rumah Sakit" },
  { value: "10K+", label: "Donor Terdaftar" },
  { value: "5K+", label: "Kantong Darah Tersalurkan" },
]
