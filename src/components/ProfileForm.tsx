"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ProfileFormProps {
  userId: string;
  email: string;
  initialFullName: string;
}

export default function ProfileForm({ userId, email, initialFullName }: ProfileFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (updateError) {
      setError("Nem sikerült menteni: " + updateError.message);
    } else {
      setMessage("Mentve.");
    }
    setSaving(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const inputClass =
    "w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] focus:border-transparent";
  const labelClass = "block text-sm font-medium text-[#1C1C1C] mb-1.5";

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-8">
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className={labelClass}>Email cím</label>
          <input type="email" value={email} disabled className={`${inputClass} bg-[#F7F8F5] text-[#4A5568]`} />
        </div>
        <div>
          <label className={labelClass}>Teljes név</label>
          <input
            type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
            className={inputClass} placeholder="Nagy Éva"
          />
        </div>
        {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
        {message && <p className="text-green-700 text-sm bg-green-50 px-4 py-3 rounded-xl">{message}</p>}
        <button
          type="submit" disabled={saving}
          className="w-full bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
        >
          {saving ? "Mentés..." : "Mentés"}
        </button>
      </form>
      <button
        onClick={handleSignOut}
        className="w-full mt-4 border-2 border-red-200 text-red-600 hover:bg-red-50 font-semibold py-3 rounded-xl transition-colors"
      >
        Kijelentkezés
      </button>
    </div>
  );
}
