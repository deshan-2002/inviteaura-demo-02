"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "attending" | "not_attending">("all");
  const [selected, setSelected] = useState<RSVP | null>(null);
  const [copiedId, setCopiedId] = useState(false);

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

  // Lock body scroll when detail sheet is open + close on Escape
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selected]);

  const filteredRsvps = useMemo(() => {
    return rsvps.filter((item) => {
      if (statusFilter === "attending" && !item.attending) return false;
      if (statusFilter === "not_attending" && item.attending) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          item.guest_name.toLowerCase().includes(term) ||
          item.contact?.toLowerCase().includes(term) ||
          item.message?.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [rsvps, statusFilter, searchTerm]);

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

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5] px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-maroon border-t-gold" />
          <p className="font-sans text-admin-small font-semibold uppercase tracking-[0.2em] text-maroon">
            Securing Connection...
          </p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF8F5] px-4 text-center">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 min-[400px]:p-8 shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="mt-4 font-display text-admin-modal font-bold uppercase tracking-wider text-maroon">
            Access Restricted
          </h2>
          <p className="mt-2 break-words font-sans text-admin-small text-ink/70">
            Your account ({userEmail}) is not authorized to access this event.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={handleSignOut}
              className="rounded-full bg-gradient-to-r from-maroon via-maroon-deep to-maroon px-6 py-3 font-sans text-admin-small font-semibold uppercase tracking-widest text-ivory shadow-md transition-all hover:shadow-lg"
            >
              Sign Out &amp; Switch Account
            </button>
            <Link href="/invitation" className="font-sans text-admin-small text-gold hover:underline">
              Back to Wedding Invitation
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell min-h-screen bg-[#FAF8F5] font-sans text-ink antialiased">
      {/* ── Top Executive Navbar ── */}
      <header className="sticky top-0 z-30 border-b border-gold/20 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-3 py-2.5 min-[400px]:px-4 sm:px-6 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {/* Left: Brand Identity */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-maroon to-maroon-deep text-ivory font-display text-admin-small font-bold shadow-xs">
                P&amp;D
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-sans text-admin-small font-bold uppercase tracking-wider text-maroon whitespace-nowrap">
                    RSVP Admin
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 admin-badge font-sans ${
                      role === "developer"
                        ? "border border-purple-200 bg-purple-50 text-purple-700"
                        : "border border-gold/30 bg-champagne/40 text-maroon"
                    }`}
                  >
                    {role === "developer" ? "Dev" : "Host"}
                  </span>
                </div>
                <p className="hidden min-[420px]:block font-sans text-admin-micro text-ink/55 leading-tight truncate max-w-[200px] sm:max-w-none">
                  {userEmail} &middot; Dilanka &amp; Piyumi
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/invitation"
                aria-label="View invitation"
                title="View invitation"
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-gold/30 bg-ivory/50 px-2.5 py-2 font-sans text-admin-small font-semibold uppercase tracking-wider text-maroon shadow-2xs transition-all hover:border-gold hover:bg-white hover:shadow-xs active:scale-95 min-[420px]:px-3 sm:py-1.5"
              >
                <svg className="h-3.5 w-3.5 shrink-0 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden min-[420px]:inline">Invitation</span>
              </Link>

              <button
                onClick={handleSignOut}
                aria-label="Sign out"
                title="Sign out"
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-maroon/25 bg-white px-2.5 py-2 font-sans text-admin-small font-semibold uppercase tracking-wider text-maroon shadow-2xs transition-all hover:bg-maroon hover:text-white hover:shadow-xs active:scale-95 min-[420px]:px-3 sm:py-1.5"
              >
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden min-[420px]:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 min-[400px]:px-4 pb-16 pt-5 sm:px-6 sm:pt-7">
        {/* ── Page Header + Primary Actions ── */}
        <div className="flex flex-col justify-between gap-3.5 sm:flex-row sm:items-end">
          <div>
            <p className="admin-eyebrow font-sans text-gold">
              Guest Registry &amp; Logistics
            </p>
            <h1 className="mt-1 font-sans text-admin-title font-bold uppercase tracking-wide text-maroon sm:text-admin-title-lg">
              RSVP Management
            </h1>
            <p className="mt-0.5 font-sans text-admin-small text-ink/65 sm:text-admin-body">
              Real-time overview of guest attendance, parties, and well wishes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2.5 w-full sm:w-auto">
            <button
              onClick={fetchData}
              disabled={loadingData}
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-gold/30 bg-white px-3.5 py-2 font-sans text-admin-small font-semibold uppercase tracking-wider text-maroon shadow-xs transition-all hover:border-gold hover:shadow-sm active:scale-[0.98] disabled:opacity-60"
            >
              <svg
                className={`h-3.5 w-3.5 ${loadingData ? "animate-spin text-gold" : "text-maroon"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{loadingData ? "Updating..." : "Refresh"}</span>
            </button>

            <button
              onClick={handleExport}
              disabled={filteredRsvps.length === 0}
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-maroon via-maroon-deep to-maroon px-4 py-2 font-sans text-admin-small font-semibold uppercase tracking-wider text-ivory shadow-sm transition-all hover:shadow-md hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
            >
              <svg className="h-3.5 w-3.5 text-gold-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* ── Status Ribbon for Developer Mode ── */}
        {role === "developer" && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex flex-col gap-2 overflow-hidden rounded-xl border border-purple-200/80 bg-purple-50/50 p-3 font-sans text-admin-small text-purple-900 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="rounded bg-purple-200/70 px-2 py-0.5 font-sans admin-badge font-bold text-purple-800">
                Dev Config
              </span>
              <code className="max-w-full truncate rounded bg-white/80 px-2 py-0.5 font-mono text-admin-small text-purple-800 border border-purple-200">
                {eventId}
              </code>
              <button
                onClick={copyEventId}
                className="font-sans text-admin-micro font-semibold text-purple-700 underline hover:text-purple-900"
              >
                {copiedId ? "Copied!" : "Copy ID"}
              </button>
            </div>
            <div className="flex items-center gap-2 font-sans text-admin-small font-semibold uppercase tracking-wider">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-700">
                {eventInfo?.is_open ? "RSVP Submissions Active" : "Submissions Closed"}
              </span>
            </div>
          </motion.div>
        )}

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50/80 p-3.5 font-sans text-admin-small font-medium text-red-800 shadow-xs">
            {errorMessage}
          </div>
        )}

        {/* ── KPI Metric Cards ── */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 min-[400px]:gap-3 sm:gap-4 lg:grid-cols-4">
          {/* 1. Total Responses */}
          <div className="group relative overflow-hidden rounded-2xl border border-gold/25 bg-white p-3.5 min-[400px]:p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(74,14,24,0.04)] transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <span className="admin-card-label font-sans min-w-0 leading-tight text-gold">
                Total Submissions
              </span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-champagne/40 text-maroon">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <p className="mt-2.5 font-sans text-admin-kpi font-extrabold tracking-tight text-maroon">
              {stats.totalResponses}
            </p>
            <p className="mt-0.5 font-sans text-admin-micro leading-tight text-ink/50">
              Unique RSVP forms submitted
            </p>
          </div>

          {/* 2. Attending */}
          <div className="group relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-white p-3.5 min-[400px]:p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.04)] transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <span className="admin-card-label font-sans min-w-0 leading-tight text-emerald-700">
                Attending
              </span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <p className="font-sans text-admin-kpi font-extrabold tracking-tight text-emerald-800">
                {stats.attendingCount}
              </p>
              {stats.totalResponses > 0 && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-sans admin-badge font-bold text-emerald-800">
                  {stats.attendanceRate}%
                </span>
              )}
            </div>
            <p className="mt-0.5 font-sans text-admin-micro leading-tight text-emerald-700/75">
              Parties accepted invitations
            </p>
          </div>

          {/* 3. Declined */}
          <div className="group relative overflow-hidden rounded-2xl border border-rose-200/80 bg-white p-3.5 min-[400px]:p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.04)] transition-all hover:-translate-y-0.5 hover:border-rose-400 hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <span className="admin-card-label font-sans min-w-0 leading-tight text-rose-700">
                Declined
              </span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <p className="mt-2.5 font-sans text-admin-kpi font-extrabold tracking-tight text-rose-800">
              {stats.notAttendingCount}
            </p>
            <p className="mt-0.5 font-sans text-admin-micro leading-tight text-rose-700/75">
              Unable to attend celebration
            </p>
          </div>

          {/* 4. Confirmed Headcount - Matching Cohesive Luxury Card */}
          <div className="group relative overflow-hidden rounded-2xl border border-maroon/25 bg-white p-3.5 min-[400px]:p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(74,14,24,0.04)] transition-all hover:-translate-y-0.5 hover:border-maroon/50 hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <span className="admin-card-label font-sans min-w-0 leading-tight text-maroon">
                Total Headcount
              </span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-champagne/40 text-maroon">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="mt-2.5 font-sans text-admin-kpi font-extrabold tracking-tight text-maroon">
              {stats.confirmedAttendees}
            </p>
            <p className="mt-0.5 font-sans text-admin-micro leading-tight text-ink/50">
              Confirmed guests for catering
            </p>
          </div>
        </div>

        {/* ── Search & Filter Controls ── */}
        <div className="mt-5 rounded-2xl border border-gold/25 bg-white p-3.5 sm:p-4 shadow-xs">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            {/* Status Segmented Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-ivory/40 rounded-xl sm:flex sm:flex-wrap sm:gap-1.5">
              <button
                onClick={() => setStatusFilter("all")}
                className={`rounded-lg px-1 py-2 font-sans text-admin-small font-semibold uppercase tracking-wider text-center whitespace-nowrap transition-all min-h-[40px] min-[400px]:px-3 sm:py-1.5 ${
                  statusFilter === "all"
                    ? "bg-maroon text-ivory shadow-xs"
                    : "text-maroon/80 hover:bg-white hover:text-maroon"
                }`}
              >
                All ({rsvps.length})
              </button>
              <button
                onClick={() => setStatusFilter("attending")}
                className={`rounded-lg px-1 py-2 font-sans text-admin-small font-semibold uppercase tracking-wider text-center whitespace-nowrap transition-all min-h-[40px] min-[400px]:px-3 sm:py-1.5 ${
                  statusFilter === "attending"
                    ? "bg-emerald-800 text-white shadow-xs"
                    : "text-emerald-800 hover:bg-white hover:text-emerald-900"
                }`}
              >
                Attending ({stats.attendingCount})
              </button>
              <button
                onClick={() => setStatusFilter("not_attending")}
                className={`rounded-lg px-1 py-2 font-sans text-admin-small font-semibold uppercase tracking-wider text-center whitespace-nowrap transition-all min-h-[40px] min-[400px]:px-3 sm:py-1.5 ${
                  statusFilter === "not_attending"
                    ? "bg-rose-800 text-white shadow-xs"
                    : "text-rose-800 hover:bg-white hover:text-rose-900"
                }`}
              >
                Declined ({stats.notAttendingCount})
              </button>
            </div>

            {/* Quick summary pill */}
            <p className="font-sans text-admin-micro text-ink/55 text-right sm:text-left">
              Showing <span className="font-bold text-maroon">{filteredRsvps.length}</span> of {rsvps.length} responses
            </p>
          </div>

          {/* Search Field */}
          <div className="relative mt-2.5">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10 18a8 8 0 110-16 8 8 0 010 16z" />
            </svg>
            <input
              type="search"
              placeholder="Search by guest name, phone, message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gold/25 bg-ivory/20 py-2.5 pl-10 pr-9 font-sans text-base text-ink placeholder-ink/40 transition-colors focus:border-maroon focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon sm:text-admin-body"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-admin-small text-ink/40 hover:bg-ivory hover:text-ink"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* ── Guest Records Table / Cards ── */}
        {loadingData ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-gold/20 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-ivory/70" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/4 rounded bg-ivory/70" />
                    <div className="h-2.5 w-1/2 rounded bg-ivory/70" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredRsvps.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-gold/40 bg-white px-4 py-10 text-center min-[400px]:px-6 sm:py-14">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-champagne/40 text-maroon">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="mt-3 font-display text-admin-modal font-bold text-maroon">No RSVP Records Found</p>
            <p className="mt-1 font-sans text-admin-small italic text-ink/60">
              {searchTerm || statusFilter !== "all"
                ? "No guests match your current search or filter criteria."
                : "Submitted RSVPs from the invitation form will appear here in real time."}
            </p>
            {(searchTerm || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="mt-3 rounded-full border border-maroon/30 px-5 py-2 font-sans text-admin-small font-semibold uppercase tracking-wider text-maroon transition-all hover:bg-maroon hover:text-white"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile View: Clean cards (< md) */}
            <div className="mt-4 space-y-3 md:hidden">
              {filteredRsvps.map((rsvp, idx) => (
                <motion.div
                  key={rsvp.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                  onClick={() => setSelected(rsvp)}
                  className="cursor-pointer rounded-2xl border border-gold/25 bg-white p-3 min-[400px]:p-3.5 shadow-xs transition-all active:scale-[0.99] hover:border-gold/50"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-sans text-admin-small font-bold shadow-xs ${
                        rsvp.attending
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                    >
                      {getInitials(rsvp.guest_name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-sans text-admin-body font-bold text-ink">
                          {rsvp.guest_name}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(rsvp);
                          }}
                          className="inline-flex min-h-[32px] shrink-0 items-center gap-1 rounded-full border border-gold/40 bg-ivory/60 px-2.5 py-1 admin-badge font-sans text-maroon shadow-2xs transition-all hover:bg-maroon hover:text-white active:scale-95"
                        >
                          <svg className="h-3 w-3 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>View</span>
                        </button>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {rsvp.attending ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 admin-badge font-sans text-emerald-800 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Attending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 admin-badge font-sans text-rose-800 border border-rose-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-600" /> Declined
                          </span>
                        )}

                        {rsvp.attending && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-champagne/40 px-2 py-0.5 admin-badge font-sans text-maroon border border-gold/25">
                            <svg className="h-3 w-3 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {rsvp.guest_count} {rsvp.guest_count === 1 ? "Guest" : "Guests"}
                          </span>
                        )}
                      </div>

                      {rsvp.message && (
                        <p className="mt-2 line-clamp-2 font-sans text-admin-small italic leading-relaxed text-ink/70">
                          &ldquo;{rsvp.message}&rdquo;
                        </p>
                      )}

                      <p className="mt-1.5 font-sans text-admin-micro text-ink/45">
                        {formatDate(rsvp.created_at)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Desktop View: Executive Table (md+) */}
            <div className="mt-5 hidden overflow-hidden rounded-2xl border border-gold/25 bg-white shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-admin-body">
                  <thead className="admin-table-head border-b border-gold/20 bg-[#FAF8F5] font-sans text-maroon">
                    <tr>
                      <th className="px-5 py-3.5">Guest</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-center">Party Size</th>
                      <th className="px-5 py-3.5">Contact</th>
                      <th className="px-5 py-3.5">Wishes</th>
                      <th className="px-5 py-3.5">Submitted</th>
                      <th className="px-5 py-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold/15">
                    {filteredRsvps.map((rsvp) => (
                      <tr
                        key={rsvp.id}
                        onClick={() => setSelected(rsvp)}
                        className="group cursor-pointer transition-colors hover:bg-ivory/40"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-admin-small font-bold shadow-2xs ${
                                rsvp.attending
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : "bg-rose-50 text-rose-800 border border-rose-200"
                              }`}
                            >
                              {getInitials(rsvp.guest_name)}
                            </span>
                            <span className="font-semibold text-ink group-hover:text-maroon transition-colors text-admin-body">
                              {rsvp.guest_name}
                            </span>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-3.5">
                          {rsvp.attending ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 admin-badge font-sans text-emerald-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                              Attending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 admin-badge font-sans text-rose-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                              Declined
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-3.5 text-center">
                          {rsvp.attending ? (
                            <span className="inline-flex items-center justify-center rounded-md bg-champagne/40 px-2.5 py-0.5 text-admin-small font-bold text-maroon border border-gold/25">
                              {rsvp.guest_count}
                            </span>
                          ) : (
                            <span className="text-ink/35 font-medium">—</span>
                          )}
                        </td>

                        <td className="max-w-[170px] truncate px-5 py-3.5 text-ink/75 font-mono text-admin-small">
                          {rsvp.contact || <span className="italic text-ink/35 font-sans">—</span>}
                        </td>

                        <td className="max-w-[220px] truncate px-5 py-3.5 italic text-ink/70 text-admin-small">
                          {rsvp.message ? `“${rsvp.message}”` : <span className="text-ink/30">—</span>}
                        </td>

                        <td className="whitespace-nowrap px-5 py-3.5 text-admin-micro text-ink/50">
                          {formatDate(rsvp.created_at)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-3.5 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(rsvp);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-ivory/60 px-3 py-1 font-sans text-admin-small font-semibold uppercase tracking-wider text-maroon shadow-2xs transition-all hover:border-maroon hover:bg-maroon hover:text-white hover:shadow-xs active:scale-95"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ── Guest Detail Modal / Sheet ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl border border-gold/25 pb-[env(safe-area-inset-bottom)] sm:pb-0"
            >
              {/* Header */}
              <div className={`p-4 min-[400px]:p-6 sm:p-7 ${selected.attending ? "bg-emerald-50/80 border-b border-emerald-100" : "bg-rose-50/80 border-b border-rose-100"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5 min-[400px]:gap-3.5">
                    <span
                      className={`flex h-12 w-12 min-[400px]:h-14 min-[400px]:w-14 shrink-0 items-center justify-center rounded-2xl font-sans text-lg font-bold shadow-xs ${
                        selected.attending
                          ? "bg-emerald-800 text-white shadow-emerald-900/10"
                          : "bg-rose-800 text-white shadow-rose-900/10"
                      }`}
                    >
                      {getInitials(selected.guest_name)}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate font-sans text-admin-modal font-bold text-ink">
                        {selected.guest_name}
                      </h2>
                      <div className="mt-1">
                        {selected.attending ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-800 px-3 py-1 font-sans text-admin-small font-semibold uppercase tracking-wider text-white">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                            Confirmed Attending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-800 px-3 py-1 font-sans text-admin-small font-semibold uppercase tracking-wider text-white">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-300" />
                            Declined
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelected(null)}
                    aria-label="Close modal"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-ink/70 shadow-xs transition hover:bg-white hover:text-ink active:scale-95"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-3 p-4 min-[400px]:p-6 sm:space-y-4 sm:p-7">
                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2.5 min-[400px]:gap-3.5">
                  <div className="flex flex-col justify-between rounded-2xl border border-gold/25 bg-[#FAF8F5] p-3.5 min-[400px]:p-4">
                    <p className="admin-card-label font-sans min-w-0 leading-tight text-gold">
                      Party Size
                    </p>
                    <p className="mt-1.5 font-sans text-admin-kpi font-extrabold text-maroon">
                      {selected.attending ? selected.guest_count : 0}
                    </p>
                    <p className="mt-0.5 font-sans text-admin-small text-ink/65">
                      {selected.attending
                        ? selected.guest_count === 1
                          ? "1 Guest attending"
                          : `${selected.guest_count} Guests attending`
                        : "Party not attending"}
                    </p>
                  </div>

                  <div className="flex flex-col justify-between rounded-2xl border border-gold/25 bg-[#FAF8F5] p-3.5 min-[400px]:p-4">
                    <p className="admin-card-label font-sans min-w-0 leading-tight text-gold">
                      Timestamp
                    </p>
                    <p className="mt-1.5 font-sans text-admin-body font-bold text-ink">
                      {selected.created_at ? new Date(selected.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </p>
                    <p className="mt-0.5 font-sans text-admin-small text-ink/65">
                      {selected.created_at ? new Date(selected.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "RSVP recorded"}
                    </p>
                  </div>
                </div>

                {/* Contact information card with Direct Action links */}
                <div className="rounded-2xl border border-gold/25 bg-[#FAF8F5] p-3.5 min-[400px]:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="admin-card-label font-sans min-w-0 leading-tight text-gold">
                      Contact Details
                    </p>
                    {selected.contact && (
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${selected.contact}`}
                          className="rounded-full bg-maroon/10 px-3 py-1 font-sans text-admin-small font-semibold uppercase text-maroon hover:bg-maroon hover:text-white transition-colors"
                        >
                          Call
                        </a>
                        <a
                          href={`https://wa.me/${selected.contact.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-emerald-50 px-3 py-1 font-sans text-admin-small font-semibold uppercase text-emerald-800 hover:bg-emerald-600 hover:text-white transition-colors"
                        >
                          WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 font-sans text-admin-body font-semibold tracking-wide text-ink">
                    {selected.contact || (
                      <span className="font-normal italic text-ink/40">
                        No phone or email provided by guest.
                      </span>
                    )}
                  </p>
                </div>

                {/* Wishes / Note Card */}
                <div className="rounded-2xl border border-gold/25 bg-[#FAF8F5] p-3.5 min-[400px]:p-4">
                  <p className="admin-card-label font-sans min-w-0 leading-tight text-gold">
                    Guest Blessings &amp; Notes
                  </p>
                  {selected.message ? (
                    <p className="mt-2 font-sans text-admin-body italic leading-relaxed text-ink/85 border-l-2 border-gold/40 pl-3">
                      {selected.message}
                    </p>
                  ) : (
                    <p className="mt-1.5 font-sans text-admin-small italic text-ink/40">
                      No personal note included.
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setSelected(null)}
                  className="mt-2 w-full rounded-full bg-gradient-to-r from-maroon via-maroon-deep to-maroon py-3.5 font-sans text-admin-small font-semibold uppercase tracking-widest text-ivory shadow-md transition-all hover:shadow-lg active:scale-[0.99]"
                >
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
