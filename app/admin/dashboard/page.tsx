"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface RSVP {
  id: string;
  event_id: string;
  guest_name: string;
  contact: string | null;
  attending: boolean;
  guest_count: number;
  message: string | null;
  created_at: string;
}

interface EventMember {
  event_id: string;
  user_id: string;
  role: "developer" | "client" | string;
}

interface EventInfo {
  id: string;
  title: string;
  is_open: boolean;
  created_at?: string;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function shortDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

/* Small SVG ring like the reference (68% style) */
function Ring({ value, color, track = "#EDEDF2" }: { value: number; color: string; track?: string }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10 -rotate-90">
      <circle cx="20" cy="20" r={r} fill="none" stroke={track} strokeWidth="5" />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * c} ${c}`}
      />
    </svg>
  );
}

/* Tiny sparkline like reference analytics cards */
function Spark({ points, color }: { points: number[]; color: string }) {
  const w = 72;
  const h = 26;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const span = max - min || 1;
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i / (points.length - 1)) * w},${h - 3 - ((p - min) / span) * (h - 8)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-[72px]">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [loadingUser, setLoadingUser] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<"all" | "attending" | "not_attending">("all");
  const [selected, setSelected] = useState<RSVP | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "guests" | "analytics" | "profile">("home");

  const eventId = process.env.NEXT_PUBLIC_WEDDING_EVENT_ID;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  const fetchData = useCallback(async () => {
    if (!eventId) {
      setErrorMessage("Event ID is missing from environment configuration.");
      return;
    }
    setLoadingData(true);
    setErrorMessage(null);
    try {
      const { data: rsvpData, error: rsvpError } = await supabase
        .from("rsvps")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (rsvpError) throw rsvpError;
      setRsvps((rsvpData as RSVP[]) || []);

      const { data: eventData } = await supabase
        .from("events")
        .select("id, title, is_open, created_at")
        .eq("id", eventId)
        .maybeSingle();
      if (eventData) setEventInfo(eventData as EventInfo);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setErrorMessage(errObj?.message || "Failed to load RSVP records.");
    } finally {
      setLoadingData(false);
    }
  }, [eventId]);

  useEffect(() => {
    async function verifyAuth() {
      setLoadingUser(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          router.replace("/admin/login");
          return;
        }
        setUserEmail(session.user.email || null);
        if (!eventId) {
          setIsAuthorized(false);
          setErrorMessage("Event ID configuration is missing.");
          setLoadingUser(false);
          return;
        }
        const { data: memberData, error: memberError } = await supabase
          .from("event_members")
          .select("event_id, user_id, role")
          .eq("event_id", eventId)
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (memberError || !memberData) {
          setIsAuthorized(false);
          setLoadingUser(false);
          return;
        }
        setRole((memberData as EventMember).role);
        setIsAuthorized(true);
        setLoadingUser(false);
        await fetchData();
      } catch {
        setIsAuthorized(false);
        setLoadingUser(false);
      }
    }
    verifyAuth();
  }, [router, eventId, fetchData]);

  // Remember which card opened the sheet so focus can return to it on close
  const openerRef = useRef<string | null>(null);

  const openDetail = useCallback((rsvp: RSVP, openerId?: string) => {
    openerRef.current = openerId ?? rsvp.id;
    setSelected(rsvp);
  }, []);

  const closeDetail = useCallback(() => {
    setSelected(null);
  }, []);

  // Scroll lock that preserves the exact page position (prevents jump-to-top on close)
  // + close on Escape. Focus is returned to the originating card on cleanup.
  const sheetOpen = selected !== null;
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDetail();
    document.addEventListener("keydown", onKey);
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    return () => {
      document.removeEventListener("keydown", onKey);
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
      if (openerRef.current) {
        document
          .querySelector<HTMLElement>(`[data-guest-id="${openerRef.current}"]`)
          ?.focus({ preventScroll: true });
      }
    };
  }, [sheetOpen, closeDetail]);

  // Keep the bottom tab bar highlight in sync with the section actually on screen
  useEffect(() => {
    if (loadingUser || isAuthorized !== true) return;
    const ids = ["home", "analytics", "guests", "profile"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveTab(entry.target.id as typeof activeTab);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [loadingUser, isAuthorized]);

  const filteredRsvps = useMemo(() => {
    return rsvps.filter((item) => {
      if (statusFilter === "attending" && !item.attending) return false;
      if (statusFilter === "not_attending" && item.attending) return false;
      return true;
    });
  }, [rsvps, statusFilter]);

  const stats = useMemo(() => {
    const totalResponses = rsvps.length;
    const attendingCount = rsvps.filter((r) => r.attending).length;
    const notAttendingCount = rsvps.filter((r) => !r.attending).length;
    const confirmedAttendees = rsvps
      .filter((r) => r.attending)
      .reduce((sum, r) => sum + (Number(r.guest_count) || 0), 0);
    const attendanceRate = totalResponses > 0 ? Math.round((attendingCount / totalResponses) * 100) : 0;
    return { totalResponses, attendingCount, notAttendingCount, confirmedAttendees, attendanceRate };
  }, [rsvps]);

  /* ── Analytics derived data (reference screen 3) — all computed from fetched RSVPs ── */
  const weeklyBars = useMemo(() => {
    const days: { label: string; count: number; guests: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const dayRsvps = rsvps.filter((r) => {
        const t = new Date(r.created_at);
        return !Number.isNaN(t.getTime()) && t.toDateString() === key;
      });
      days.push({
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        count: dayRsvps.length,
        guests: dayRsvps
          .filter((r) => r.attending)
          .reduce((sum, r) => sum + (Number(r.guest_count) || 0), 0),
      });
    }
    return days;
  }, [rsvps]);

  const maxBar = Math.max(...weeklyBars.map((b) => b.count), 1);

  // Real daily series for the sparkline cards (was hardcoded placeholder data)
  const dailyResponses = useMemo(() => weeklyBars.map((b) => b.count), [weeklyBars]);
  const dailyGuests = useMemo(() => weeklyBars.map((b) => b.guests), [weeklyBars]);

  // Real catering figures derived from attending parties (no magic baseline)
  const catering = useMemo(() => {
    const parties = rsvps.filter((r) => r.attending);
    const total = parties.reduce((sum, r) => sum + (Number(r.guest_count) || 0), 0);
    const largest = parties.reduce<RSVP | null>(
      (best, r) => (!best || Number(r.guest_count) > Number(best.guest_count) ? r : best),
      null
    );
    const avg = parties.length > 0 ? total / parties.length : 0;
    return { total, avg, largest, parties: parties.length };
  }, [rsvps]);

  const topParties = useMemo(
    () => [...rsvps].filter((r) => r.attending).sort((a, b) => b.guest_count - a.guest_count).slice(0, 4),
    [rsvps]
  );

  const latestRsvp = rsvps[0] ?? null;

  const handleExport = useCallback(() => {
    if (filteredRsvps.length === 0) return;
    const header = ["Guest Name", "Attendance", "Guests", "Contact", "Message", "Submitted"];
    const rows = filteredRsvps.map((r) => [
      `"${(r.guest_name || "").replace(/"/g, '""')}"`,
      r.attending ? "Attending" : "Declined",
      r.attending ? String(r.guest_count) : "0",
      `"${(r.contact || "").replace(/"/g, '""')}"`,
      `"${(r.message || "").replace(/"/g, '""')}"`,
      formatDate(r.created_at),
    ]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rsvp-guests.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredRsvps]);

  const copyEventId = () => {
    if (!eventId) return;
    navigator.clipboard.writeText(eventId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const scrollTo = (id: string, tab: typeof activeTab) => {
    setActiveTab(tab);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F4F6] px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#6C4DFF]/20 border-t-[#6C4DFF]" />
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[#1E1E24]">
            Securing Connection...
          </p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F4F4F6] px-4 text-center">
        <div className="w-full max-w-md rounded-[24px] bg-white p-8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="mt-4 font-sans text-lg font-bold text-ink">Access Restricted</h2>
          <p className="mt-2 break-words font-sans text-[13px] text-ink/60">
            Your account ({userEmail}) is not authorized for this event.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={handleSignOut}
              className="rounded-full bg-ink px-6 py-3 font-sans text-xs font-semibold uppercase tracking-widest text-white"
            >
              Sign Out &amp; Switch Account
            </button>
            <Link href="/invitation" className="font-sans text-xs text-[#6C4DFF] hover:underline">
              Back to Wedding Invitation
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hostName = userEmail ? userEmail.split("@")[0].replace(/[._-]+/g, " ") : "Host";
  const displayName = (hostName.split(" ")[0] || "Host").replace(/^./, (c) => c.toUpperCase());

  return (
    <div className="admin-shell min-h-screen bg-[#F4F4F6] font-sans text-[#1E1E24] antialiased">
      {/* ═══ App frame: centered phone-like column on desktop, full width on mobile ═══ */}
      <div className="mx-auto max-w-7xl px-3 pb-28 pt-4 sm:px-6 md:pb-16 lg:px-8">
        {/* ── Top greeting header (reference screen 1) ── */}
        <header id="home" className="scroll-mt-24">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-sans text-[13px] text-black/50">{greeting()},</p>
              <h1 className="truncate font-sans text-[22px] font-bold leading-tight text-black">
                {displayName}
              </h1>
            </div>
            <div className="flex items-center gap-2.5">
              {/* Standard refresh icon */}
              <button
                onClick={fetchData}
                title="Refresh data"
                aria-label="Refresh data"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black/70 shadow-[0_6px_20px_-8px_rgba(0,0,0,0.2)] transition hover:text-black active:scale-95"
              >
                <svg className={`h-5 w-5 ${loadingData ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
              {/* Standard download / export icon */}
              <button
                onClick={handleExport}
                disabled={filteredRsvps.length === 0}
                title="Export CSV"
                aria-label="Export CSV"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6C4DFF] text-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.4)] transition hover:bg-[#5A52E0] active:scale-95 disabled:opacity-40"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </button>
              {/* Standard user / profile icon */}
              <button
                onClick={() => scrollTo("profile", "profile")}
                title={userEmail ?? "Profile"}
                aria-label="Go to profile"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6C4DFF] text-white shadow-[0_6px_20px_-8px_rgba(0,0,0,0.4)] ring-2 ring-white transition active:scale-95"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </button>
            </div>
          </div>

        </header>

        {role === "developer" && (
          <button
            onClick={copyEventId}
            className="mt-3 flex w-full items-center justify-between gap-2 truncate rounded-2xl bg-[#6C4DFF] px-4 py-3 text-left font-mono text-[11px] text-white/80"
            title="Tap to copy event ID"
          >
            <span className="truncate">DEV · {eventId}</span>
            <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-wider">
              {copiedId ? "Copied" : "Copy"}
            </span>
          </button>
        )}

        {errorMessage && (
          <div role="alert" className="mt-4 rounded-2xl bg-red-50 p-4 font-sans text-[13px] font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        {/* ── Today's Focus card (reference: UI/UX Portfolio Design 75%) ── */}
        <section aria-label="Today's focus" className="mt-4 rounded-[24px] bg-white p-5 shadow-[0_10px_30px_-14px_rgba(0,0,0,0.18)]">
          <p className="font-sans text-[12px] text-black/45">Today&apos;s Focus</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <h2 className="truncate font-sans text-[17px] font-bold text-black">
              {eventInfo?.title || "Dilanka & Piyumi Wedding"}
            </h2>
            <span className="shrink-0 rounded-full bg-[#EFE9FF] px-2.5 py-1 font-sans text-[11px] font-bold text-[#6C4DFF]">
              {stats.attendanceRate}%
            </span>
          </div>
          <div className="mt-3 h-[7px] overflow-hidden rounded-full bg-black/[0.07]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.attendanceRate}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-[#6C4DFF] to-[#9D8CFF]"
            />
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 font-sans text-[12px] text-black/45">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {eventInfo?.is_open ? "RSVP submissions active" : "Submissions closed"} · {stats.attendingCount} of {stats.totalResponses} accepted
          </div>
        </section>

        {/* ── Stat tiles 2×2 (reference screen 1 tiles) ── */}
        <section aria-label="Overview" className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {/* Total */}
          <div className="rounded-[24px] bg-white p-4 shadow-[0_10px_30px_-16px_rgba(0,0,0,0.2)]">
            <p className="font-sans text-[11px] font-medium text-black/45">Total</p>
            <div className="flex items-end justify-between gap-2">
              <p data-tnum className="font-sans text-[26px] font-bold leading-none text-black">{stats.totalResponses}</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6C4DFF] text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            </div>
            <p className="mt-1 font-sans text-[11px] text-black/40">Responses</p>
          </div>
          {/* Attending */}
          <div className="rounded-[24px] bg-white p-4 shadow-[0_10px_30px_-16px_rgba(0,0,0,0.2)]">
            <p className="font-sans text-[11px] font-medium text-black/45">Attending</p>
            <div className="flex items-end justify-between gap-2">
              <p data-tnum className="font-sans text-[26px] font-bold leading-none text-black">{stats.attendingCount}</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFE9FF] text-[#6C4DFF]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
            </div>
            <p className="mt-1 font-sans text-[11px] text-black/40">{stats.attendanceRate}% accept rate</p>
          </div>
          {/* Declined */}
          <div className="rounded-[24px] bg-white p-4 shadow-[0_10px_30px_-16px_rgba(0,0,0,0.2)]">
            <p className="font-sans text-[11px] font-medium text-black/45">Declined</p>
            <div className="flex items-end justify-between gap-2">
              <p data-tnum className="font-sans text-[26px] font-bold leading-none text-black">{stats.notAttendingCount}</p>
              <Ring value={stats.totalResponses ? (stats.notAttendingCount / stats.totalResponses) * 100 : 0} color="#FF7A59" />
            </div>
            <p className="mt-1 font-sans text-[11px] text-black/40">Regrets received</p>
          </div>
          {/* Headcount */}
          <div className="rounded-[24px] bg-white p-4 shadow-[0_10px_30px_-16px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between">
              <p className="font-sans text-[11px] font-medium text-black/45">Headcount</p>
              <Spark points={weeklyBars.map((b) => b.count)} color="#22C55E" />
            </div>
            <div className="flex items-end justify-between gap-2">
              <p data-tnum className="font-sans text-[26px] font-bold leading-none text-black">{stats.confirmedAttendees}</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#22C55E] text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            </div>
            <div className="mt-2 flex items-end gap-[3px]">
              {weeklyBars.map((b, i) => (
                <span key={i} className="w-full rounded-full bg-[#22C55E]/20" style={{ height: 4 }}>
                  <span className="block rounded-full bg-[#22C55E]" style={{ height: 4, opacity: 0.35 + (b.count / maxBar) * 0.65 }} />
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Analytics (reference screen 3) ── */}
        <section id="analytics" aria-label="Analytics" className="mt-4 scroll-mt-24 space-y-3">
          {/* Top mini row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[24px] bg-white p-4 shadow-[0_10px_30px_-16px_rgba(0,0,0,0.2)]">
              <p className="font-sans text-[10px] text-black/45">Guests</p>
              <p data-tnum className="font-sans text-[17px] font-bold text-black">{stats.confirmedAttendees}</p>
              <Spark points={dailyGuests} color="#6C4DFF" />
            </div>
            <div className="rounded-[24px] bg-white p-4 shadow-[0_10px_30px_-16px_rgba(0,0,0,0.2)]">
              <p className="font-sans text-[10px] text-black/45">Parties Done</p>
              <p data-tnum className="font-sans text-[17px] font-bold text-black">{stats.totalResponses}</p>
              <Spark points={dailyResponses} color="#22C55E" />
            </div>
            <div className="rounded-[24px] bg-white p-4 shadow-[0_10px_30px_-16px_rgba(0,0,0,0.2)]">
              <p className="font-sans text-[10px] text-black/45">Accept Rate</p>
              <p data-tnum className="font-sans text-[17px] font-bold text-black">{stats.attendanceRate}%</p>
              <div className="relative h-7 w-7">
                <Ring value={stats.attendanceRate} color="#F5A623" />
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-5">
            {/* Bar chart */}
            <div className="rounded-[24px] bg-white p-5 shadow-[0_10px_30px_-16px_rgba(0,0,0,0.2)] lg:col-span-3">
              <div className="flex items-center justify-between">
                <p className="font-sans text-[13px] font-bold text-black">RSVP Overview</p>
                <span className="rounded-full bg-black/[0.05] px-2.5 py-1 font-sans text-[10px] font-semibold text-black/50">
                  Last 7 days
                </span>
              </div>
              <div className="mt-4 flex h-36 items-end justify-between gap-2">
                {weeklyBars.map((b, i) => {
                  const hPct = Math.max(8, (b.count / maxBar) * 100);
                  const isPeak = b.count === maxBar && b.count > 0;
                  return (
                    <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                      <span className="font-sans text-[10px] font-bold text-black/40">{b.count > 0 ? b.count : ""}</span>
                      <div
                        className={`w-full max-w-[34px] rounded-[8px] ${isPeak ? "bg-[#6C4DFF]" : "bg-[#6C4DFF]/25"}`}
                        style={{ height: `${hPct}%` }}
                        title={`${b.label}: ${b.count}`}
                      />
                      <span className="font-sans text-[10px] text-black/40">{b.label.slice(0, 2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Donut + top parties */}
            <div className="space-y-3 lg:col-span-2">
              <div className="flex items-center gap-4 rounded-[24px] bg-white p-5 shadow-[0_10px_30px_-16px_rgba(0,0,0,0.2)]">
                <div className="relative h-[92px] w-[92px] shrink-0">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#F1F1F4" strokeWidth="14" />
                    {stats.totalResponses > 0 && (
                      <>
                        <circle
                          cx="50" cy="50" r="40" fill="none" stroke="#6C4DFF" strokeWidth="14" strokeLinecap="round"
                          strokeDasharray={`${(stats.attendanceRate / 100) * 251.2} 251.2`}
                        />
                        <circle
                          cx="50" cy="50" r="40" fill="none" stroke="#FF7A59" strokeWidth="14"
                          strokeDasharray={`${((100 - stats.attendanceRate) / 100) * 251.2} 251.2`}
                          strokeDashoffset={`${-((stats.attendanceRate / 100) * 251.2)}`}
                          opacity={0.9}
                        />
                      </>
                    )}
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-sans text-[15px] font-bold text-black">
                    {stats.attendanceRate}%
                  </span>
                </div>
                <div className="min-w-0 space-y-1.5 font-sans text-[12px]">
                  <p className="font-bold text-black">Guest Status</p>
                  <p className="flex items-center gap-1.5 text-black/60"><span className="h-2 w-2 rounded-full bg-[#6C4DFF]" /> Attending {stats.attendingCount}</p>
                  <p className="flex items-center gap-1.5 text-black/60"><span className="h-2 w-2 rounded-full bg-[#FF7A59]" /> Declined {stats.notAttendingCount}</p>
                </div>
              </div>

              <div className="rounded-[24px] bg-white p-5 shadow-[0_10px_30px_-16px_rgba(0,0,0,0.2)]">
                <p className="font-sans text-[13px] font-bold text-black">Largest Parties</p>
                <div className="mt-3 space-y-2.5">
                  {topParties.length === 0 && (
                    <p className="font-sans text-[12px] italic text-black/40">No attending parties yet.</p>
                  )}
                  {topParties.map((p, i) => {
                    const dots = ["#6C4DFF", "#22C55E", "#F5A623", "#FF7A59"];
                    return (
                      <div key={p.id} className="flex items-center justify-between gap-2 font-sans text-[12px]">
                        <span className="flex min-w-0 items-center gap-2 text-black/70">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: dots[i % dots.length] }} />
                          <span className="truncate font-medium text-black">{p.guest_name}</span>
                        </span>
                        <span className="shrink-0 font-bold text-black/60">{p.guest_count} guests</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Catering figures — 100% derived from fetched attending parties */}
          <div className="flex items-center justify-between gap-3 rounded-[24px] bg-white p-5 shadow-[0_10px_30px_-16px_rgba(0,0,0,0.2)]">
            <div className="min-w-0">
              <p className="font-sans text-[12px] text-black/45">Catering · {catering.parties} {catering.parties === 1 ? "party" : "parties"}</p>
              <p className="font-sans text-[17px] font-bold text-black">
                {catering.total}{" "}
                <span className="text-[12px] font-medium text-black/40">
                  guests · avg {catering.parties > 0 ? catering.avg.toFixed(1) : "0.0"}/party
                </span>
              </p>
              {catering.largest && (
                <p className="mt-0.5 truncate font-sans text-[11px] text-black/45">
                  Largest: {catering.largest.guest_name} ({catering.largest.guest_count})
                </p>
              )}
            </div>
            <span className="shrink-0 rounded-full bg-[#EFE9FF] px-3 py-1.5 font-sans text-[12px] font-bold text-[#6C4DFF]">
              {stats.attendanceRate}% accept
            </span>
          </div>
        </section>

        {/* ── Latest RSVP banner (reference: Upcoming meeting card) ── */}
        {latestRsvp && (
          <button
            data-guest-id={`latest-${latestRsvp.id}`}
            onClick={() => openDetail(latestRsvp, `latest-${latestRsvp.id}`)}
            className="mt-4 flex w-full items-center gap-3 rounded-[24px] bg-[#6C4DFF] p-4 text-left shadow-[0_14px_30px_-14px_rgba(0,0,0,0.5)] transition active:scale-[0.99]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 font-sans text-[13px] font-bold text-white">
              {getInitials(latestRsvp.guest_name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-sans text-[11px] text-white/50">Latest RSVP</span>
              <span className="block truncate font-sans text-[14px] font-bold text-white">
                {latestRsvp.guest_name} · {latestRsvp.attending ? `${latestRsvp.guest_count} guests` : "Declined"}
              </span>
              <span className="block font-sans text-[11px] text-white/50">{shortDate(latestRsvp.created_at)} · Tap to view</span>
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">›</span>
          </button>
        )}

        {/* ── My Guests (reference screen 2: My Tasks) ── */}
        <section id="guests" aria-label="Guest list" className="mt-6 scroll-mt-24">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-[19px] font-bold text-black">My Guests</h2>
            <span className="font-sans text-[12px] text-black/45">
              <b className="text-black">{filteredRsvps.length}</b> of {rsvps.length}
            </span>
          </div>

          {/* Pills like All / To Do / In Progress / Completed — fixed 3-col grid, no cutoff */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(
              [
                { key: "all", label: "All", count: rsvps.length },
                { key: "attending", label: "Attending", count: stats.attendingCount },
                { key: "not_attending", label: "Declined", count: stats.notAttendingCount },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setStatusFilter(t.key)}
                className={`min-w-0 truncate rounded-full px-2 py-2.5 text-center font-sans text-[12px] font-semibold transition active:scale-95 ${
                  statusFilter === t.key ? "bg-[#6C4DFF] text-white" : "bg-white text-black/55 shadow-sm"
                }`}
              >
                {t.label} · {t.count}
              </button>
            ))}
          </div>
          {/* Export — own full-width row so it never gets cut off */}
          <button
            onClick={handleExport}
            disabled={filteredRsvps.length === 0}
            className="mt-2.5 flex h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[#6C4DFF] font-sans text-[12px] font-bold uppercase tracking-wider text-white shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)] transition active:scale-[0.99] disabled:opacity-40"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV ({filteredRsvps.length})
          </button>

          {loadingData ? (
            <div className="mt-3 space-y-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse rounded-[20px] bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-black/5" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 rounded bg-black/5" />
                      <div className="h-2.5 w-1/2 rounded bg-black/5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRsvps.length === 0 ? (
            <div className="mt-3 rounded-[24px] bg-white px-6 py-12 text-center shadow-sm">
              <p className="font-sans text-[15px] font-bold text-black">No guests found</p>
              <p className="mt-1 font-sans text-[12px] text-black/50">
                {statusFilter !== "all" ? "Try a different filter." : "New RSVPs will appear here in real time."}
              </p>
              {(statusFilter !== "all") && (
                <button
                  onClick={() => { setStatusFilter("all"); }}
                  className="mt-4 rounded-full bg-[#6C4DFF] px-5 py-2.5 font-sans text-[12px] font-semibold text-white"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Group labels like To Do 5 / In Progress 3 / Completed 8 */}
              <div className="mt-4 hidden gap-6 md:grid md:grid-cols-3">
                {(["attending", "not_attending"] as const).map(() => null)}
              </div>
              <div className="mt-3 space-y-2.5 md:hidden">
                {filteredRsvps.map((rsvp, idx) => (
                  <motion.button
                    key={rsvp.id}
                    data-guest-id={rsvp.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                    onClick={() => openDetail(rsvp)}
                    className="w-full rounded-[20px] bg-white p-4 text-left shadow-[0_8px_24px_-14px_rgba(0,0,0,0.25)] transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C4DFF]"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${rsvp.attending ? "bg-[#22C55E]" : "bg-[#FF7A59]"}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-sans text-[14px] font-bold text-black">{rsvp.guest_name}</span>
                        <span className="mt-0.5 block font-sans text-[11px] text-black/45">
                          {rsvp.attending ? `Attending · ${rsvp.guest_count} ${rsvp.guest_count === 1 ? "guest" : "guests"}` : "Declined"} · {shortDate(rsvp.created_at)}
                        </span>
                      </span>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 font-sans text-[10px] font-bold ${rsvp.attending ? "bg-[#E7F8EE] text-[#16A34A]" : "bg-[#FFEDE7] text-[#E4572E]"}`}>
                        {rsvp.attending ? "To Do" : "Done"}
                      </span>
                    </div>
                    {rsvp.message && (
                      <span className="mt-2 line-clamp-1 block font-sans text-[12px] italic text-black/50">“{rsvp.message}”</span>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Desktop table kept, styled to match */}
              <div className="mt-4 hidden overflow-hidden rounded-[24px] bg-white shadow-[0_10px_30px_-16px_rgba(0,0,0,0.2)] md:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-[13px]">
                    <thead className="border-b border-black/5 text-[11px] uppercase tracking-wider text-black/45">
                      <tr>
                        <th className="px-5 py-4">Guest</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4 text-center">Party</th>
                        <th className="px-5 py-4">Contact</th>
                        <th className="px-5 py-4">Wishes</th>
                        <th className="px-5 py-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {filteredRsvps.map((rsvp) => (
                        <tr
                          key={rsvp.id}
                          data-guest-id={rsvp.id}
                          tabIndex={-1}
                          onClick={() => openDetail(rsvp)}
                          className="cursor-pointer transition hover:bg-[#5A52E0]/[0.02]">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EFE9FF] text-[12px] font-bold text-[#6C4DFF]">
                                {getInitials(rsvp.guest_name)}
                              </span>
                              <span className="font-bold text-black">{rsvp.guest_name}</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${rsvp.attending ? "bg-[#E7F8EE] text-[#16A34A]" : "bg-[#FFEDE7] text-[#E4572E]"}`}>
                              {rsvp.attending ? "Attending" : "Declined"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center font-bold">{rsvp.attending ? rsvp.guest_count : "—"}</td>
                          <td className="max-w-[160px] truncate px-5 py-3.5 font-mono text-[12px] text-black/60">{rsvp.contact || "—"}</td>
                          <td className="max-w-[200px] truncate px-5 py-3.5 italic text-black/55">{rsvp.message ? `“${rsvp.message}”` : "—"}</td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-[12px] text-black/45">{formatDate(rsvp.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>

        {/* ── Profile / account card ── */}
        <section id="profile" aria-label="Account" className="mt-4 scroll-mt-24 rounded-[24px] bg-white p-5 shadow-[0_10px_30px_-16px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EFE9FF] font-sans text-[15px] font-bold text-[#6C4DFF]">
              {getInitials(displayName || "H")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-[14px] font-bold text-black">{userEmail}</p>
              <p className="font-sans text-[12px] text-black/45">{role === "developer" ? "Developer" : "Host"} · Dilanka &amp; Piyumi</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <Link href="/invitation" className="flex h-[48px] items-center justify-center rounded-full bg-black/[0.05] font-sans text-[12px] font-bold text-black transition active:scale-95">
              Invitation
            </Link>
            <button onClick={handleSignOut} className="flex h-[48px] items-center justify-center rounded-full bg-[#6C4DFF] font-sans text-[12px] font-bold text-white transition active:scale-95">
              Sign Out
            </button>
          </div>
        </section>
      </div>

      {/* ── Bottom tab bar (reference phones) — mobile only ── */}
      <nav aria-label="Admin navigation" className="fixed inset-x-3 bottom-3 z-40 rounded-[24px] border border-black/5 bg-white/95 px-2 py-2 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.3)] backdrop-blur-md md:hidden">
        <div className="grid grid-cols-4 gap-1">
          {(
            [
              { key: "home", label: "Home", target: "home", icon: "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" },
              { key: "guests", label: "Guests", target: "guests", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
              { key: "analytics", label: "Stats", target: "analytics", icon: "M3 3v18h18M8 17V9m4 8V5m4 12v-6" },
              { key: "profile", label: "Profile", target: "profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => scrollTo(t.target, t.key)}
              className={`flex flex-col items-center gap-1 rounded-2xl py-2 font-sans text-[10px] font-semibold transition ${
                activeTab === t.key ? "text-[#6C4DFF]" : "text-black/40"
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeTab === t.key ? 2.4 : 1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
              </svg>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Guest detail sheet ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={() => closeDetail()}
          >
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-[#F4F4F6] shadow-2xl sm:max-w-lg sm:rounded-[28px] pb-[env(safe-area-inset-bottom)] sm:pb-0"
            >
              <div className={`p-5 sm:p-6 ${selected.attending ? "bg-[#E7F8EE]" : "bg-[#FFEDE7]"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#6C4DFF] font-sans text-[15px] font-bold text-white">
                      {getInitials(selected.guest_name)}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate font-sans text-[16px] font-bold text-black">{selected.guest_name}</h2>
                      <span className={`mt-1 inline-flex rounded-full px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-wider text-white ${selected.attending ? "bg-[#16A34A]" : "bg-[#E4572E]"}`}>
                        {selected.attending ? "Attending" : "Declined"}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => closeDetail()} aria-label="Close" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black/60">
                    ✕
                  </button>
                </div>
              </div>
              <div className="space-y-3 p-5 sm:p-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[20px] bg-white p-4">
                    <p className="font-sans text-[11px] text-black/45">Party Size</p>
                    <p className="mt-1 font-sans text-[24px] font-bold text-black">{selected.attending ? selected.guest_count : 0}</p>
                  </div>
                  <div className="rounded-[20px] bg-white p-4">
                    <p className="font-sans text-[11px] text-black/45">Submitted</p>
                    <p className="mt-1 font-sans text-[13px] font-bold text-black">{shortDate(selected.created_at)}</p>
                    <p className="font-sans text-[11px] text-black/45">{formatDate(selected.created_at)}</p>
                  </div>
                </div>
                <div className="rounded-[20px] bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-sans text-[11px] text-black/45">Contact</p>
                    {selected.contact && (
                      <span className="flex gap-2">
                        <a href={`tel:${selected.contact}`} className="rounded-full bg-black/[0.05] px-3 py-1.5 font-sans text-[11px] font-bold text-black">Call</a>
                        <a href={`https://wa.me/${selected.contact.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#E7F8EE] px-3 py-1.5 font-sans text-[11px] font-bold text-[#16A34A]">WhatsApp</a>
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 font-sans text-[14px] font-semibold text-black">{selected.contact || <span className="font-normal italic text-black/35">No contact provided.</span>}</p>
                </div>
                <div className="rounded-[20px] bg-white p-4">
                  <p className="font-sans text-[11px] text-black/45">Wishes</p>
                  <p className="mt-1.5 font-sans text-[13px] italic leading-relaxed text-black/75">{selected.message ? `“${selected.message}”` : "No note included."}</p>
                </div>
                <button onClick={() => closeDetail()} className="h-[52px] w-full rounded-full bg-[#6C4DFF] font-sans text-[13px] font-bold text-white active:scale-[0.99]">
                  Close Details
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
