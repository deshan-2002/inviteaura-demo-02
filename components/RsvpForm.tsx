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

  const eventId = process.env.NEXT_PUBLIC_WEDDING_EVENT_ID;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!guestName.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }

    if (attending === null) {
      setErrorMessage("Please select whether you will attend.");
      return;
    }

    const finalGuestCount = attending ? Number(guestCount) : 0;

    if (attending && (isNaN(finalGuestCount) || finalGuestCount < 1 || finalGuestCount > 20)) {
      setErrorMessage("Please enter a valid number of guests (between 1 and 20).");
      return;
    }

    if (!eventId) {
      setErrorMessage("Wedding event ID is not configured. Please contact the couple.");
      return;
    }

    setLoading(true);

    try {
      // Insert into Supabase public.rsvps table.
      // Note: Do not chain .select() to preserve insert-only anonymous RLS policies.
      const { error } = await supabase.from("rsvps").insert([
        {
          event_id: eventId,
          guest_name: guestName.trim(),
          contact: contact.trim() || null,
          attending: attending,
          guest_count: finalGuestCount,
          message: message.trim() || null,
        },
      ]);

      if (error) {
        throw error;
      }

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
    <section id="rsvp" className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl border border-gold/30 bg-white/95 p-6 shadow-[0_16px_45px_-18px_rgba(74,14,24,0.3)] sm:p-10"
      >
        {/* Section Header */}
        <div className="text-center">
          <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-gold">
            Join Our Celebration
          </p>
          <h2 className="mt-2 font-sans text-2xl font-bold tracking-[0.1em] uppercase text-maroon sm:text-3xl md:text-4xl">
            RSVP
          </h2>
          <div className="mt-4">
            <OrnamentalDivider />
          </div>
          <p className="mx-auto mt-4 max-w-lg font-sans text-sm italic text-ink/75 sm:text-base">
            Kindly respond by 1st November 2026 so we can celebrate this blessed occasion together.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-8 rounded-2xl border border-gold/40 bg-champagne/40 p-6 text-center sm:p-8"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-maroon text-gold-light shadow-md sm:h-16 sm:w-16">
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
              <h3 className="mt-4 font-sans text-xl font-bold uppercase tracking-wider text-maroon sm:text-2xl">
                Thank You!
              </h3>
              <p className="mt-2 font-sans text-sm italic text-ink/80 sm:text-base">
                Your RSVP response has been successfully received. We are so grateful for your love and warm wishes.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-6 rounded-full border border-maroon bg-transparent px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-widest text-maroon transition-all duration-300 hover:bg-maroon hover:text-ivory"
              >
                Submit Another Response
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5 sm:space-y-6">
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-red-300 bg-red-50 p-4 text-center font-sans text-xs font-medium text-red-800 sm:text-sm"
                >
                  {errorMessage}
                </motion.div>
              )}

              {/* Guest Name */}
              <div>
                <label htmlFor="guestName" className="block font-sans text-xs font-semibold uppercase tracking-widest text-maroon sm:text-sm">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="guestName"
                  type="text"
                  required
                  placeholder="e.g. Ruwan Perera"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gold/40 bg-ivory/50 px-4 py-3 font-sans text-sm text-ink placeholder-ink/40 transition-colors focus:border-maroon focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon"
                />
              </div>

              {/* Contact Information */}
              <div>
                <label htmlFor="contact" className="block font-sans text-xs font-semibold uppercase tracking-widest text-maroon sm:text-sm">
                  Contact Number or Email <span className="text-ink/40 font-normal lowercase">(optional)</span>
                </label>
                <input
                  id="contact"
                  type="text"
                  placeholder="e.g. +94 77 123 4567 or ruwan@example.com"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gold/40 bg-ivory/50 px-4 py-3 font-sans text-sm text-ink placeholder-ink/40 transition-colors focus:border-maroon focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon"
                />
              </div>

              {/* Attendance Selection */}
              <div>
                <label className="block font-sans text-xs font-semibold uppercase tracking-widest text-maroon sm:text-sm">
                  Will You Attend? <span className="text-red-600">*</span>
                </label>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setAttending(true)}
                    className={`flex items-center justify-center gap-2.5 rounded-xl border p-4 text-center transition-all ${
                      attending === true
                        ? "border-maroon bg-maroon text-ivory shadow-md"
                        : "border-gold/40 bg-ivory/40 text-maroon hover:border-gold hover:bg-ivory/80"
                    }`}
                  >
                    <span className="text-base">💍</span>
                    <span className="font-sans text-xs font-semibold uppercase tracking-wider sm:text-sm">
                      Yes, Joyfully Attending
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAttending(false);
                      setGuestCount(0);
                    }}
                    className={`flex items-center justify-center gap-2.5 rounded-xl border p-4 text-center transition-all ${
                      attending === false
                        ? "border-maroon bg-maroon text-ivory shadow-md"
                        : "border-gold/40 bg-ivory/40 text-maroon hover:border-gold hover:bg-ivory/80"
                    }`}
                  >
                    <span className="text-base">💌</span>
                    <span className="font-sans text-xs font-semibold uppercase tracking-wider sm:text-sm">
                      Regretfully Unable
                    </span>
                  </button>
                </div>
              </div>

              {/* Number of Guests (Only when attending is true) */}
              {attending === true && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label htmlFor="guestCount" className="block font-sans text-xs font-semibold uppercase tracking-widest text-maroon sm:text-sm">
                    Number of Guests Attending <span className="text-red-600">*</span>
                  </label>
                  <div className="mt-1.5 flex items-center gap-3">
                    <input
                      id="guestCount"
                      type="number"
                      min={1}
                      max={20}
                      required
                      value={guestCount}
                      onChange={(e) => setGuestCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                      className="w-28 rounded-xl border border-gold/40 bg-ivory/50 px-4 py-3 text-center font-sans text-base font-semibold text-ink transition-colors focus:border-maroon focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon"
                    />
                    <span className="font-sans text-xs italic text-ink/60 sm:text-sm">
                      (Including yourself, maximum 20 guests)
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Message to Couple */}
              <div>
                <label htmlFor="message" className="block font-sans text-xs font-semibold uppercase tracking-widest text-maroon sm:text-sm">
                  Warm Wishes or Note to the Couple <span className="text-ink/40 font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  id="message"
                  rows={3}
                  placeholder="Share a blessing, dietary request, or congratulatory note..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gold/40 bg-ivory/50 px-4 py-3 font-sans text-sm text-ink placeholder-ink/40 transition-colors focus:border-maroon focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 text-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="relative inline-flex w-full items-center justify-center overflow-hidden rounded-full border border-gold-light/60 bg-gradient-to-r from-maroon via-maroon-deep to-maroon px-8 py-3.5 font-sans text-xs font-semibold uppercase tracking-[0.25em] text-ivory shadow-[0_8px_22px_-4px_rgba(74,14,24,0.4)] transition-all duration-300 hover:border-gold hover:shadow-[0_12px_28px_-4px_rgba(74,14,24,0.5)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-12 sm:text-sm"
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
