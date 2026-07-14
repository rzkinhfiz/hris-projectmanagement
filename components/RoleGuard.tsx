'use client';

import { ReactNode } from "react";

type Role = "project_team" | "project_manager" | "pmo";

type RoleGuardProps = {
  currentRole: Role | string;
  allowed: Role[];
  children: ReactNode;
};

export function RoleGuard({ currentRole, allowed, children }: RoleGuardProps) {
  return allowed.includes(currentRole as Role) ? <>{children}</> : null;
}
