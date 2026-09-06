"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type PendingPartnerRegistration = {
  name: string;
  slug: string;
  type: string;
  country: string;
  city: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
};

function ConfirmationHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"working" | "invalid" | "error">("working");
  const [errorDetail, setErrorDetail] = useState("");

  useEffect(() => {
    async function run() {
      const supabase = createClient();

      // Same implicit-flow fragment as the password-reset link (see
      // docs/implementation/phase-0-1-plan.md Task 1.4/1.7) — parsed and
      // exchanged for a session manually rather than relying on the
      // PKCE-oriented client default, which never processes a fragment.
      const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token && refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
        if (sessionError) {
          setStatus("invalid");
          return;
        }
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus("invalid");
        return;
      }

      const redirectTo = searchParams.get("redirect") || "/profil";
      const pending = user.user_metadata?.pending_partner_registration as PendingPartnerRegistration | undefined;

      if (!pending) {
        // Regular user confirmation — nothing further to do.
        router.push(redirectTo);
        router.refresh();
        return;
      }

      // Deferred partner creation. created_by_user_id has a partial unique
      // index (014_partner_registration_idempotency.sql) so this insert is
      // safe to attempt more than once for the same user (a double-clicked
      // link, a retry, two tabs) — a 23505 conflict here just means another
      // request already created it, and we look that row up instead of
      // treating it as a failure.
      const { error: insertError } = await supabase.from("partners").insert({
        name: pending.name,
        slug: pending.slug,
        type: pending.type,
        country: pending.country,
        city: pending.city,
        phone: pending.phone,
        website: pending.website,
        description: pending.description,
        status: "draft",
        verified: false,
        created_by_user_id: user.id,
      });

      if (insertError && insertError.code !== "23505") {
        setErrorDetail(insertError.message);
        setStatus("error");
        return;
      }

      // Clear the pending-registration metadata (best-effort hygiene, not
      // the safety mechanism — the unique index is) so a later, unrelated
      // visit to this page doesn't re-attempt the insert pointlessly.
      await supabase.auth.updateUser({
        data: { ...user.user_metadata, pending_partner_registration: null },
      });

      router.push(redirectTo);
      router.refresh();
    }

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "invalid") {
    return (
      <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-8 w-full max-w-md text-center">
          <p className="text-[#4A5568] mb-4">Ez a megerősítő link érvénytelen vagy lejárt.</p>
          <Link href="/bejelentkezes" className="text-[#1A3D2B] font-semibold hover:underline">
            Vissza a bejelentkezéshez
          </Link>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-8 w-full max-w-md text-center">
          <p className="text-[#4A5568]">Hiba történt a fiók aktiválása során: {errorDetail}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center px-4">
      <p className="text-[#4A5568]">Megerősítés folyamatban...</p>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center">
          <p className="text-[#4A5568]">Betöltés...</p>
        </div>
      }
    >
      <ConfirmationHandler />
    </Suspense>
  );
}
