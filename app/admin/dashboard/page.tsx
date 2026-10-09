"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
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

export default function AdminDashboardPage() {
  const router = useRouter();

  // Auth & Role states
  const [loadingUser, setLoadingUser] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Data states
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "attending" | "not_attending">("all");

  const eventId = process.env.NEXT_PUBLIC_WEDDING_EVENT_ID;

  // Sign out handler
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  // Fetch RSVPs & Event details
  const fetchData = useCallback(async () => {
    if (!eventId) {
      setErrorMessage("Event ID is missing from environment configuration.");
      return;
    }

    setLoadingData(true);
    setErrorMessage(null);

    try {
      // 1. Fetch RSVPs for this wedding event
      const { data: rsvpData, error: rsvpError } = await supabase
        .from("rsvps")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (rsvpError) throw rsvpError;
      setRsvps((rsvpData as RSVP[]) || []);

      // 2. Fetch Event details
      const { data: eventData } = await supabase
        .from("events")
        .select("id, title, is_open, created_at")
        .eq("id", eventId)
        .maybeSingle();

      if (eventData) {
        setEventInfo(eventData as EventInfo);
      }
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setErrorMessage(errObj?.message || "Failed to load RSVP records.");
    } finally {
      setLoadingData(false);
    }
  }, [eventId]);

  // Auth verification and role check on mount
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

        // Verify membership in public.event_members for this event
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

        // Fetch RSVP data
        await fetchData();
      } catch {
        setIsAuthorized(false);
        setLoadingUser(false);
      }
    }

    verifyAuth();
  }, [router, eventId, fetchData]);

  // Filtered and searched RSVPs
  const filteredRsvps = useMemo(() => {
    return rsvps.filter((item) => {
      // Attendance status filter
      if (statusFilter === "attending" && !item.attending) return false;
      if (statusFilter === "not_attending" && item.attending) return false;

      // Search keyword filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const nameMatch = item.guest_name.toLowerCase().includes(term);
        const contactMatch = item.contact?.toLowerCase().includes(term);
        const messageMatch = item.message?.toLowerCase().includes(term);
        return nameMatch || contactMatch || messageMatch;
      }

      return true;
    });
  }, [rsvps, statusFilter, searchTerm]);

  // Calculated statistics
  const stats = useMemo(() => {
    const totalResponses = rsvps.length;
    const attendingCount = rsvps.filter((r) => r.attending).length;
    const notAttendingCount = rsvps.filter((r) => !r.attending).length;
    const confirmedAttendees = rsvps
      .filter((r) => r.attending)
      .reduce((sum, r) => sum + (Number(r.guest_count) || 0), 0);

    return {
      totalResponses,
      attendingCount,
      notAttendingCount,
      confirmedAttendees,
    };
  }, [rsvps]);

  // Loading state
  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-maroon border-t-transparent" />
          <p className="font-sans text-xs uppercase tracking-widest text-maroon">
            Verifying Authorization...
          </p>
        </div>
      </div>
    );
  }

  // Unauthorized state
  if (isAuthorized === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ivory px-4 text-center">
        <div className="w-full max-w-md rounded-3xl border border-red-300 bg-white p-8 shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="mt-4 font-sans text-xl font-bold uppercase tracking-wider text-maroon">
            Access Restricted
          </h2>
          <p className="mt-2 font-sans text-sm text-ink/70">
            Your authenticated account ({userEmail}) is not an authorized member for this wedding event.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={handleSignOut}
              className="rounded-full bg-maroon px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-widest text-ivory transition-colors hover:bg-maroon-deep"
            >
              Sign Out &amp; Switch Account
            </button>
            <Link
              href="/invitation"
              className="font-sans text-xs text-gold hover:underline"
            >
              Back to Wedding Invitation
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory text-ink">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-gold/30 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/invitation"
              className="font-sans text-xs uppercase tracking-widest text-maroon hover:text-gold"
            >
              &larr; View Invite
            </Link>
            <span className="text-gold/40">|</span>
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-maroon">
              Wedding RSVP Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Role Badge */}
            <span
              className={`rounded-full px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider ${
                role === "developer"
                  ? "border border-purple-300 bg-purple-50 text-purple-700"
                  : "border border-gold/40 bg-champagne/60 text-maroon"
              }`}
            >
              {role === "developer" ? "Developer Access" : "Event Owner"}
            </span>

            {/* Logout Button */}
            <button
              onClick={handleSignOut}
              className="rounded-full border border-maroon/30 px-3.5 py-1 font-sans text-[11px] font-semibold uppercase tracking-wider text-maroon transition-colors hover:bg-maroon hover:text-ivory"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Welcome & Event Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-sans text-2xl font-bold uppercase tracking-wider text-maroon sm:text-3xl">
              RSVP Management
            </h1>
            <p className="mt-1 font-sans text-xs italic text-ink/70 sm:text-sm">
              Logged in as <span className="font-medium text-ink">{userEmail}</span> &middot;{" "}
              {eventInfo?.title || "Wedding Invitation"}
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={loadingData}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-gold/40 bg-white px-4 py-2 font-sans text-xs font-semibold uppercase tracking-wider text-maroon shadow-sm transition-all hover:border-gold hover:shadow sm:self-auto disabled:opacity-60"
          >
            <svg
              className={`h-4 w-4 ${loadingData ? "animate-spin text-gold" : "text-maroon"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>

        {/* Developer Info Box (Only displayed for developer role) */}
        {role === "developer" && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl border border-purple-200 bg-purple-50/60 p-4 text-xs font-sans text-purple-900"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold uppercase tracking-wider text-purple-900">
                  Developer Configuration:
                </span>{" "}
                <span className="text-purple-700">Event ID:</span>{" "}
                <code className="rounded bg-purple-100 px-1.5 py-0.5 font-mono text-[11px] text-purple-950">
                  {eventId}
                </code>
              </div>
              <div>
                <span className="text-purple-700">Event Status:</span>{" "}
                <span className="font-semibold uppercase text-purple-900">
                  {eventInfo?.is_open ? "🟢 Open for RSVPs" : "🔴 Closed"}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-xs font-medium text-red-800">
            {errorMessage}
          </div>
        )}

        {/* Statistics Metric Cards */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* 1. Total Responses */}
          <div className="rounded-2xl border border-gold/30 bg-white p-5 shadow-sm transition-all hover:border-gold hover:shadow-md">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-gold sm:text-xs">
              Total Responses
            </p>
            <p className="mt-2 font-sans text-3xl font-bold tracking-tight text-maroon sm:text-4xl">
              {stats.totalResponses}
            </p>
            <p className="mt-1 font-sans text-[11px] italic text-ink/60">
              Submitted RSVP forms
            </p>
          </div>

          {/* 2. Attending */}
          <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm transition-all hover:border-green-300 hover:shadow-md">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-green-700 sm:text-xs">
              Attending Responses
            </p>
            <p className="mt-2 font-sans text-3xl font-bold tracking-tight text-green-800 sm:text-4xl">
              {stats.attendingCount}
            </p>
            <p className="mt-1 font-sans text-[11px] italic text-ink/60">
              Accepted invitations
            </p>
          </div>

          {/* 3. Non-Attending */}
          <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm transition-all hover:border-red-300 hover:shadow-md">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-red-700 sm:text-xs">
              Unable to Attend
            </p>
            <p className="mt-2 font-sans text-3xl font-bold tracking-tight text-red-800 sm:text-4xl">
              {stats.notAttendingCount}
            </p>
            <p className="mt-1 font-sans text-[11px] italic text-ink/60">
              Declined with regrets
            </p>
          </div>

          {/* 4. Confirmed Headcount */}
          <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-maroon via-maroon-deep to-maroon p-5 text-ivory shadow-sm transition-all hover:shadow-md">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-gold-light sm:text-xs">
              Confirmed Attendees
            </p>
            <p className="mt-2 font-sans text-3xl font-bold tracking-tight text-ivory sm:text-4xl">
              {stats.confirmedAttendees}
            </p>
            <p className="mt-1 font-sans text-[11px] italic text-ivory/80">
              Sum of guest headcount
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-8 flex flex-col justify-between gap-4 rounded-2xl border border-gold/25 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`rounded-xl px-4 py-2 font-sans text-xs font-semibold uppercase tracking-wider transition-colors ${
                statusFilter === "all"
                  ? "bg-maroon text-ivory"
                  : "bg-ivory/60 text-maroon hover:bg-ivory"
              }`}
            >
              All ({rsvps.length})
            </button>
            <button
              onClick={() => setStatusFilter("attending")}
              className={`rounded-xl px-4 py-2 font-sans text-xs font-semibold uppercase tracking-wider transition-colors ${
                statusFilter === "attending"
                  ? "bg-green-800 text-white"
                  : "bg-green-50 text-green-800 hover:bg-green-100"
              }`}
            >
              Attending ({stats.attendingCount})
            </button>
            <button
              onClick={() => setStatusFilter("not_attending")}
              className={`rounded-xl px-4 py-2 font-sans text-xs font-semibold uppercase tracking-wider transition-colors ${
                statusFilter === "not_attending"
                  ? "bg-red-800 text-white"
                  : "bg-red-50 text-red-800 hover:bg-red-100"
              }`}
            >
              Not Attending ({stats.notAttendingCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by name, contact, note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gold/30 bg-ivory/30 px-3.5 py-2 font-sans text-xs text-ink placeholder-ink/40 transition-colors focus:border-maroon focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 text-xs text-ink/40 hover:text-ink"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* RSVP Data Table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-gold/25 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="border-b border-gold/20 bg-champagne/40 text-[10px] font-bold uppercase tracking-widest text-maroon">
                <tr>
                  <th className="px-4 py-3.5 sm:px-6">Guest Name</th>
                  <th className="px-4 py-3.5 sm:px-6">Attendance</th>
                  <th className="px-4 py-3.5 text-center sm:px-6">Guests</th>
                  <th className="px-4 py-3.5 sm:px-6">Contact</th>
                  <th className="px-4 py-3.5 sm:px-6">Message / Wishes</th>
                  <th className="px-4 py-3.5 text-right sm:px-6">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/15">
                {loadingData ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-ink/60">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-maroon border-t-transparent" />
                        <span>Loading RSVP records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRsvps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-ink/60">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="text-2xl">📋</span>
                        <p className="font-semibold text-maroon">No RSVP records found</p>
                        <p className="text-xs italic text-ink/50">
                          {searchTerm || statusFilter !== "all"
                            ? "Try adjusting your search or filters."
                            : "New guest submissions will appear here automatically."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRsvps.map((rsvp) => (
                    <tr
                      key={rsvp.id}
                      className="transition-colors hover:bg-ivory/30"
                    >
                      {/* Name */}
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-ink sm:px-6">
                        {rsvp.guest_name}
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                        {rsvp.attending ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-green-300 bg-green-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-green-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                            Attending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-red-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                            Declined
                          </span>
                        )}
                      </td>

                      {/* Guest Count */}
                      <td className="whitespace-nowrap px-4 py-4 text-center font-bold text-maroon sm:px-6">
                        {rsvp.attending ? rsvp.guest_count : 0}
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-4 text-ink/70 sm:px-6">
                        {rsvp.contact || (
                          <span className="italic text-ink/40">Not provided</span>
                        )}
                      </td>

                      {/* Message */}
                      <td className="max-w-xs px-4 py-4 sm:px-6">
                        {rsvp.message ? (
                          <span className="italic text-ink/80">&ldquo;{rsvp.message}&rdquo;</span>
                        ) : (
                          <span className="text-ink/30">&mdash;</span>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="whitespace-nowrap px-4 py-4 text-right text-[11px] text-ink/50 sm:px-6">
                        {new Date(rsvp.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
