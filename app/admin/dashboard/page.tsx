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
    return new Date(iso).toLocaleString("en-US", {
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
    return { totalResponses, attendingCount, notAttendingCount, confirmedAttendees };
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

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-maroon border-t-transparent" />
          <p className="font-sans text-xs uppercase tracking-widest text-maroon">
            Verifying Authorization...
          </p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ivory px-4 text-center">
        <div className="w-full max-w-md rounded-3xl border border-red-300 bg-white p-6 shadow-lg sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="mt-4 font-sans text-xl font-bold uppercase tracking-wider text-maroon">
            Access Restricted
          </h2>
          <p className="mt-2 break-words font-sans text-sm text-ink/70">
            Your account ({userEmail}) is not an authorized member for this event.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={handleSignOut}
              className="rounded-full bg-maroon px-6 py-3 font-sans text-xs font-semibold uppercase tracking-widest text-ivory transition-colors hover:bg-maroon-deep"
            >
              Sign Out &amp; Switch Account
            </button>
            <Link href="/invitation" className="font-sans text-xs text-gold hover:underline">
              Back to Wedding Invitation
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filterBtn = (active: boolean, activeCls: string, idleCls: string) =>
    `shrink-0 rounded-full px-4 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-wider transition-all sm:text-xs ${
      active ? activeCls : idleCls
    }`;

  return (
    <div className="min-h-screen bg-ivory text-ink">
      {/* ── Top Navbar (mobile-responsive) ── */}
      <header className="sticky top-0 z-30 border-b border-gold/30 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Link
                href="/invitation"
                className="shrink-0 rounded-full p-2 font-sans text-xs uppercase tracking-widest text-maroon hover:bg-ivory"
                aria-label="View invitation"
              >
                &larr; <span className="hidden sm:inline">View Invite</span>
                <span className="sm:hidden">Invite</span>
              </Link>
              <span className="hidden text-gold/40 sm:inline">|</span>
              <span className="truncate font-sans text-[11px] font-bold uppercase tracking-widest text-maroon sm:text-xs">
                RSVP Admin
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`hidden rounded-full px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider min-[420px]:inline-flex ${
                  role === "developer"
                    ? "border border-purple-300 bg-purple-50 text-purple-700"
                    : "border border-gold/40 bg-champagne/60 text-maroon"
                }`}
              >
                {role === "developer" ? "Developer" : "Owner"}
              </span>
              <button
                onClick={handleSignOut}
                className="rounded-full border border-maroon/30 px-3.5 py-2 font-sans text-[11px] font-semibold uppercase tracking-wider text-maroon transition-colors hover:bg-maroon hover:text-ivory active:scale-95"
              >
                Sign Out
              </button>
            </div>
          </div>
          {/* user line — truncates on mobile */}
          <p className="mt-1 truncate font-sans text-[11px] text-ink/60">
            {userEmail} · {eventInfo?.title || "Wedding Invitation"}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        {/* ── Title + Actions ── */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="font-sans text-xl font-bold uppercase tracking-wider text-maroon sm:text-3xl">
              RSVP Management
            </h1>
            <p className="mt-1 font-sans text-xs text-ink/60 sm:text-sm">
              {stats.totalResponses} responses · {stats.confirmedAttendees} confirmed guests
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              disabled={loadingData}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gold/40 bg-white px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-maroon shadow-sm transition-all hover:border-gold active:scale-[0.98] disabled:opacity-60 sm:flex-none"
            >
              <svg
                className={`h-4 w-4 ${loadingData ? "animate-spin text-gold" : "text-maroon"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loadingData ? "Refreshing" : "Refresh"}
            </button>
            <button
              onClick={handleExport}
              disabled={filteredRsvps.length === 0}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-maroon px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-ivory shadow-sm transition-all hover:bg-maroon-deep active:scale-[0.98] disabled:opacity-40 sm:flex-none"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* ── Developer box ── */}
        {role === "developer" && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-2xl border border-purple-200 bg-purple-50/60 p-4 font-sans text-xs text-purple-900"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="break-all">
                <span className="font-bold uppercase tracking-wider">Dev config · </span>
                <code className="rounded bg-purple-100 px-1.5 py-0.5 font-mono text-[11px]">{eventId}</code>
              </p>
              <p className="font-semibold uppercase">
                {eventInfo?.is_open ? "🟢 Open for RSVPs" : "🔴 Closed"}
              </p>
            </div>
          </motion.div>
        )}

        {errorMessage && (
          <div className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 text-xs font-medium text-red-800">
            {errorMessage}
          </div>
        )}

        {/* ── Stats (2-col mobile → 4-col desktop) ── */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-gold/30 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-champagne/60 text-sm">📋</span>
              <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-gold sm:text-xs">
                Responses
              </p>
            </div>
            <p className="mt-2 font-sans text-2xl font-bold text-maroon sm:text-4xl">{stats.totalResponses}</p>
            <p className="mt-0.5 font-sans text-[11px] italic text-ink/60">Total forms submitted</p>
          </div>
          <div className="rounded-2xl border border-green-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-sm">✓</span>
              <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-green-700 sm:text-xs">
                Attending
              </p>
            </div>
            <p className="mt-2 font-sans text-2xl font-bold text-green-800 sm:text-4xl">{stats.attendingCount}</p>
            <p className="mt-0.5 font-sans text-[11px] italic text-ink/60">Accepted invites</p>
          </div>
          <div className="rounded-2xl border border-red-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-sm">✕</span>
              <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-red-700 sm:text-xs">
                Declined
              </p>
            </div>
            <p className="mt-2 font-sans text-2xl font-bold text-red-800 sm:text-4xl">{stats.notAttendingCount}</p>
            <p className="mt-0.5 font-sans text-[11px] italic text-ink/60">Unable to attend</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-maroon via-maroon-deep to-maroon p-4 text-ivory shadow-sm sm:p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm">👥</span>
              <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-gold-light sm:text-xs">
                Headcount
              </p>
            </div>
            <p className="mt-2 font-sans text-2xl font-bold sm:text-4xl">{stats.confirmedAttendees}</p>
            <p className="mt-0.5 font-sans text-[11px] italic text-ivory/80">Confirmed guests</p>
          </div>
        </div>

        {/* ── Filters + Search ── */}
        <div className="mt-6 rounded-2xl border border-gold/25 bg-white p-3 shadow-sm sm:p-4">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <button
              onClick={() => setStatusFilter("all")}
              className={filterBtn(statusFilter === "all", "bg-maroon text-ivory shadow", "bg-ivory/70 text-maroon hover:bg-ivory")}
            >
              All ({rsvps.length})
            </button>
            <button
              onClick={() => setStatusFilter("attending")}
              className={filterBtn(statusFilter === "attending", "bg-green-800 text-white shadow", "bg-green-50 text-green-800 hover:bg-green-100")}
            >
              Attending ({stats.attendingCount})
            </button>
            <button
              onClick={() => setStatusFilter("not_attending")}
              className={filterBtn(statusFilter === "not_attending", "bg-red-800 text-white shadow", "bg-red-50 text-red-800 hover:bg-red-100")}
            >
              Declined ({stats.notAttendingCount})
            </button>
          </div>
          <div className="relative mt-3">
            <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10 18a8 8 0 110-16 8 8 0 010 16z" />
            </svg>
            <input
              type="search"
              placeholder="Search name, contact, wishes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gold/30 bg-ivory/30 py-3 pl-10 pr-10 font-sans text-sm text-ink placeholder-ink/40 transition-colors focus:border-maroon focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-lg text-ink/40 hover:bg-ivory hover:text-ink"
              >
                ×
              </button>
            )}
          </div>
          <p className="mt-2.5 px-1 font-sans text-[11px] text-ink/55">
            Showing <span className="font-semibold text-maroon">{filteredRsvps.length}</span> of{" "}
            {rsvps.length} guests · tap a guest for full details
          </p>
        </div>

        {/* ── Content ── */}
        {loadingData ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-gold/20 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-ivory" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/5 rounded bg-ivory" />
                    <div className="h-2.5 w-3/5 rounded bg-ivory" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredRsvps.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-gold/40 bg-white px-6 py-12 text-center">
            <span className="text-3xl">📋</span>
            <p className="mt-2 font-sans text-sm font-semibold text-maroon">No guests found</p>
            <p className="mt-1 font-sans text-xs italic text-ink/50">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filters."
                : "New guest submissions will appear here."}
            </p>
            {(searchTerm || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="mt-4 rounded-full border border-maroon/30 px-5 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-maroon hover:bg-maroon hover:text-ivory"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile cards (< md) */}
            <div className="mt-4 space-y-3 md:hidden">
              {filteredRsvps.map((rsvp, idx) => (
                <motion.button
                  key={rsvp.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                  onClick={() => setSelected(rsvp)}
                  className="w-full rounded-2xl border border-gold/25 bg-white p-4 text-left shadow-sm transition-all active:scale-[0.99]"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-sans text-sm font-bold ${
                        rsvp.attending ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                      }`}
                    >
                      {getInitials(rsvp.guest_name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-sans text-sm font-bold text-ink">{rsvp.guest_name}</p>
                        <svg className="h-4 w-4 shrink-0 text-ink/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {rsvp.attending ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-green-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-600" /> Attending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-red-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-600" /> Declined
                          </span>
                        )}
                        {rsvp.attending && (
                          <span className="inline-flex items-center rounded-full bg-champagne/50 px-2.5 py-1 font-sans text-[10px] font-semibold text-maroon">
                            👥 {rsvp.guest_count} {rsvp.guest_count === 1 ? "guest" : "guests"}
                          </span>
                        )}
                      </div>
                      {rsvp.message && (
                        <p className="mt-2 line-clamp-2 font-sans text-xs italic leading-relaxed text-ink/65">
                          &ldquo;{rsvp.message}&rdquo;
                        </p>
                      )}
                      <p className="mt-1.5 font-sans text-[11px] text-ink/45">{formatDate(rsvp.created_at)}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Desktop table (md+) */}
            <div className="mt-6 hidden overflow-hidden rounded-2xl border border-gold/25 bg-white shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs">
                  <thead className="border-b border-gold/20 bg-champagne/40 text-[10px] font-bold uppercase tracking-widest text-maroon">
                    <tr>
                      <th className="px-6 py-3.5">Guest</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-center">Guests</th>
                      <th className="px-6 py-3.5">Contact</th>
                      <th className="px-6 py-3.5">Wishes</th>
                      <th className="px-6 py-3.5 text-right">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold/15">
                    {filteredRsvps.map((rsvp) => (
                      <tr
                        key={rsvp.id}
                        onClick={() => setSelected(rsvp)}
                        className="cursor-pointer transition-colors hover:bg-ivory/50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                                rsvp.attending ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                              }`}
                            >
                              {getInitials(rsvp.guest_name)}
                            </span>
                            <span className="font-semibold text-ink">{rsvp.guest_name}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {rsvp.attending ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-green-300 bg-green-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-green-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-600" /> Attending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-red-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-600" /> Declined
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-center font-bold text-maroon">
                          {rsvp.attending ? rsvp.guest_count : 0}
                        </td>
                        <td className="max-w-[160px] truncate px-6 py-4 text-ink/70">
                          {rsvp.contact || <span className="italic text-ink/40">—</span>}
                        </td>
                        <td className="max-w-[220px] truncate px-6 py-4 italic text-ink/70">
                          {rsvp.message ? `“${rsvp.message}”` : <span className="text-ink/30">—</span>}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-[11px] text-ink/50">
                          {formatDate(rsvp.created_at)}
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

      {/* ── Guest Detail: bottom-sheet on mobile, centered dialog on desktop ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-maroon-deep/60 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 80, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl"
            >
              {/* Grabber (mobile affordance) */}
              <div className="sticky top-0 bg-white pt-3 sm:hidden">
                <div className="mx-auto h-1.5 w-12 rounded-full bg-ink/15" />
              </div>

              {/* Header */}
              <div className={`px-5 pb-5 pt-4 sm:px-7 sm:pt-6 ${selected.attending ? "bg-green-50/60" : "bg-red-50/60"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-sans text-lg font-bold shadow-sm ${
                        selected.attending ? "bg-green-800 text-white" : "bg-red-800 text-white"
                      }`}
                    >
                      {getInitials(selected.guest_name)}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate font-sans text-lg font-bold leading-tight text-ink">
                        {selected.guest_name}
                      </h2>
                      <div className="mt-1.5">
                        {selected.attending ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-800 px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-white">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-300" /> Attending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-800 px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-white">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-300" /> Declined
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    aria-label="Close details"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-lg text-ink/60 shadow-sm transition hover:text-ink active:scale-90"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-3 px-5 py-5 sm:px-7">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-gold/25 bg-ivory/40 p-3.5">
                    <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-gold">Guests</p>
                    <p className="mt-1 font-sans text-xl font-bold text-maroon">
                      {selected.attending ? selected.guest_count : 0}
                    </p>
                    <p className="font-sans text-[11px] text-ink/55">
                      {selected.attending ? "people attending" : "not attending"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gold/25 bg-ivory/40 p-3.5">
                    <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-gold">Submitted</p>
                    <p className="mt-1 font-sans text-[13px] font-bold leading-snug text-ink">
                      {formatDate(selected.created_at)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-gold/25 bg-white p-4">
                  <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-gold">Contact</p>
                  {selected.contact ? (
                    <a
                      href={`tel:${selected.contact}`}
                      className="mt-1 block truncate font-sans text-sm font-semibold text-maroon underline decoration-gold/50 underline-offset-2"
                    >
                      {selected.contact}
                    </a>
                  ) : (
                    <p className="mt-1 font-sans text-sm italic text-ink/40">Not provided</p>
                  )}
                </div>

                <div className="rounded-2xl border border-gold/25 bg-champagne/30 p-4">
                  <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-maroon">
                    Message / Wishes
                  </p>
                  {selected.message ? (
                    <p className="mt-1.5 font-sans text-sm italic leading-relaxed text-ink/85">
                      &ldquo;{selected.message}&rdquo;
                    </p>
                  ) : (
                    <p className="mt-1 font-sans text-sm italic text-ink/40">No message left.</p>
                  )}
                </div>

                <button
                  onClick={() => setSelected(null)}
                  className="w-full rounded-full bg-maroon py-3.5 font-sans text-xs font-semibold uppercase tracking-widest text-ivory transition hover:bg-maroon-deep active:scale-[0.99] sm:py-3"
                >
                  Close Details
                </button>
                <div className="h-[env(safe-area-inset-bottom)] sm:hidden" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
