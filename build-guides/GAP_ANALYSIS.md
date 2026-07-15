# 🔍 GAP ANALYSIS & SYSTEM ENRICHMENT ROADMAP (GAP_ANALYSIS.md)
**Project:** PMO Monitoring & Governance Application  
**Document Purpose:** Defines the current structural deficits of the Next.js & Supabase application compared to the operational reality of enterprise spreadsheets (`Dashboard Project Cons.xlsx` and `Project Management Tools.xlsx`).  
**Target Audience:** AI Copilots, LLM Coding Agents, and Developers.

---

## 1. EXECUTIVE SUMMARY & PROBLEM STATEMENT
Aplikasi kita saat ini telah memiliki fondasi keamanan **Row Level Security (RLS)** yang kuat dan **Comparator Engine** (`/services/governance/comparator.ts`) yang mampu mendeteksi varians keterlambatan jadwal ($\ge 20\%$) dan pembengkakan biaya secara otomatis. 

Namun, aplikasi saat ini masih **mengalami defisit variabel operasional** yang sangat kritis jika dibandingkan dengan alur kerja nyata pada 11+ sheet Excel yang digunakan oleh *stakeholder*. Aplikasi saat ini baru berfungsi sebagai *Task Tracker* sederhana, sementara kebutuhan nyata di lapangan membutuhkan fungsi **Enterprise PMO & ERP Portal** yang mampu melacak administrasi kontrak, termin faktur (revenue), alokasi beban kerja konsultan, dan manajemen risiko.

Dokumen ini adalah acuan resmi bagi AI Agen untuk melakukan pengayaan skema database (*Schema Enrichment*) dan penambahan modul UI/Services pada tahap pengembangan selanjutnya.

---

## 2. CORE DOMAIN DEFICITS & MISSING VARIABLES

### A. Domain 1: Administrasi Kontrak & Legalitas Proyek
**Kondisi Saat Ini:** Tabel `projects` hanya menyimpan `code`, `name`, `description`, `pm_id`, dan `status`.  
**Realitas Excel (Sheet: `PHR CO PROJECT`, `LIST NDA, BAST, SPK`):** Manajemen wajib melacak nomor Sales Order (SO), kelas proyek, status dokumen legal (NDA & SPK), serta tautan penyimpanan arsip kerja. Tanpa NDA/SPK yang tervalidasi, proyek tidak boleh dimulai atau ditagih.

**Defisit Skema yang Wajib Ditambahkan ke Tabel `projects`:**
* `sales_order_no` (Text/Varchar): Nomor SO referensi silang dengan sistem akuntansi (misal: `S09147`, `S10830`).
* `project_class` (Text/Enum): Klasifikasi kelas proyek (misal: `Class 1.0`, `Class 2.0`).
* `contract_value_excl_tax` (Numeric/Decimal): Total nilai proyek sebelum PPN yang menjadi acuan revenue (misal: `600000000`).
* `addendum_notes` (Text): Catatan perpanjangan waktu resmi agar *Comparator Engine* tidak salah mendeteksi keterlambatan ilegal.
* `nda_status` (Enum: `pending`, `done`, `not_required` default `pending`).
* `spk_status` (Enum: `pending`, `done` default `pending`).
* `internal_drive_url` (Text): Tautan Google Drive arsip internal tim.
* `external_drive_url` (Text): Tautan Google Drive penyerahan hasil kerja (*deliverables*) ke klien.

---

### B. Domain 2: Monitoring Revenue & Termin Penagihan (Milestone Invoicing)
**Kondisi Saat Ini:** Tidak ada struktur untuk mengaitkan penyelesaian tugas (*deliverable*) dengan jadwal atau termin penagihan ke klien.  
**Realitas Excel (Sheet: `Inv PHRC`, `Inv SAI`, `Rekap Invoice Bulanan`, `PHRCO PROJECT 2026`):** Revenue konsultansi dicairkan melalui **Termin 1 hingga Termin 5** berdasarkan **Syarat Penagihan** (misal: *"Setelah pelaksanaan Kick Off dibuktikan dengan BAST"*). Tim Finance juga membutuhkan proyeksi arus kas bulanan (*Monthly Revenue Forecast*).

#### ⚠️ ATURAN MUTLAK UPDATE TERMIN PENAGIHAN (STATE-BASED CONDITIONAL LOCKING)
Untuk menghindari kerusakan data akuntansi dan mematuhi jejak audit keuangan, update pada tabel `project_invoicing_terms` wajib mengikuti aturan penguncian bersyarat berikut:
1. **Status `unbilled` (Belum Ditagih):**
   - **BISA DI-UPDATE** oleh Project Manager dan PMO.
   - PM boleh mengubah `target_month` (pergeseran waktu tagih) dan `billing_condition` (syarat BAST).
   - Nilai uang (`term_percentage` dan `target_invoice_amount`) **hanya bisa diubah oleh role `pmo`**.
2. **Status `invoiced` (Sudah Ditagih) & `paid` (Sudah Dibayar):**
   - **TERKUNCI PERMANEN (READ-ONLY).**
   - Baris termin tidak boleh lagi diubah atau dihapus oleh siapapun (termasuk PMO) karena sudah menjadi data akuntansi legal. Perubahan nilai pasca-faktur wajib dilakukan lewat pembukaan Addendum atau Credit Note baru, bukan menimpa data lama.
3. **Audit Trail Requirement:**
   - Setiap perubahan pada termin yang berstatus `unbilled` wajib memanggil `auditService.ts` untuk merekam kronologi di `audit_logs` (siapa yang mengubah, nilai lama, nilai baru, dan alasannya).

**Defisit Skema (Wajib Buat Tabel Baru: `project_invoicing_terms`):**
* `id` (UUID Primary Key)
* `project_id` (UUID, Foreign Key ke `projects` ON DELETE CASCADE)
* `term_number` (Integer: `1`, `2`, `3`, `4`, `5`)
* `billing_condition` (Text: Syarat penagihan / milestone utama)
* `term_percentage` (Numeric: Persentase tagihan, misal `0.20` untuk 20%)
* `target_invoice_amount` (Numeric: Nilai tagihan termin, misal `120000000`)
* `target_month` (Date: Proyeksi bulan pencairan revenue)
* `bast_date` (Date, Nullable: Tanggal Berita Acara Serah Terima ditandatangani)
* `invoice_status` (Enum: `unbilled`, `invoiced`, `paid` default `unbilled`)
* `pic_finance` (Text: Penanggung jawab penagihan dari tim keuangan)

---

### C. Domain 3: Alokasi Beban Kerja Konsultan (Resource Loading Analysis)
**Kondisi Saat Ini:** Relasi tim hanya dicatat secara umum di tabel `project_team_members` (`project_id`, `user_id`).  
**Realitas Excel (Sheet: `Load - PM`, `Load - Cons`, `Load - TW`, `Alokasi TA`):** Tim proyek terbagi ke dalam spesialisasi fungsional yang ketat dan persentase keterlibatan (*workload share*). PMO wajib memantau apakah seorang Tenaga Ahli (SME) sedang *overload* di banyak proyek sekaligus.

**Defisit Skema (Wajib Buat Tabel Baru: `project_resource_allocations`):**
* `id` (UUID Primary Key)
* `project_id` (UUID, Foreign Key ke `projects`)
* `user_id` (UUID, Foreign Key ke `profiles`)
* `functional_role` (Enum: `project_manager`, `internal_consultant`, `external_consultant`, `technical_writer`, `knowledge_leader`)
* `workload_share` (Text/Enum: misal `Full Project Manager`, `Mandor PM`, `Junior Cons`, `SME Asesmen`)

---

### D. Domain 4: Granular Budgeting & Pos Pengeluaran
**Kondisi Saat Ini:** Hanya ada komparasi satu angka global `plannedCost` vs `actualCost` di *service layer*.  
**Realitas Excel (Sheet: `PROJECT BUDGET`):** Anggaran proyek dibagi ke dalam pos-pos pengeluaran rinci yang harus mendapat persetujuan sebelum dicairkan.

**Defisit Skema (Wajib Buat Tabel Baru: `project_budgets`):**
* `id` (UUID Primary Key), `project_id` (UUID)
* `category` (Enum: `Personnel`, `Software`, `Hardware`, `Operational`, `Vendor`)
* `item_name` (Text), `planned_amount` (Numeric), `actual_amount` (Numeric)
* `purchase_date` (Date, Nullable)
* `status` (Enum: `Planned`, `Approved`, `Disbursed`)

---

### E. Domain 5: RAID Log & Tindak Lanjut Rapat (Issues & Actions)
**Kondisi Saat Ini:** Hanya ada peringatan sistem otomatis di `governance_warnings` dan catatan singkat di `progress_updates`.  
**Realitas Excel (Sheet: `COMMUNICATION LOG`, `FEEDBACK & IMPROVEMENT`):** Proyek membutuhkan pencatatan kendala manual, asumsi, risiko, dan masukan klien (*RAID Log*) lengkap dengan penanggung jawab (*owner*) dan tenggat waktu penyelesaian.

**Defisit Skema (Wajib Buat Tabel Baru: `project_issues_and_actions`):**
* `id` (UUID Primary Key), `project_id` (UUID)
* `type` (Enum: `risk`, `issue`, `action_item`, `client_feedback`)
* `title` (Text), `description` (Text)
* `owner_id` (UUID, Foreign Key ke `profiles`)
* `due_date` (Date), `severity` (Enum: `low`, `medium`, `high`, `blocker`)
* `status` (Enum: `open`, `in_progress`, `closed`)

---

### F. Domain 6: Advanced Gantt & Task Dependencies
**Kondisi Saat Ini:** Tabel `tasks` hanya memiliki tanggal dan persentase progres, tanpa logika ketergantungan antar-tugas.  
**Realitas Excel (Sheet: `GANTT CHART`, `KANBAN BOARD`):** Tugas memiliki prioritas, bobot jam kerja, dan ketergantungan (*dependency*) agar diagram Gantt dapat merender alur kritis (*critical path*).

**Defisit Skema yang Wajib Ditambahkan ke Tabel `tasks`:**
* `priority` (Enum: `low`, `medium`, `high`, `urgent` default `medium`)
* `is_milestone` (Boolean default `false`)
* `predecessor_task_id` (UUID, Nullable, Foreign Key ke `tasks.id` ON DELETE SET NULL)
* `estimated_hours` (Integer default `0`)
* `actual_hours` (Integer default `0`)

---

## 3. INSTRUCTION FOR AI AGENTS (EXECUTION ROADMAP)
Ketika Anda (AI Agen) ditugaskan untuk melanjutkan pengembangan proyek ini, **JANGAN MENGUBAH ARSITEKTUR YANG SUDAH ADA**. Lakukan penyelesaian gap ini secara berurutan sesuai pedoman berikut:

1. **Tahap 1 (Database Migration):** Buat file SQL migrasi baru di root proyek (misal: `04_system_gap_enrichment.sql`) yang berisi perintah `ALTER TABLE` untuk tabel `projects` & `tasks`, serta perintah `CREATE TABLE` untuk 4 tabel baru di atas (`project_invoicing_terms`, `project_resource_allocations`, `project_budgets`, `project_issues_and_actions`).
2. **Tahap 2 (RLS & Security Enforcement):** Pastikan setiap tabel baru dipasangi kebijakan RLS yang ketat mematuhi aturan di `AGENTS.md` (Read terbuka untuk member proyek terautentikasi; Write/Delete untuk `project_budgets` dan `project_invoicing_terms` HANYA dibatasi untuk role `pmo` dan `project_manager`).
3. **Tahap 3 (TypeScript Sync):** Segera perbarui file `/types/index.ts` agar seluruh tipe data TypeScript sinkron dengan skema database yang baru. DILARANG KERAS menggunakan tipe `any`.
4. **Tahap 4 (Service Layer Expansion):** Buat layanan baru seperti `/services/revenueService.ts` dan `/services/resourceService.ts` untuk mengelola logika bisnis perhitungan arus kas dan kalkulasi beban kerja tim.
5. **Tahap 5 (UI Integration):** Perkaya halaman detail proyek di `/app/projects/[id]/page.tsx` dengan menambahkan tab navigasi (*Tab Switcher*) untuk merender modul Revenue, Resource Load, Budget, dan RAID Log secara rapi dan profesional.

---
*Gunakan dokumen ini sebagai peta pedoman teknis untuk menyempurnakan aplikasi menjadi sistem berskala Enterprise.*