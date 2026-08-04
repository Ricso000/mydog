"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface FavoriteButtonProps {
  dogId: string;
  isLoggedIn: boolean;
  initialFavorited: boolean;
  variant: "icon" | "full";
}

export default function FavoriteButton({ dogId, isLoggedIn, initialFavorited, variant }: FavoriteButtonProps) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!isLoggedIn) {
      router.push(`/bejelentkezes?redirect=/kutyak/${dogId}`);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/bejelentkezes?redirect=/kutyak/${dogId}`);
      setLoading(false);
      return;
    }

    const next = !favorited;
    setFavorited(next); // optimistic

    const result = next
      ? await supabase.from("favorite_dogs").insert({ profile_id: user.id, dog_id: dogId })
      : await supabase.from("favorite_dogs").delete().eq("profile_id", user.id).eq("dog_id", dogId);

    if (result.error) {
      setFavorited(!next); // revert on failure
    }
    setLoading(false);
    router.refresh(); // keeps other FavoriteButton instances on the page (and /kedvencek) in sync
  }

  if (variant === "full") {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        className={`w-full border-2 font-semibold py-3.5 rounded-2xl transition-colors disabled:opacity-60 ${
          favorited
            ? "border-red-300 bg-red-50 text-red-600"
            : "border-[#1A3D2B] text-[#1A3D2B] hover:bg-[#E8F5E9]"
        }`}
      >
        {favorited ? "Kedvenceim között ♥" : "Kedvencekhez adom ♡"}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label="Kedvencekhez"
      className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
        favorited
          ? "border-red-300 text-red-500 bg-red-50"
          : "border-[#E2E8F0] bg-white text-[#4A5568] hover:text-red-500 hover:border-red-300"
      }`}
    >
      <svg className="w-5 h-5" fill={favorited ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
