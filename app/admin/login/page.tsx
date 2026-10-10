"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import OrnamentalDivider from "@/components/OrnamentalDivider";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialChecking, setInitialChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          router.replace("/admin/dashboard");
          return;
        }
      } catch {
        // Continue to show login form
      } finally {
        setInitialChecking(false);
      }
    }
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        router.push("/admin/dashboard");
      }
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setErrorMessage(
        errObj?.message || "Invalid login credentials. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-maroon border-t-transparent" />
          <p className="font-sans text-xs uppercase tracking-widest text-maroon">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell flex min-h-screen flex-col items-center justify-center bg-ivory px-4 py-12 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md overflow-hidden rounded-3xl border border-gold/30 bg-white/95 p-6 min-[400px]:p-8 shadow-[0_18px_50px_-20px_rgba(74,14,24,0.3)] sm:p-10"
      >
        {/* Header */}
        <div className="text-center">
          <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-gold">
            Administrative Portal
          </p>
          <h1 className="mt-2 font-sans text-admin-title-lg font-bold uppercase tracking-[0.1em] text-maroon">
            Admin Sign In
          </h1>
          <div className="mt-4">
            <OrnamentalDivider />
          </div>
          <p className="mt-3 font-sans text-xs italic text-ink/70">
            For Developer and Event Owner access only
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-xl border border-red-300 bg-red-50 p-3.5 text-center font-sans text-xs font-medium text-red-800"
          >
            {errorMessage}
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block font-sans text-admin-small font-semibold uppercase tracking-widest text-maroon"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gold/40 bg-ivory/50 px-4 py-3 font-sans text-admin-body text-ink placeholder-ink/40 transition-colors focus:border-maroon focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block font-sans text-admin-small font-semibold uppercase tracking-widest text-maroon"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gold/40 bg-ivory/50 px-4 py-3 font-sans text-admin-body text-ink placeholder-ink/40 transition-colors focus:border-maroon focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="relative mt-2 inline-flex w-full items-center justify-center overflow-hidden rounded-full border border-gold-light/60 bg-gradient-to-r from-maroon via-maroon-deep to-maroon px-8 py-3.5 font-sans text-xs font-semibold uppercase tracking-[0.25em] text-ivory shadow-[0_8px_20px_-4px_rgba(74,14,24,0.4)] transition-all duration-300 hover:border-gold hover:shadow-[0_12px_28px_-4px_rgba(74,14,24,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
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
                Authenticating...
              </span>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            href="/invitation"
            className="font-sans text-xs font-medium text-gold transition-colors hover:text-maroon hover:underline"
          >
            &larr; Return to Wedding Invitation
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
