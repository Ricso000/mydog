"use client";
import { useState } from "react";

interface ContactFormProps {
  dogId: string;
  partnerId?: string;
  dogName: string;
}

export function ContactForm({ dogId, dogName }: ContactFormProps) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email) {
      setError("Kérjük add meg a neved és email-ed.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dogId,
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: form.message,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Hiba történt. Kérjük, próbáld újra.");
      }
    } catch {
      setError("Hiba történt. Kérjük, próbáld újra.");
    }
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">🐾</div>
        <h2 className="text-xl font-bold text-[#1C1C1C] mb-2">Üzenet elküldve!</h2>
        <p className="text-[#4A5568]">
          A menhely hamarosan felveszi veled a kapcsolatot{" "}
          <span className="font-semibold">{dogName}</span> kapcsán.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7A3D] focus:border-transparent";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#1C1C1C] mb-1.5">Teljes név *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          className={inputClass}
          placeholder="Nagy Péter"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#1C1C1C] mb-1.5">Email cím *</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
          className={inputClass}
          placeholder="email@example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#1C1C1C] mb-1.5">Telefon</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className={inputClass}
          placeholder="+36 1 234 5678"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#1C1C1C] mb-1.5">Üzenet</label>
        <textarea
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          rows={4}
          className={inputClass}
          placeholder="Mesélj magadról, otthonodról, miért szeretnéd örökbefogadni..."
        />
      </div>
      {error && (
        <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white font-semibold py-4 rounded-2xl transition-colors disabled:opacity-60"
      >
        {loading ? "Küldés..." : "Kapcsolatfelvétel →"}
      </button>
    </form>
  );
}
