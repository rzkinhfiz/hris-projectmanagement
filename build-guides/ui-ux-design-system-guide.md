# UI/UX Design System Guide

## Tujuan
Panduan ini menjelaskan bagaimana membangun antarmuka aplikasi PMO dengan Tailwind CSS dan struktur komponen di folder `/components`. Fokus pada visual dashboard, role-based UI, dan memastikan area Monitoring hanya menampilkan data tanpa input/edit.

## Prinsip Visual Dasar

Berdasarkan referensi dashboard, gunakan:
- palet warna hangat dengan aksen oranye / coklat lembut
- latar belakang netral / krem untuk area utama
- panel kartu dengan `shadow` ringan dan `rounded-3xl`
- kartu KPI yang ringkas dan informatif
- tipografi clean dengan header tegas dan body teks halus
- layout grid responsive untuk card dan tabel

## Struktur Komponen di `/components`

### Struktur direktorinya
```
/components
  Layout.tsx
  Sidebar.tsx
  Topbar.tsx
  KpiCard.tsx
  ProgressGauge.tsx
  ProjectTable.tsx
  WarningPanel.tsx
  RoleGuard.tsx
  GovernancePanel.tsx
  MonitoringSummary.tsx
```

### Komponen inti
- `Layout.tsx`: wrapper dashboard, grid utama, sidebar + topbar.
- `Sidebar.tsx`: navigasi vertikal, menu dashboard, projects, governance.
- `Topbar.tsx`: search, user profile, breadcrumb.
- `KpiCard.tsx`: statistik ringkas (budget, progress, risk, health).
- `ProgressGauge.tsx`: chart status progress / health.
- `ProjectTable.tsx`: ringkasan proyek dan status.
- `WarningPanel.tsx`: daftar warning governance.
- `GovernancePanel.tsx`: area monitoring data yang read-only.
- `RoleGuard.tsx`: kontrol visibilitas elemen berdasarkan role.

## Tailwind pattern

Gunakan kelas berikut untuk menjaga konsistensi:
- container layout: `min-h-screen bg-slate-50 text-slate-900`
- panel: `rounded-[2rem] bg-white shadow-xl ring-1 ring-slate-200`
- card grid: `grid gap-5 xl:grid-cols-4 md:grid-cols-2`
- section header: `flex items-center justify-between gap-4`
- badge: `rounded-full px-3 py-1 text-xs font-semibold`

Contoh komponen card:

```tsx
export function KpiCard({ title, value, subtitle }: KpiCardProps) {
  return (
    <div className="rounded-[1.75rem] bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="mt-4 text-3xl font-semibold text-slate-900">{value}</h3>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}
```

## Role-based UI

### `RoleGuard` helper
Gunakan komponen `RoleGuard` untuk menentukan kapan sebuah elemen ditampilkan:

```tsx
'use client';

type RoleGuardProps = {
  currentRole: 'project_team' | 'project_manager' | 'pmo';
  allowed: Array<'project_team' | 'project_manager' | 'pmo'>;
  children: React.ReactNode;
};

export function RoleGuard({ currentRole, allowed, children }: RoleGuardProps) {
  return allowed.includes(currentRole) ? <>{children}</> : null;
}
```

### Case: tombol `Submit Progress`

```tsx
<RoleGuard currentRole={user.role} allowed={['project_team']}>
  <button className="btn-primary">Submit Progress</button>
</RoleGuard>
```

### Case: area monitoring read-only

```tsx
<div className="space-y-4 rounded-[2rem] bg-slate-950/5 p-6">
  <div className="flex items-center justify-between">
    <h2 className="text-lg font-semibold">Monitoring</h2>
    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-700">Read-only</span>
  </div>
  <MonitoringSummary data={monitoringData} />
</div>
```

## Monitoring area tanpa input/edit

Area monitoring harus murni visual:
- tabel ringkasan status proyek
- card KPI health
- gauge / progress bar
- daftar warning
- tidak ada `input`, `select`, `textarea`, `button` edit di area ini.

Untuk komponen monitoring:
- `GovernancePanel.tsx`: menampilkan indikator governance.
- `MonitoringSummary.tsx`: menampilkan hasil comparator dan status.
- `WarningPanel.tsx`: menampilkan warning log.

Pastikan `GovernancePanel` hanya render data read-only:
- `text` dan `badge` saja
- `progress` atau `meter` visual
- jika ada action, tampilkan hanya untuk role `pmo`

## Peta UI React Components

### Halaman Dashboard utama
- `Layout` → sidebar + topbar + content
- `KpiCard` → ringkasan nilai utama
- `ProgressGauge` → health gauge
- `ProjectTable` → list proyek
- `WarningPanel` → peringatan governance

### Halaman Monitoring / Governance
- `GovernancePanel` → status indikator governance
- `MonitoringSummary` → KPI monitoring snapshot
- `WarningPanel` → daftar warning
- `RoleGuard` → tampilkan button resolve hanya untuk `pmo`

## Prinsip pengembangan UI

- Pisahkan UI presentasi dan data fetch.
- Gunakan Tailwind utility untuk visual consistent.
- Fokus pada spacing `gap-5`, `p-6`, `rounded-3xl`.
- Hindari editing controls di area Monitoring.
- Terapkan responsive layout agar dashboard dapat tampil baik di desktop dan tablet.
- **Form UI & Placeholder**: Saat membuat input form di fitur apapun, pastikan placeholder selalu terlihat jelas dengan kontras yang baik.
  - Gunakan `placeholder:text-slate-400` atau `placeholder:text-slate-500` pada text/number/textarea input.
  - Untuk elemen `<select>`, implementasikan dynamic class untuk membedakan gaya teks saat masih berupa placeholder vs nilai terpilih. Contoh:
    ```tsx
    <select 
      value={value} 
      onChange={...} 
      className={`... focus:border-amber-500 focus:ring-1 focus:ring-amber-500 ${!value ? 'text-slate-500 font-medium' : 'text-slate-900 font-semibold'}`}
    >
      <option value="">-- Pilih Nilai --</option>
    </select>
    ```
