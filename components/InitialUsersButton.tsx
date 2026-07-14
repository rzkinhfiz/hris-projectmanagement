"use client";

import { useState } from "react";
import { createClient } from "../utils/supabase/client";

const initialUsers = [
  { email: "sylphin13+pmo@gmail.com", password: "123456", role: "pmo" as const },
  { email: "sylphin13+pm@gmail.com", password: "123456", role: "project_manager" as const },
  { email: "sylphin13+team@gmail.com", password: "123456", role: "project_team" as const },
];

export function InitialUsersButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSeedUsers = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: initialUsers }),
      });

      const payload = await res.json();

      if (!res.ok) {
        setMessage(payload.error ?? 'Seed request failed');
      } else {
        const okCount = (payload.results as Array<{ success?: boolean }> ?? []).filter(r => r.success).length;
        setMessage(`Seed completed: ${okCount}/${initialUsers.length} created or updated.`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown seed error';
      setMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      <p className="font-semibold">Development helper</p>
      <p className="mt-1">
        Seed the first three test users for PMO, Project Manager, and Project Team roles.
      </p>
      <button
        type="button"
        onClick={handleSeedUsers}
        disabled={loading}
        className="mt-3 rounded-full bg-amber-600 px-4 py-2 font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Creating users..." : "Setup Initial Users"}
      </button>
      {message ? <p className="mt-3 text-sm">{message}</p> : null}
    </div>
  );
}
