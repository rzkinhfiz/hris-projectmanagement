# Development Roadmap Guide

## Tujuan
Panduan ini menyusun fase pengembangan sistem PMO berdasarkan struktur App Router Next.js dan folder flat yang ada. Tujuan: membangun aplikasi terarah, modular, dan mudah dikembangkan.

## Struktur Root Direkomendasikan

```
/app
/components
/hooks
/lib
/services
/types
/build-guides
```

## Fase 1: Setup Platform & Authentication

### Target
Menyiapkan dasar project, Supabase, dan autentikasi.

### Deliverables
- Konfigurasi `next.config.ts` & Tailwind jika dibutuhkan.
- `/lib/supabaseClient.ts` untuk koneksi Supabase.
- `/hooks/useAuth.ts` untuk mengambil session/role.
- Tabel `profiles`, `projects`, `project_team_members`.
- Setup Supabase Auth dan role assignment.

### Catatan
Pastikan role tersedia pada session auth agar UI bisa membaca `project_team`, `project_manager`, dan `pmo`.

## Fase 2: Core Data Model & RLS

### Target
Membangun model data inti dan keamanan access.

### Deliverables
- Tabel `tasks`, `progress_updates`, `workstreams`.
- Tabel `governance_indicators`, `governance_warnings`.
- Implementasi RLS di Supabase.
- Service CRUD dasar:
  - `/services/projects.ts`
  - `/services/tasks.ts`
  - `/services/progress.ts`
- Komponen data fetch awal di page.

### Catatan
Verifikasi policy Supabase untuk memastikan governance hanya write oleh `pmo`.

## Fase 3: Project Team & Project Manager Workflow

### Target
Menambahkan fungsi input operasional dan planning execution.

### Deliverables
- page `app/dashboard/page.tsx`
- page `app/projects/page.tsx`
- page `app/projects/[id]/page.tsx`
- Komponen:
  - `KpiCard`
  - `ProjectTable`
  - `ProgressGauge`
  - `RoleGuard`
- Fitur:
  - `Submit Progress` untuk `project_team`
  - `Edit Plan` untuk `project_manager`
  - status tracking task

### Catatan
Jaga agar area monitoring tetap read-only, bahkan ketika halaman proyek memiliki form input operasi.

## Fase 4: Governance Monitoring

### Target
Membangun area monitoring full governance dan warning engine.

### Deliverables
- `/services/governance` folder dengan:
  - `comparator.ts`
  - `thresholds.ts`
  - `warnings.ts`
  - `governanceService.ts`
- page `app/governance/page.tsx`
- komponen `GovernancePanel`, `MonitoringSummary`, `WarningPanel`
- logika read-only UI untuk non-PMO
- tampilan dashboard governance data

### Catatan
Arahkan semua interaksi governance ke tampilan data. Tombol aksi hanya boleh terlihat untuk `pmo`.

## Fase 5: UI Polish dan Konsistensi Design System

### Target
Menyempurnakan tampilan dan pengalaman pengguna.

### Deliverables
- Konsistensi Tailwind utility classes di komponen.
- Responsive layout dengan `grid` dan `flex`.
- Loading skeleton / empty state.
- Badge status untuk `green`, `yellow`, `red`.
- Perbaikan visual berdasarkan referensi.

### Catatan
Gunakan `components/` untuk menyimpan UI reusable dan hindari duplikasi.

## Fase 6: QA, Audit, Dokumentasi

### Target
Menjamin bahwa sistem berjalan sesuai aturan bisnis dan aman.

### Deliverables
- Review RLS dan role-based access.
- Audit log `audit_logs` untuk perubahan penting.
- Dokumentasi implementasi di README/metode internal.
- Validasi bahwa governance area tidak memiliki input/edit untuk non-PMO.

## Prioritas dan Uji Integrasi

1. Auth + role mapping
2. Model data + RLS
3. Data workflow `project_team` & `project_manager`
4. Governance comparator + warning
5. UI/UX sesuai referensi
6. Audit, dokumentasi, release readiness

## Rekomendasi Implementasi App Router

- Gunakan `app/layout.tsx` untuk layout global.
- Pisahkan halaman route:
  - `/dashboard`
  - `/projects`
  - `/projects/[id]`
  - `/governance`
- Letakkan data fetch di server components sesuai kebutuhan.
- Gunakan client components hanya untuk interaction dan hooks.

## Catatan untuk Flat Folder

- Data access: `/services`
- UI: `/components`
- State / session hooks: `/hooks`
- Client helper: `/lib`
- Tipe: `/types`
- Blueprint: `/build-guides`

Dengan roadmap ini, pengembangan dapat berjalan sistematis dan setiap fase dapat diselesaikan sambil menjaga integrasi antara App Router, Supabase, dan desain UI/Tailwind.