# Logic & Business Rules Guide

## Tujuan
Panduan ini mendefinisikan logika teknis untuk Comparator Engine (4.1.2 - 4.1.4) dan pemicu Warning (4.1.5). Semua logika ditempatkan di folder `/services/governance/` agar modular, clean, dan mudah diuji.

## Struktur folder yang direkomendasikan

```
/services/governance/
  comparator.ts
  thresholds.ts
  warnings.ts
  governanceService.ts
```

## Fungsi Comparator Engine

Comparator Engine harus menilai nilai perbandingan antara planned vs actual untuk:
- 4.1.2 Schedule variance
- 4.1.3 Cost / budget variance
- 4.1.4 Progress achievement

### `comparator.ts`

Fungsi inti:
- `compareSchedule`
- `compareCost`
- `compareProgress`
- `normalizeComparison`

Contoh implementasi:

```ts
export type ComparisonStatus = 'green' | 'yellow' | 'red';

export type ComparisonResult = {
  metric: 'schedule' | 'cost' | 'progress';
  planned: number;
  actual: number;
  variance: number;
  variancePct: number;
  status: ComparisonStatus;
};

const getStatus = (variancePct: number): ComparisonStatus => {
  if (variancePct >= 20) return 'red';
  if (variancePct >= 10) return 'yellow';
  return 'green';
};

export function compareSchedule(plannedEnd: string | null, actualEnd: string | null): ComparisonResult {
  const planned = plannedEnd ? new Date(plannedEnd).getTime() : 0;
  const actual = actualEnd ? new Date(actualEnd).getTime() : 0;
  const variance = actual - planned;
  const varianceDays = planned === 0 ? 0 : Math.round(variance / (1000 * 60 * 60 * 24));
  const variancePct = planned === 0 ? 0 : (varianceDays / (planned / (1000 * 60 * 60 * 24))) * 100;

  return {
    metric: 'schedule',
    planned,
    actual,
    variance: varianceDays,
    variancePct: Math.abs(variancePct),
    status: getStatus(Math.abs(variancePct)),
  };
}

export function compareCost(plannedCost: number, actualCost: number): ComparisonResult {
  const variance = actualCost - plannedCost;
  const variancePct = plannedCost === 0 ? 0 : (variance / plannedCost) * 100;
  return {
    metric: 'cost',
    planned: plannedCost,
    actual: actualCost,
    variance,
    variancePct: Math.abs(variancePct),
    status: getStatus(Math.abs(variancePct)),
  };
}

export function compareProgress(plannedProgress: number, actualProgress: number): ComparisonResult {
  const variance = actualProgress - plannedProgress;
  const variancePct = plannedProgress === 0 ? 0 : (variance / plannedProgress) * 100;
  return {
    metric: 'progress',
    planned: plannedProgress,
    actual: actualProgress,
    variance,
    variancePct: Math.abs(variancePct),
    status: getStatus(Math.abs(variancePct)),
  };
}
```

## Threshold & Warning Rule

### `thresholds.ts`

Tetapkan batas yang konsisten:
- `green`: < 10%
- `yellow`: 10% - 20%
- `red`: > 20%

```ts
export const thresholds = {
  green: 10,
  yellow: 20,
};
```

### `warnings.ts`

Fungsi pemicu warning dari hasil comparator:

```ts
import { ComparisonResult } from './comparator';

export type WarningLevel = 'info' | 'warning' | 'critical';

export type WarningPayload = {
  projectId: string;
  taskId?: string;
  code: string;
  message: string;
  level: WarningLevel;
};

export function getWarningForComparison(result: ComparisonResult, projectId: string, taskId?: string): WarningPayload | null {
  if (result.status === 'red') {
    return {
      projectId,
      taskId,
      code: `GOV-${result.metric.toUpperCase()}-CRITICAL`,
      message: `${result.metric} melebihi threshold kritis sebesar ${result.variancePct.toFixed(1)}%.`,
      level: 'critical',
    };
  }

  if (result.status === 'yellow') {
    return {
      projectId,
      taskId,
      code: `GOV-${result.metric.toUpperCase()}-WARNING`,
      message: `${result.metric} hampir melewati batas toleransi (${result.variancePct.toFixed(1)}%).`,
      level: 'warning',
    };
  }

  return null;
}
```

## Data Flow & Penempatan Logika

### `governanceService.ts`

Gunakan service ini sebagai entry point untuk mengeksekusi comparator dan membuat warnings:

```ts
import { compareCost, compareProgress, compareSchedule } from './comparator';
import { getWarningForComparison } from './warnings';

export function assessTaskGovernance(task: TaskSummary) {
  const schedule = compareSchedule(task.planned_end, task.actual_end);
  const cost = compareCost(task.planned_cost, task.actual_cost);
  const progress = compareProgress(task.planned_progress, task.actual_progress);

  const warnings = [schedule, cost, progress]
    .map((result) => getWarningForComparison(result, task.project_id, task.id))
    .filter(Boolean);

  return { schedule, cost, progress, warnings };
}
```

### Penempatan folder
- `/services/governance/comparator.ts`: semua logika perbandingan.
- `/services/governance/thresholds.ts`: aturan status/ambang.
- `/services/governance/warnings.ts`: pembuatan warning payload.
- `/services/governance/governanceService.ts`: komposisi hasil dan integrasi dengan service lain.

## Prinsip Clean Architecture

- Bagi hasil perhitungan dan aturan threshold agar mudah diuji.
- Jangan letakkan kalkulasi di komponen React.
- Gunakan `services/governance` murni sebagai business logic.
- Komponen UI hanya menerima hasil `ComparisonResult` dan `WarningPayload`.

## Pemetaan ke fitur PDF

- 4.1.2 → `compareSchedule`
- 4.1.3 → `compareCost`
- 4.1.4 → `compareProgress`
- 4.1.5 → `getWarningForComparison`

## Output untuk UI

Fungsi service ini harus menyediakan:
- status warna (`green`, `yellow`, `red`)
- persentase varians
- pesan warning yang dapat ditampilkan di UI
- daftar warnings ditambah flag `critical`
