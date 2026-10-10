"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import OrnamentalDivider from "./OrnamentalDivider";

export default function RsvpForm() {
  const [guestName, setGuestName] = useState("");
  const [contact, setContact] = useState("");
  const [attending, setAttending] = useState<boolean | null>(null);
  const [guestCount, setGuestCount] = useState<number>(1);
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedSummary, setSubmittedSummary] = useState<{ name: string; count: number; attending: boolean } | null>(null);

  const eventId = process.env.NEXT_PUBLIC_WEDDING_EVENT_ID;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!guestName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (attending === null) {
      setErrorMessage("Please select whether you will be able to attend.");
      return;
    }

    const finalGuestCount = attending ? Number(guestCount) : 0;

    if (attending && (isNaN(finalGuestCount) || finalGuestCount < 1 || finalGuestCount > 20)) {
      setErrorMessage("Please enter a valid party size (between 1 and 20 guests).");
      return;
    }

    if (!eventId) {
      setErrorMessage("Wedding event ID is not configured. Please contact the couple.");
      return;
    }

    setLoading(true);

    try {
      const trimmedName = guestName.trim();
      const { error } = await supabase.from("rsvps").insert([
        {
          event_id: eventId,
          guest_name: trimmedName,
          contact: contact.trim() || null,
          attending: attending,
          guest_count: finalGuestCount,
          message: message.trim() || null,
        },
      ]);

      if (error) {
        throw error;
      }

      setSubmittedSummary({
        name: trimmedName,
        count: finalGuestCount,
        attending: attending,
      });
      setSubmitted(true);
      // Reset form fields
      setGuestName("");
      setContact("");
      setAttending(null);
      setGuestCount(1);
      setMessage("");
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setErrorMessage(
        errObj?.message || "Something went wrong while submitting your RSVP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="rsvp" className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl border border-gold/30 bg-white/95 p-5 shadow-[0_16px_45px_-18px_rgba(74,14,24,0.25)] sm:p-9 md:p-11"
      >
        {/* Subtle decorative background glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-maroon/5 blur-3xl" />

        {/* Section Header */}
        <div className="relative text-center">
          <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-gold font-semibold">
            Join Our Celebration
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-[0.14em] uppercase text-maroon sm:text-3xl md:text-4xl">
            RSVP
          </h2>
          <div className="mt-3.5 flex justify-center">
            <OrnamentalDivider />
          </div>
          <p className="mx-auto mt-3.5 max-w-lg font-sans text-xs italic text-ink/75 sm:text-sm md:text-base">
            Kindly respond by 1st November 2026 so we can celebrate this blessed occasion together.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative mt-8 rounded-2xl border border-gold/35 bg-[#FAF8F5] p-6 text-center sm:p-9"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-maroon to-maroon-deep text-gold-light shadow-md sm:h-16 sm:w-16">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-7 w-7"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>

              <h3 className="mt-4 font-display text-xl font-bold uppercase tracking-wider text-maroon sm:text-2xl">
                Thank You, {submittedSummary?.name}!
              </h3>

              <div className="mx-auto mt-3 max-w-md">
                {submittedSummary?.attending ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-emerald-900">
                    Confirmed for <strong className="font-bold">{submittedSummary.count} {submittedSummary.count === 1 ? "Guest" : "Guests"}</strong>. We look forward to celebrating with you!
                  </div>
                ) : (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-rose-900">
                    Your response has been noted. You will be dearly missed!
                  </div>
                )}
              </div>

              <p className="mt-3 font-sans text-xs italic text-ink/70 sm:text-sm">
                Your RSVP response has been successfully saved to our guest registry.
              </p>

              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-maroon/30 bg-white px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-widest text-maroon shadow-xs transition-all duration-200 hover:border-maroon hover:bg-maroon hover:text-ivory active:scale-95"
              >
                Submit Another Response
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="relative mt-7 space-y-4 sm:space-y-5">
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/90 p-3.5 text-center font-sans text-xs font-medium text-red-800 sm:text-sm"
                >
                  <svg className="h-4 w-4 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="12" cy="16" r="1" fill="currentColor" />
                  </svg>
                  <span>{errorMessage}</span>
                </motion.div>
              )}

              {/* Guest Full Name */}
              <div>
                <label
                  htmlFor="guestName"
                  className="flex items-center justify-between font-sans text-xs font-semibold uppercase tracking-wider text-maroon sm:text-sm"
                >
                  <span>
                    Full Name <span className="text-red-600">*</span>
                  </span>
                </label>
                <input
                  id="guestName"
                  type="text"
                  required
                  autoComplete="name"
                  enterKeyHint="next"
                  placeholder="e.g. Ruwan Perera"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gold/35 bg-[#FAF8F5] px-4 py-3 font-sans text-base sm:text-sm text-ink placeholder-ink/35 transition-all focus:border-maroon focus:bg-white focus:outline-none focus:ring-2 focus:ring-maroon/15"
                />
              </div>

              {/* Contact Information */}
              <div>
                <div className="flex items-center justify-between font-sans text-xs font-semibold uppercase tracking-wider text-maroon sm:text-sm">
                  <label htmlFor="contact">Contact Details</label>
                  <span className="font-normal lowercase tracking-normal text-ink/40 text-[11px]">
                    optional
                  </span>
                </div>
                <input
                  id="contact"
                  type="text"
                  autoComplete="tel"
                  enterKeyHint="next"
                  placeholder="Phone number or email"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gold/35 bg-[#FAF8F5] px-4 py-3 font-sans text-base sm:text-sm text-ink placeholder-ink/35 transition-all focus:border-maroon focus:bg-white focus:outline-none focus:ring-2 focus:ring-maroon/15"
                />
              </div>

              {/* Attendance Selection */}
              <div>
                <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-maroon sm:text-sm">
                  Will You Attend? <span className="text-red-600">*</span>
                </label>
                <div className="mt-1.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3.5">
                  {/* Attending Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setAttending(true);
                      if (guestCount === 0) setGuestCount(1);
                    }}
                    className={`relative flex items-center justify-center gap-2.5 rounded-xl border p-3.5 text-center transition-all sm:p-4 ${
                      attending === true
                        ? "border-maroon bg-gradient-to-r from-maroon to-maroon-deep text-ivory shadow-md ring-2 ring-maroon/20"
                        : "border-gold/35 bg-[#FAF8F5] text-ink/80 hover:border-gold hover:bg-ivory/60"
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`h-4 w-4 shrink-0 transition-colors sm:h-5 sm:w-5 ${
                        attending === true ? "text-gold-light" : "text-gold"
                      }`}
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="14" r="6" />
                      <path d="M12 4.5l2 3.5h-4z" fill="currentColor" fillOpacity={attending === true ? 0.35 : 0.2} />
                      <path d="M9.5 5.5l-1.5-1.5" />
                      <path d="M14.5 5.5l1.5-1.5" />
                      <path d="M12 2.5v1.5" />
                    </svg>
                    <span className="font-sans text-xs font-semibold uppercase tracking-wider sm:text-sm">
                      Joyfully Attending
                    </span>
                    {attending === true && (
                      <span className="absolute right-3 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-maroon text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                  </button>

                  {/* Unable Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setAttending(false);
                      setGuestCount(0);
                    }}
                    className={`relative flex items-center justify-center gap-2.5 rounded-xl border p-3.5 text-center transition-all sm:p-4 ${
                      attending === false
                        ? "border-maroon bg-gradient-to-r from-maroon to-maroon-deep text-ivory shadow-md ring-2 ring-maroon/20"
                        : "border-gold/35 bg-[#FAF8F5] text-ink/80 hover:border-gold hover:bg-ivory/60"
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`h-4 w-4 shrink-0 transition-colors sm:h-5 sm:w-5 ${
                        attending === false ? "text-gold-light" : "text-gold"
                      }`}
                      aria-hidden="true"
                    >
                      <rect width="20" height="15" x="2" y="5" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                    <span className="font-sans text-xs font-semibold uppercase tracking-wider sm:text-sm">
                      Regretfully Unable
                    </span>
                    {attending === false && (
                      <span className="absolute right-3 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-maroon text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Touch Stepper for Number of Guests */}
              <AnimatePresence>
                {attending === true && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-2xl border border-gold/35 bg-[#FAF8F5] p-3.5 sm:p-4.5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-maroon sm:text-sm">
                            Party Size <span className="text-red-600">*</span>
                          </label>
                          <p className="mt-0.5 font-sans text-xs text-ink/65">
                            Including yourself (maximum 20)
                          </p>
                        </div>

                        {/* Stepper + Pill Controls */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setGuestCount((prev) => Math.max(1, prev - 1))}
                            disabled={guestCount <= 1}
                            aria-label="Decrease guest count"
                            className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-gold/40 bg-white font-sans text-lg font-bold text-maroon shadow-xs transition hover:bg-gold/10 active:scale-95 disabled:opacity-35"
                          >
                            −
                          </button>

                          <div className="flex h-10 min-w-[56px] sm:h-11 items-center justify-center rounded-xl border border-gold/40 bg-white px-3 font-sans text-base sm:text-lg font-extrabold text-maroon shadow-inner">
                            {guestCount}
                          </div>

                          <button
                            type="button"
                            onClick={() => setGuestCount((prev) => Math.min(20, prev + 1))}
                            disabled={guestCount >= 20}
                            aria-label="Increase guest count"
                            className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-gold/40 bg-white font-sans text-lg font-bold text-maroon shadow-xs transition hover:bg-gold/10 active:scale-95 disabled:opacity-35"
                          >
                            +
                          </button>

                          {/* Quick selection presets */}
                          <div className="ml-2 hidden items-center gap-1 min-[450px]:flex">
                            {[1, 2, 3, 4].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setGuestCount(num)}
                                className={`h-8 w-8 rounded-lg font-sans text-xs font-bold transition ${
                                  guestCount === num
                                    ? "bg-maroon text-white"
                                    : "bg-white/80 text-ink/65 hover:bg-gold/20"
                                }`}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Message to Couple */}
              <div>
                <div className="flex items-center justify-between font-sans text-xs font-semibold uppercase tracking-wider text-maroon sm:text-sm">
                  <label htmlFor="message">Warm Wishes & Notes</label>
                  <span className="font-normal lowercase tracking-normal text-ink/40 text-[11px]">
                    optional
                  </span>
                </div>
                <textarea
                  id="message"
                  rows={3}
                  enterKeyHint="done"
                  placeholder="Share a blessing, note, or dietary request..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1.5 w-full resize-y rounded-xl border border-gold/35 bg-[#FAF8F5] px-4 py-3 font-sans text-base sm:text-sm text-ink placeholder-ink/35 transition-all focus:border-maroon focus:bg-white focus:outline-none focus:ring-2 focus:ring-maroon/15"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 text-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="relative inline-flex w-full items-center justify-center overflow-hidden rounded-full border border-gold-light/60 bg-gradient-to-r from-maroon via-maroon-deep to-maroon px-8 py-3.5 font-sans text-xs font-semibold uppercase tracking-[0.22em] text-ivory shadow-[0_8px_22px_-4px_rgba(74,14,24,0.35)] transition-all duration-300 hover:border-gold hover:shadow-[0_12px_28px_-4px_rgba(74,14,24,0.45)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-12 sm:text-sm"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin text-ivory"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      Submitting RSVP...
                    </span>
                  ) : (
                    <span>Submit RSVP</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
