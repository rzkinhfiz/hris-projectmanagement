# PROJECT CONTEXT

## Manual Referensi Pengembangan Aplikasi PMO
Dokumen ini adalah referensi utama untuk setiap AI agen yang membantu membangun aplikasi PMO. Jangan menulis kode tanpa terlebih dahulu merujuk ke file panduan di `/build-guides/`.

---

## 1. Overview Proyek
Aplikasi Project Management Office (PMO) ini dibangun dengan Next.js App Router, Tailwind CSS, dan Supabase. Fokus utama:
- Memisahkan alur *Delivery Stream* dari *Governance Stream*.
- *Delivery Stream* mencakup perencanaan proyek, pelaksanaan tugas, dan pelaporan progress oleh `project_team` dan `project_manager`.
- *Governance Stream* mencakup monitoring, indikator, dan warning oleh `pmo`.
- Area governance harus bersifat *read-only* untuk role selain `pmo`.
- Semua logika bisnis governance diletakkan di `/services/governance/`.

## 2. Struktur Direktori Flat
Gunakan struktur root berikut sebagai patokan:

```
/app
/components
/services
/lib
/hooks
/types
/build-guides
```

- `/app`: halaman route App Router.
- `/components`: semua UI reusable.
- `/services`: semua service dan logic bisnis, khususnya governance.
- `/lib`: helper dan client utilities.
- `/hooks`: custom hooks untuk auth dan data.
- `/types`: tipe TypeScript.
- `/build-guides`: pedoman, roadmap, dan dokumen referensi.

## 3. Matriks Pemetaan Pekerjaan
Tabel berikut memetakan proses L3 berdasarkan PDF ke folder utama dan role yang bertanggung jawab.

| Proses / Fitur | Folder Utama | Role Utama |
|---|---|---|
| Inisialisasi proyek & planning | `/app`, `/services/projects.ts` | `project_manager` |
| Input dan update progress tugas | `/app`, `/services/tasks.ts`, `/services/progress.ts` | `project_team` |
| Manajemen milestone & workstream | `/app`, `/services/projects.ts` | `project_manager` |
| Monitoring indikator governance | `/app`, `/services/governance/` | `pmo` |
| Comparator engine dan warning | `/services/governance/` | `pmo` |
| Visual dashboard KPI & ringkas | `/components` | `project_manager`, `pmo`, `project_team` |
| Role-based UI rendering | `/components/RoleGuard.tsx`, `/hooks/useAuth.ts` | semua role |
| RLS dan security policy | `/build-guides/system-architecture-data-schema-guide.md` | `pmo` (desain) |

## 4. Aturan Emas (Governance Rules)
Semua AI agen harus mematuhi aturan berikut:

- Governance stream harus read-only untuk role selain `pmo`.
- Jangan menambahkan elemen `input`, `textarea`, `select`, atau tombol edit di area monitoring governance untuk `project_team` dan `project_manager`.
- Hanya `pmo` yang dapat melihat action button governance seperti `Resolve Warning` atau `Update Indicator`.
- Semua access control governance harus didukung dengan RLS di Supabase dan juga enforcement di UI.
- Komponen governance tidak boleh mengandung logika bisnis berat; gunakan `/services/governance/` untuk perhitungan.

## 5. Instruksi Integrasi untuk AI Agen
Setiap AI agen harus:

1. Selalu merujuk ke file panduan di `/build-guides/` sebelum menulis kode.
2. Validasi struktur folder flat root sebelum menambahkan file baru.
3. Tempatkan service logic di `/services/` dan presentasi UI di `/components/`.
4. Gunakan `/lib/supabaseClient.ts` untuk koneksi Supabase.
5. Gunakan `/hooks/useAuth.ts` untuk membaca role dan session.
6. Jangan memodifikasi atau menimpa aturan governance read-only tanpa persetujuan.

File panduan utama yang harus selalu dibaca:
- `build-guides/system-architecture-data-schema-guide.md`
- `build-guides/ui-ux-design-system-guide.md`
- `build-guides/logic-business-rules-guide.md`
- `build-guides/development-roadmap-guide.md`
- `TODO_LIST.md` sebagai project tracker utama untuk fase dan tugas.
