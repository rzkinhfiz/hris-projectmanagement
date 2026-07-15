'use client';

import { ReactNode } from "react";

type Role = "project_team" | "project_manager" | "pmo" | "administrator" | null;

type RoleGuardProps = {
  currentRole: Role | string;
  allowed: string[];
  children: ReactNode;
};

export function RoleGuard({ currentRole, allowed, children }: RoleGuardProps) {
  let isAllowed = currentRole ? allowed.includes(currentRole as string) : false;
  
  // Administrator auto-inherits PMO access unless restricted
  if (currentRole === "administrator" && allowed.includes("pmo")) {
    isAllowed = true;
  }

  return isAllowed ? <>{children}</> : null;
}
