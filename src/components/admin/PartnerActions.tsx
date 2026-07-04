"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ACTIONS = [
  { status: "approved", label: "Jóváhagyás", color: "bg-green-600 hover:bg-green-700 text-white" },
  { status: "rejected", label: "Elutasítás", color: "bg-red-600 hover:bg-red-700 text-white" },
  { status: "suspended", label: "Felfüggesztés", color: "bg-orange-500 hover:bg-orange-600 text-white" },
  { status: "draft", label: "Visszaállítás (draft)", color: "border-2 border-[#E2E8F0] text-[#4A5568] hover:bg-[#F7F8F5]" },
];

export function PartnerActions({ partnerId, currentStatus }: { partnerId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function updateStatus(newStatus: string) {
    if (!confirm(`Biztosan megváltoztatod a státuszt: ${newStatus}?`)) return;
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.from("partners").update({ status: newStatus }).eq("id", partnerId);
    if (error) {
      setMessage("Hiba: " + error.message);
    } else {
      // Log the action
      await supabase.from("activity_logs").insert({
        action: `partner_status_changed_to_${newStatus}`,
        entity_type: "partner",
        entity_id: partnerId,
        metadata: { previous_status: currentStatus, new_status: newStatus },
      });
      setMessage("Státusz frissítve.");
      router.refresh();
    }
    setLoading(false);
  }

  async function toggleVerified(verified: boolean) {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("partners").update({ verified }).eq("id", partnerId);
    await supabase.from("activity_logs").insert({
      action: verified ? "partner_verified" : "partner_unverified",
      entity_type: "partner",
      entity_id: partnerId,
      metadata: {},
    });
    setMessage(verified ? "Partner megjelölve ellenőrzöttként." : "Ellenőrzés visszavonva.");
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sticky top-8">
      <h2 className="font-bold text-[#1C1C1C] mb-4">Műveletek</h2>
      <div className="space-y-2 mb-4">
        {ACTIONS.filter(a => a.status !== currentStatus).map(action => (
          <button key={action.status} onClick={() => updateStatus(action.status)} disabled={loading}
            className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 ${action.color}`}>
            {action.label}
          </button>
        ))}
      </div>
      <div className="border-t border-[#E2E8F0] pt-4 space-y-2">
        <button onClick={() => toggleVerified(true)} disabled={loading}
          className="w-full py-2 rounded-xl border border-green-300 text-green-700 text-sm font-medium hover:bg-green-50 disabled:opacity-60">
          ✓ Megjelölés ellenőrzöttként
        </button>
        <button onClick={() => toggleVerified(false)} disabled={loading}
          className="w-full py-2 rounded-xl border border-[#E2E8F0] text-[#4A5568] text-sm hover:bg-[#F7F8F5] disabled:opacity-60">
          Ellenőrzés visszavonása
        </button>
      </div>
      {message && <p className="text-sm text-[#3D7A3D] bg-green-50 px-3 py-2 rounded-xl mt-4">{message}</p>}
    </div>
  );
}
