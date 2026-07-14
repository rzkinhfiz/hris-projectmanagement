# Project Tracker - PMO Monitoring & Governance

## Fase 1: Setup Platform & Authentication
Referensi: `build-guides/development-roadmap-guide.md`, `build-guides/system-architecture-data-schema-guide.md`

- [ ] Buat `/lib/supabaseClient.ts` untuk koneksi Supabase dan share client di seluruh aplikasi. | Priority: High
- [ ] Siapkan Supabase Auth dan role assignment untuk `project_team`, `project_manager`, dan `pmo`. | Priority: High
- [ ] Buat tabel `profiles` di Supabase dengan kolom `role`, `email`, `full_name`, dan `project_id`. | Priority: High
- [ ] Buat halaman auth awal / hook `/hooks/useAuth.ts` untuk membaca session dan role. | Priority: High
- [ ] Verifikasi bahwa role tersedia dalam session sehingga UI dapat menentukan akses. | Priority: Medium

## Fase 2: Core Data Model & RLS
Referensi: `build-guides/system-architecture-data-schema-guide.md`, `build-guides/development-roadmap-guide.md`

- [ ] Buat tabel `projects` di Supabase dengan kolom `code`, `name`, `description`, `status`, `start_date`, `end_date`, `pm_id`, `pmo_id`. | Priority: High
- [ ] Buat tabel `project_team_members` untuk relasi anggota tim proyek. | Priority: High
- [ ] Buat tabel `workstreams` dengan struktur `project_id`, `parent_id`, `level`, `name`, `status`. | Priority: Medium
- [ ] Buat tabel `tasks` dengan kolom `project_id`, `workstream_id`, `owner_id`, `progress`, `status`, `is_governance_readonly`. | Priority: High
- [ ] Buat tabel `progress_updates` untuk pencatatan update progress. | Priority: Medium
- [ ] Buat tabel `governance_indicators` dan `governance_warnings`. | Priority: High
- [ ] Terapkan RLS pada `projects`, `tasks`, `progress_updates`, `governance_indicators`, dan `governance_warnings`. | Priority: High
- [ ] Buat helper RLS `public.is_project_member(project_id)` di Supabase. | Priority: Medium
- [ ] Buat service CRUD dasar di `/services`:
  - `/services/projects.ts`
  - `/services/tasks.ts`
  - `/services/progress.ts` | Priority: High

## Fase 3: Project Team & Project Manager Workflow
Referensi: `build-guides/ui-ux-design-system-guide.md`, `build-guides/development-roadmap-guide.md`

- [ ] Tambahkan route page `app/dashboard/page.tsx` untuk dashboard utama. | Priority: High
- [ ] Tambahkan route page `app/projects/page.tsx` untuk daftar proyek. | Priority: High
- [ ] Tambahkan route page `app/projects/[id]/page.tsx` untuk detail proyek. | Priority: High
- [ ] Buat komponen reusable di `/components`:
  - `Layout.tsx`
  - `Sidebar.tsx`
  - `Topbar.tsx`
  - `KpiCard.tsx`
  - `ProgressGauge.tsx`
  - `ProjectTable.tsx`
  - `RoleGuard.tsx` | Priority: High
- [ ] Implementasikan `Submit Progress` hanya untuk role `project_team` menggunakan `RoleGuard`. | Priority: High
- [ ] Implementasikan page `Edit Plan` / `Milestones` untuk role `project_manager`. | Priority: Medium
- [ ] Buat hook `/hooks/useProjectData.ts` untuk fetch data project dan task. | Priority: Medium
- [ ] Pastikan area Monitoring di halaman ini tidak memiliki input/edit kecuali yang memang berfungsi operasional. | Priority: Medium

## Fase 4: Governance Monitoring
Referensi: `build-guides/logic-business-rules-guide.md`, `build-guides/ui-ux-design-system-guide.md`

- [ ] Buat folder `/services/governance/` dan file:
  - `comparator.ts`
  - `thresholds.ts`
  - `warnings.ts`
  - `governanceService.ts` | Priority: High
- [ ] Implementasikan fungsi `compareSchedule`, `compareCost`, dan `compareProgress` di `/services/governance/comparator.ts`. | Priority: High
- [ ] Implementasikan ambang batas status (`green`, `yellow`, `red`) di `/services/governance/thresholds.ts`. | Priority: High
- [ ] Implementasikan pemicu warning di `/services/governance/warnings.ts`. | Priority: High
- [ ] Buat page `app/governance/page.tsx` untuk tampilan monitoring governance. | Priority: High
- [ ] Buat komponen monitoring read-only di `/components`:
  - `GovernancePanel.tsx`
  - `MonitoringSummary.tsx`
  - `WarningPanel.tsx` | Priority: High
- [ ] Pastikan semua kontrol input/edit di area monitoring hanya terlihat untuk role `pmo`. | Priority: High

## Fase 5: UI Polish dan Konsistensi Design System
Referensi: `build-guides/ui-ux-design-system-guide.md`, `build-guides/development-roadmap-guide.md`

- [ ] Konsolidasikan class Tailwind di seluruh komponen UI agar konsisten. | Priority: Medium
- [ ] Terapkan responsive layout grid untuk dashboard dan governance. | Priority: Medium
- [ ] Tambahkan loading skeleton / empty state di komponen data fetch. | Priority: Medium
- [ ] Gunakan badge status `green`, `yellow`, `red` pada indikator dan warning. | Priority: Medium
- [ ] Pastikan tampilan mengikuti referensi visual tanpa mengorbankan aksesibilitas. | Priority: Low

## Fase 6: QA, Audit, Dokumentasi
Referensi: `build-guides/system-architecture-data-schema-guide.md`, `build-guides/development-roadmap-guide.md`

- [ ] Buat tabel `audit_logs` untuk pencatatan operasi penting. | Priority: Medium
- [ ] Verifikasi semua RLS berjalan sesuai aturan, terutama governance read-only untuk non-PMO. | Priority: High
- [ ] Test akses role: `project_team`, `project_manager`, `pmo`. | Priority: High
- [ ] Tulis dokumentasi singkat implementasi di README atau file internal. | Priority: Low
- [ ] Review roadmap dan perbarui tracker bila diperlukan. | Priority: Low

## Governance Readiness Checklist
Referensi: `build-guides/system-architecture-data-schema-guide.md`, `build-guides/ui-ux-design-system-guide.md`

- [ ] Pastikan `governance_indicators` dan `governance_warnings` memiliki policy read-only untuk `project_team` dan `project_manager`. | Priority: High
- [ ] Verifikasi bahwa hanya `pmo` dapat mengubah atau menghapus data governance. | Priority: High
- [ ] Di UI, tampilkan badge `Read-only` pada area governance untuk semua non-PMO. | Priority: Medium
- [ ] Pastikan komponen `GovernancePanel` dan `MonitoringSummary` tidak memiliki field input untuk non-PMO. | Priority: High
- [ ] Pastikan service governance di `/services/governance/` memisahkan logic dari UI sehingga tidak ada business rule di komponen. | Priority: Medium
- [ ] Buat validasi tambahan pada service data jika role non-PMO mencoba action governance. | Priority: High
