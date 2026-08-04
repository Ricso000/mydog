"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface FollowPartnerButtonProps {
  partnerId: string;
  isLoggedIn: boolean;
  initialFollowing: boolean;
  redirectPath: string;
}

export default function FollowPartnerButton({
  partnerId,
  isLoggedIn,
  initialFollowing,
  redirectPath,
}: FollowPartnerButtonProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!isLoggedIn) {
      router.push(`/bejelentkezes?redirect=${redirectPath}`);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/bejelentkezes?redirect=${redirectPath}`);
      setLoading(false);
      return;
    }

    const next = !following;
    setFollowing(next); // optimistic

    const result = next
      ? await supabase.from("favorite_partners").insert({ profile_id: user.id, partner_id: partnerId })
      : await supabase.from("favorite_partners").delete().eq("profile_id", user.id).eq("partner_id", partnerId);

    if (result.error) {
      setFollowing(!next); // revert on failure
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-60 ${
        following
          ? "bg-[#E8F5E9] text-[#1A3D2B] border border-[#1A3D2B]"
          : "bg-[#1B4D2F] hover:bg-[#1A3D2B] text-white"
      }`}
    >
      {following ? "Követve ✓" : "Menhely követése"}
    </button>
  );
}
