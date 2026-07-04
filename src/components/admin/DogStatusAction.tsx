"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DogStatusAction({ dogId, currentStatus }: { dogId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setStatus(status: string) {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("dogs").update({ status }).eq("id", dogId);
    await supabase.from("activity_logs").insert({
      action: `dog_status_changed_to_${status}`,
      entity_type: "dog",
      entity_id: dogId,
      metadata: { previous_status: currentStatus, new_status: status },
    });
    router.refresh();
    setLoading(false);
  }

  if (currentStatus === "not_available") {
    return (
      <button onClick={() => setStatus("available")} disabled={loading}
        className="text-xs text-green-700 hover:underline disabled:opacity-60">
        Elérhetővé tesz
      </button>
    );
  }

  return (
    <button onClick={() => setStatus("not_available")} disabled={loading}
      className="text-xs text-red-600 hover:underline disabled:opacity-60">
      Elrejt
    </button>
  );
}
