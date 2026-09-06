"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DogStatusAction({ dogId, currentStatus }: { dogId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function setStatus(status: string) {
    setLoading(true);
    setError("");
    const supabase = createClient();
    // .select() is required here, not just for the returned row: without it Supabase
    // returns no data on update, so a row silently excluded by RLS (0 rows affected,
    // e.g. the caller lost admin access) looks identical to a real success — `error`
    // stays null either way. Checking `data` lets us tell those two cases apart.
    const { data: updatedRows, error: updateError } = await supabase
      .from("dogs")
      .update({ status })
      .eq("id", dogId)
      .select("id");
    if (updateError) {
      setError("Nem sikerült a státusz módosítása: " + updateError.message);
      setLoading(false);
      return;
    }
    if (!updatedRows || updatedRows.length === 0) {
      setError("A módosítás nem történt meg (nincs jogosultságod ehhez a kutyához).");
      setLoading(false);
      return;
    }
    await supabase.from("activity_logs").insert({
      action: `dog_status_changed_to_${status}`,
      entity_type: "dog",
      entity_id: dogId,
      metadata: { previous_status: currentStatus, new_status: status },
    });
    router.refresh();
    setLoading(false);
  }

  if (currentStatus === "inactive") {
    return (
      <div>
        <button onClick={() => setStatus("available")} disabled={loading}
          className="text-xs text-green-700 hover:underline disabled:opacity-60">
          Elérhetővé tesz
        </button>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => setStatus("inactive")} disabled={loading}
        className="text-xs text-red-600 hover:underline disabled:opacity-60">
        Elrejt
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
