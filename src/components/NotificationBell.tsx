"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface NotificationRow {
  id: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadUnreadCount() {
      const supabase = createClient();
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false);
      setUnreadCount(count ?? 0);
    }
    loadUnreadCount();
  }, [userId]);

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) {
      const supabase = createClient();
      const { data } = await supabase
        .from("notifications")
        .select("id, title, body, read, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      setNotifications(data ?? []);
      setLoaded(true);

      const unreadIds = (data ?? []).filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length > 0) {
        await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
        setUnreadCount(0);
        setNotifications((list) => list.map((n) => ({ ...n, read: true })));
      }
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        aria-label="Értesítések"
        className="relative p-1.5 text-[#374151] hover:text-[#1A3D2B] hover:bg-[#F0FDF4] rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-[#E2E8F0] shadow-lg py-2 z-50 max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[#4A5568]">Nincs még értesítésed.</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="px-4 py-2.5 border-b border-[#F0FDF4] last:border-0">
                <p className="text-sm font-semibold text-[#1C1C1C]">{n.title}</p>
                {n.body && <p className="text-xs text-[#4A5568] mt-0.5">{n.body}</p>}
              </div>
            ))
          )}
          <Link
            href="/jelentkezeseim"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-xs text-[#1A3D2B] font-semibold hover:bg-[#F0FDF4] mt-1"
          >
            Összes jelentkezésem →
          </Link>
        </div>
      )}
    </div>
  );
}
