# PRODUCT REQUIREMENTS DOCUMENT (PRD)

# BloodChain

### Smart Blood Supply for Better Healthcare

Version: 1.0

---

# 1. PRODUCT OVERVIEW

BloodChain adalah platform Digital Supply Chain Darah yang menghubungkan Pendonor, PMI/UTD, Rumah Sakit, dan Admin dalam satu ekosistem terintegrasi.

Tujuan utama sistem adalah:

* Menjamin ketersediaan darah secara real-time
* Mengurangi risiko kehabisan stok darah
* Mengurangi darah kedaluwarsa
* Mempercepat distribusi darah darurat
* Mengoptimalkan rantai pasok darah nasional
* Menyediakan monitoring supply chain darah end-to-end

Sistem menerapkan konsep:

* Digital Supply Chain (DSC)
* FEFO (First Expired First Out)
* Real-Time Inventory
* Smart Donor Calling
* Blood Demand Forecasting
* Geospatial Distribution

---

# 2. PROBLEM STATEMENT

Permasalahan utama yang ingin diselesaikan:

1. Ketersediaan darah tidak merata.
2. Banyak darah terbuang karena kedaluwarsa.
3. Proses permintaan darah masih manual.
4. Tidak ada visibilitas stok antar PMI.
5. Distribusi darah darurat memerlukan waktu lama.
6. Sulit memprediksi kebutuhan darah masa depan.
7. Sulit mencari donor aktif saat stok kritis.

---

# 3. USER ROLES

## Pendonor

Hak akses:

* Registrasi akun
* Melihat status donor
* Mengisi e-kuesioner kesehatan
* Melihat jadwal donor
* Menerima notifikasi donor
* Melihat riwayat donor
* Mengunduh e-sertifikat donor

---

## PMI / UTD

Hak akses:

* Verifikasi donor
* Input hasil pemeriksaan laboratorium
* Kelola inventori darah
* Kelola permintaan darah
* Kelola distribusi darah
* Monitoring stok
* Monitoring expired blood

---

## Rumah Sakit

Hak akses:

* Mengajukan permintaan darah
* Melihat stok yang tersedia
* Melacak distribusi
* Konfirmasi penerimaan darah

---

## Admin

Hak akses:

* Kelola seluruh pengguna
* Kelola wilayah operasional
* Kelola parameter sistem
* Audit log
* Monitoring nasional

---

# 4. CORE BUSINESS FLOW

PENDONOR
↓
DONOR DARAH
↓
PEMERIKSAAN LABORATORIUM
↓
VALIDASI KELAYAKAN
↓
STOK DARAH MASUK INVENTORI
↓
PERMINTAAN DARAH RS
↓
ALOKASI FEFO
↓
DISTRIBUSI DARAH
↓
KONFIRMASI PENERIMAAN
↓
MONITORING & ANALYTICS

---

# 5. MODULES

## MODULE 1 - DONOR MANAGEMENT

Fitur:

* Registrasi donor
* Profil donor
* E-kuesioner kesehatan
* Riwayat donor
* Donor eligibility validation
* Reminder donor berikutnya

Data:

* Nama
* NIK
* Golongan darah
* Rhesus
* Alamat
* Nomor HP
* Tanggal donor terakhir

---

## MODULE 2 - DONOR ELIGIBILITY ENGINE

Validasi otomatis:

Usia:

* Minimal 17 tahun
* Maksimal 60 tahun

Berat badan:

* Minimal 45 kg

Tekanan darah:

* Sistole 90–160
* Diastole 60–100

Hemoglobin:

* 12.5–17.0 g/dL

Retensi donor:

* Minimal 75 hari sejak donor terakhir

Output:

* Eligible
* Not Eligible
* Waiting Period

---

## MODULE 3 - BLOOD SCREENING MANAGEMENT

Pencatatan:

* HIV
* Hepatitis B
* Hepatitis C
* Sifilis

Status:

* Lolos
* Tidak Lolos

Hanya darah berstatus "Lolos" yang dapat masuk inventori.

---

## MODULE 4 - BLOOD INVENTORY MANAGEMENT

Pengelolaan:

* Stok darah
* Batch darah
* Barcode kantong darah
* Expiry tracking

Komponen darah:

* WB
* PRC
* TC
* FFP

Status:

* Available
* Reserved
* Distributed
* Used
* Expired

---

## MODULE 5 - FEFO ALLOCATION ENGINE

Aturan:

Saat permintaan darah masuk:

1. Cari stok yang sesuai

2. Cocokkan:

   * Golongan darah
   * Rhesus
   * Komponen darah

3. Urutkan:

ORDER BY expiry_date ASC

4. Ambil stok yang paling dekat masa kedaluwarsanya.

Tujuan:

* Mengurangi blood waste
* Memaksimalkan utilisasi stok

---

## MODULE 6 - BLOOD REQUEST MANAGEMENT

Rumah sakit dapat membuat:

### Regular Request

Prioritas normal.

### Cito Request

Prioritas darurat.

Workflow:

Pending
→ Diproses
→ Disetujui
→ Dikirim
→ Selesai

atau

Pending
→ Ditolak

---

## MODULE 7 - DISTRIBUTION MANAGEMENT

Fitur:

* Manifes digital
* Tracking pengiriman
* Monitoring suhu box darah
* QR serah terima

Status:

* Packing
* On Medical Courier
* Arrived
* Completed

Data distribusi:

* Kurir
* Lokasi
* Suhu awal
* Suhu saat pengiriman
* Waktu pengiriman

---

## MODULE 8 - CROSS PMI STOCK SHARING

Jika stok darah kosong:

Sistem otomatis:

1. Mencari PMI terdekat
2. Menggunakan koordinat GPS
3. Menghitung jarak dengan rumus Haversine
4. Menampilkan PMI yang memiliki stok

Status:

"Subsidi Silang Antar PMI"

Fitur:

* Inter PMI transfer
* Emergency allocation

---

## MODULE 9 - LOW STOCK ALERT

Safety Stock:

A:
20 kantong

B:
20 kantong

AB:
10 kantong

O:
30 kantong

Jika stok <= safety stock:

Sistem:

* Dashboard merah
* Push notification
* Alert ke petugas PMI
* Alert ke Admin

---

## MODULE 10 - SMART DONOR CALLING

Saat stok kritis:

Sistem mencari donor yang:

* Golongan darah sesuai
* Radius maksimal 10 km
* Status aktif
* Sudah melewati masa retensi

Notifikasi dikirim melalui:

* Mobile App
* WhatsApp
* SMS
* Email

---

## MODULE 11 - BLOOD EXPIRED WARNING

Cron Job:

Setiap hari jam 00:00

Rule:

Jika expiry_date <= 7 hari

Maka:

* Status Kritis Kedaluwarsa
* Prioritas FEFO tertinggi
* Alert dashboard

---

## MODULE 12 - BLOOD DEMAND FORECASTING

Tujuan:

Memprediksi kebutuhan darah masa depan.

Input:

* Riwayat permintaan darah
* Data musiman
* Libur nasional
* Musim hujan
* Event besar

Output:

* Prediksi kebutuhan bulanan
* Prediksi kebutuhan per golongan darah
* Prediksi kebutuhan per komponen darah

Rekomendasi:

* Mobile donor event
* Target pengumpulan darah
* Strategi distribusi

---

## MODULE 13 - REAL-TIME SUPPLY CHAIN DASHBOARD

Supply Metrics:

* Total stok darah
* Donor aktif
* Distribusi aktif

Risk Metrics:

* Low stock
* Expired warning
* Pending request

Demand Metrics:

* Total permintaan
* Permintaan Cito
* Permintaan selesai

Logistics Metrics:

* Pengiriman aktif
* ETA pengiriman
* Tracking kurir

Predictive Metrics:

* Forecast kebutuhan
* Forecast stok
* Prediksi kekurangan darah

---

# 6. NON FUNCTIONAL REQUIREMENTS

Performance:

* Response time < 2 detik

Availability:

* Uptime 99.9%

Security:

* JWT Authentication
* RBAC
* Audit Trail
* Password Hashing

Realtime:

* WebSocket
* Live Dashboard

Scalability:

* Multi PMI
* Multi Rumah Sakit
* Multi Wilayah

---

# 7. RECOMMENDED TECH STACK

Frontend:

* Next.js 15
* TypeScript
* TailwindCSS
* Shadcn UI

Backend:

* NestJS

Database:

* PostgreSQL

Realtime:

* Socket.IO

Maps:

* OpenStreetMap
* Leaflet

Notifications:

* WhatsApp Gateway
* Firebase Cloud Messaging
* Email Service

AI Forecasting:

* Python FastAPI
* Prophet

Deployment:

* Docker
* GitHub Actions
* VPS / Cloud Server

---

# SUCCESS METRICS

* Pengurangan darah kedaluwarsa ≥ 30%
* Penurunan stockout ≥ 50%
* Waktu respon permintaan Cito < 15 menit
* Akurasi forecasting ≥ 85%
* Peningkatan donor aktif ≥ 25%

END OF DOCUMENT
