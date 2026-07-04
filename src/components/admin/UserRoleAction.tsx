"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function UserRoleAction({ userId, currentRole }: { userId: string; currentRole: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setRole(role: string) {
    if (!confirm(`Szerepkör változtatása: ${role}?`)) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ role }).eq("id", userId);
    router.refresh();
    setLoading(false);
  }

  if (currentRole === "admin") {
    return (
      <button onClick={() => setRole("user")} disabled={loading}
        className="text-xs text-red-600 hover:underline disabled:opacity-60">
        Admin visszavon
      </button>
    );
  }

  return (
    <button onClick={() => setRole("admin")} disabled={loading}
      className="text-xs text-purple-700 hover:underline disabled:opacity-60">
      Admin kinevez
    </button>
  );
}
