export type ComparisonStatus = "green" | "yellow" | "red";

export type ComparisonResult = {
  metric: "schedule" | "cost" | "progress";
  planned: number;
  actual: number;
  variance: number;
  variancePct: number;
  status: ComparisonStatus;
};

const getStatus = (variancePct: number): ComparisonStatus => {
  if (variancePct >= 20) return "red";
  if (variancePct >= 10) return "yellow";
  return "green";
};

export function compareSchedule(plannedEnd: string | null, actualEnd: string | null): ComparisonResult {
  if (!plannedEnd || !actualEnd) {
    return {
      metric: "schedule",
      planned: 0,
      actual: 0,
      variance: 0,
      variancePct: 0,
      status: "green",
    };
  }

  const plannedDate = new Date(plannedEnd).getTime();
  const actualDate = new Date(actualEnd).getTime();

  if (!Number.isFinite(plannedDate) || !Number.isFinite(actualDate)) {
    return {
      metric: "schedule",
      planned: 0,
      actual: 0,
      variance: 0,
      variancePct: 0,
      status: "green",
    };
  }

  const varianceMs = Math.max(0, actualDate - plannedDate);
  const varianceDays = Math.round(varianceMs / (1000 * 60 * 60 * 24));
  const variancePct = varianceDays === 0 ? 0 : Math.min(100, varianceDays * 10);

  return {
    metric: "schedule",
    planned: plannedDate,
    actual: actualDate,
    variance: varianceDays,
    variancePct,
    status: getStatus(variancePct),
  };
}

export function compareCost(plannedCost: number, actualCost: number): ComparisonResult {
  const variance = actualCost - plannedCost;
  const variancePct = plannedCost === 0 ? 0 : Math.abs((variance / plannedCost) * 100);

  return {
    metric: "cost",
    planned: plannedCost,
    actual: actualCost,
    variance,
    variancePct,
    status: getStatus(variancePct),
  };
}

export function compareProgress(plannedProgress: number, actualProgress: number): ComparisonResult {
  const variance = actualProgress - plannedProgress;
  const variancePct = plannedProgress === 0 ? 0 : Math.abs((variance / plannedProgress) * 100);

  return {
    metric: "progress",
    planned: plannedProgress,
    actual: actualProgress,
    variance,
    variancePct,
    status: getStatus(variancePct),
  };
}
