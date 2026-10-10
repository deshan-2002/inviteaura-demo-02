"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useTransform, type Variants } from "framer-motion";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import RsvpForm from "@/components/RsvpForm";

const spring = { type: "spring", stiffness: 60, damping: 18, mass: 0.9 } as const;

const fadeUp = {
  hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: spring,
  },
};

const slideLeft = {
  hidden: { opacity: 0, x: -64 },
  visible: {
    opacity: 1,
    x: 0,
    transition: spring,
  },
};

const slideRight = {
  hidden: { opacity: 0, x: 64 },
  visible: {
    opacity: 1,
    x: 0,
    transition: spring,
  },
};

const flipIn = {
  hidden: { opacity: 0, rotateY: 18, y: 32 },
  visible: {
    opacity: 1,
    rotateY: 0,
    y: 0,
    transition: spring,
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: spring,
  },
};

const popIn = {
  hidden: { opacity: 0, scale: 0.5, y: 28 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 16 },
  },
};

const coupleReveal = {
  hidden: { opacity: 0, scale: 0.92, y: 48, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 55, damping: 17, mass: 0.9 },
  },
};

const avatarZoom = {
  hidden: { opacity: 0, scale: 0.4 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 180, damping: 15, delay: 0.15 },
  },
};

const WEDDING_DATE = "2026-12-02T09:30:00+05:30";

/* ---------------- Countdown ---------------- */
function useCountdown(target: string) {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    const tick = () =>
      setLeft(Math.max(0, new Date(target).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return {
    days: Math.floor(left / 86400000),
    hours: Math.floor((left % 86400000) / 3600000),
    minutes: Math.floor((left % 3600000) / 60000),
    seconds: Math.floor((left % 60000) / 1000),
  };
}

/* ---------------- Shared section heading ---------------- */
function SectionHeading({
  label,
  title,
  light = false,
}: {
  label: string;
  title: string;
  light?: boolean;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      variants={fadeUp}
      className="text-center"
    >
      <p
        className={`font-sans text-[10px] tracking-[0.35em] uppercase ${
          light ? "text-gold-light" : "text-gold"
        }`}
      >
        {label}
      </p>
      <h2
        className={`mt-2 font-sans text-2xl tracking-[0.1em] uppercase font-bold sm:text-3xl md:text-4xl ${
          light ? "text-ivory" : "text-maroon"
        }`}
      >
        {title}
      </h2>
      <div className="mt-5">
        <OrnamentalDivider />
      </div>
    </motion.div>
  );
}

/* ---------------- Card wrapper ---------------- */
function Card({
  children,
  className = "",
  variant = fadeUp,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: Variants;
  delay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={variant}
      transition={delay ? { delay } : undefined}
      className={`relative overflow-hidden rounded-3xl border border-gold/25 bg-white/95 p-6 shadow-[0_14px_40px_-16px_rgba(74,14,24,0.25)] transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-[0_22px_50px_-18px_rgba(74,14,24,0.35)] sm:p-8 ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ---------------- Data ---------------- */
const couple = {
  groom: {
    name: "Dilanka",
    parents: "The Groom",
    family: "Ratnapura, Sri Lanka",
  },
  bride: {
    name: "Piyumi",
    parents: "The Bride",
    family: "Ratnapura, Sri Lanka",
  },
};

const schedule = [
  {
    time: "9.30 AM",
    event: "Entrance",
    desc: "Welcoming of guests & families",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 sm:h-7 sm:w-7">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
      </svg>
    ),
  },
  {
    time: "9.51 AM",
    event: "Poruwa Ceremony",
    desc: "Auspicious traditional ceremony under the Poruwa",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 sm:h-7 sm:w-7">
        <path d="M3 22h18" />
        <path d="M6 18v-7" />
        <path d="M10 18v-7" />
        <path d="M14 18v-7" />
        <path d="M18 18v-7" />
        <path d="M3 11l9-8 9 8" />
      </svg>
    ),
  },
  {
    time: "12.00 PM",
    event: "Lunch",
    desc: "Celebratory wedding lunch & refreshments",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 sm:h-7 sm:w-7">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
        <path d="M7 2v20" />
        <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z" />
        <path d="M21 15v7" />
      </svg>
    ),
  },
  {
    time: "4.30 PM",
    event: "Farewell",
    desc: "Blessings, farewell & departure",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 sm:h-7 sm:w-7">
        <path d="M20 12v10H4V12" />
        <path d="M2 7h20v5H2z" />
        <path d="M12 22V7" />
        <path d="M12 7c-1.5 0-4-.5-4-3 0-1.5 1.5-2.5 3-2 1.2.4 1 1.5 1 3z" />
        <path d="M12 7c1.5 0 4-.5 4-3 0-1.5-1.5-2.5-3-2-1.2.4-1 1.5-1 3z" />
      </svg>
    ),
  },
];

const venues = [
  {
    name: "Silver Ray Grand",
    event: "Poruwa Ceremony & Lunch",
    address: "Colombo - Batticaloa Hwy, Pelmadulla, Ratnapura",
    query: "Silver+Ray+Grand+Pelmadulla",
    mapUrl: "https://maps.app.goo.gl/i7DtGi27LZ7A5wLX7",
  },
];

export default function InvitationPage() {
  const { days, hours, minutes, seconds } = useCountdown(WEDDING_DATE);

  /* Personalized guest from ?guest= query */
  const [guest, setGuest] = useState("Dear Guest");

  /* Back-to-top visibility */
  const [showTop, setShowTop] = useState(false);

  /* Scroll progress for hero parallax */
  const { scrollY } = useScroll();
  const { scrollYProgress: topProgress } = useScroll();
  const bgY = useTransform(scrollY, [0, 700], [0, 140]);

  /* Section background parallax */
  const countdownRef = useRef<HTMLElement>(null);
  const guestRef = useRef<HTMLElement>(null);
  const { scrollYProgress: countdownScroll } = useScroll({
    target: countdownRef,
    offset: ["start end", "end start"],
  });
  const { scrollYProgress: guestScroll } = useScroll({
    target: guestRef,
    offset: ["start end", "end start"],
  });
  const countdownBgY = useTransform(countdownScroll, [0, 1], ["-12%", "12%"]);
  const guestBgY = useTransform(guestScroll, [0, 1], ["-12%", "12%"]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const g = params.get("guest");
    if (g) setGuest(g);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="min-h-screen w-full bg-ivory text-ink">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-40 border-b border-gold/25 bg-ivory/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="font-sans text-[10px] tracking-[0.3em] uppercase text-maroon transition-colors hover:text-gold sm:text-xs"
          >
            &larr; Back
          </Link>
          <div className="flex items-center gap-4">
            <a
              href="#rsvp"
              className="rounded-full border border-maroon/30 bg-maroon/10 px-3 py-1 font-sans text-[10px] font-semibold tracking-[0.25em] uppercase text-maroon transition-all hover:bg-maroon hover:text-ivory sm:text-xs"
            >
              RSVP
            </a>
            <span className="font-sans text-[10px] tracking-[0.35em] uppercase text-gold sm:text-xs">
              D &amp; P
            </span>
          </div>
        </div>
      </header>

      {/* 1. HERO */}
      <section className="relative overflow-hidden">
        <motion.div style={{ y: bgY }} className="absolute -inset-y-40 inset-x-0">
          <Image
            src="/images/BackgroundImage.png"
            alt=""
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-maroon-deep/70 via-maroon-deep/45 to-ivory" />
        </motion.div>

        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-4 pb-24 pt-16 text-center sm:px-6 sm:pb-28 sm:pt-20">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-sans text-[11px] tracking-[0.4em] uppercase text-gold-light sm:text-sm"
          >
            The Wedding Of
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 whitespace-nowrap font-sans text-2xl tracking-[0.16em] text-ivory font-bold uppercase drop-shadow-[0_4px_14px_rgba(74,14,24,0.45)] sm:text-4xl md:text-5xl lg:text-[3.25rem]"
          >
            Dilanka <span className="text-gold-light font-normal">&amp;</span> Piyumi
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 font-sans text-base italic text-ivory/90 sm:text-xl"
          >
            Wednesday, 2nd December 2026 &middot; Ratnapura, Sri Lanka
          </motion.p>

          {/* scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="absolute bottom-8 flex flex-col items-center gap-2"
          >
            <span className="font-sans text-[9px] tracking-[0.35em] uppercase text-ivory/70">
              Scroll
            </span>
            <motion.span
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="block h-8 w-px bg-gradient-to-b from-ivory/80 to-transparent"
            />
          </motion.div>
        </div>
      </section>

      {/* 2. WELCOME MESSAGE */}
      <section className="mx-auto w-full max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
        >
          <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-gold">
            Welcome
          </p>
          <h2 className="mt-2 font-sans text-2xl tracking-[0.1em] uppercase text-maroon font-bold sm:text-3xl">
            Together With Our Families
          </h2>
          <div className="mt-5">
            <OrnamentalDivider />
          </div>
          <p className="mx-auto mt-8 max-w-xl font-sans text-base italic leading-relaxed text-ink/80 sm:text-lg">
            With hearts full of joy, together with our beloved families, we request the honour
            of your presence as we celebrate the beginning of our forever. Your blessings and
            presence will make our day truly complete.
          </p>
        </motion.div>
      </section>

      {/* 3. COUPLE INFORMATION */}
      <section className="border-y border-gold/20 bg-champagne/30 py-14 sm:py-20">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="flex flex-col items-center text-center"
          >
            {/* Small eyebrow only — no competing bold title */}
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.4em] text-gold">
              The Happy Couple
            </p>
            <div className="mt-3 h-px w-10 bg-gold/40" />

            {/* Names — the visual hero of this section */}
            <div className="mt-10 flex w-full flex-col items-center gap-6 sm:mt-12 sm:flex-row sm:justify-center sm:gap-12">
              {/* Groom */}
              <div className="text-center">
                <p className="font-sans text-[9px] font-medium uppercase tracking-[0.35em] text-ink/40">
                  The Groom
                </p>
                <h3 className="mt-3 font-display text-5xl font-bold text-maroon sm:text-6xl md:text-7xl">
                  {couple.groom.name}
                </h3>
                <p className="mt-2.5 font-sans text-[10px] uppercase tracking-[0.25em] text-ink/45">
                  {couple.groom.family}
                </p>
              </div>

              {/* & divider */}
              <div className="flex flex-col items-center">
                <div className="h-8 w-px bg-gold/30 sm:hidden" />
                <span className="my-1 font-display text-xl font-light text-gold/80 sm:my-0 sm:text-2xl">&amp;</span>
                <div className="h-8 w-px bg-gold/30 sm:hidden" />
              </div>

              {/* Bride */}
              <div className="text-center">
                <p className="font-sans text-[9px] font-medium uppercase tracking-[0.35em] text-ink/40">
                  The Bride
                </p>
                <h3 className="mt-3 font-display text-5xl font-bold text-maroon sm:text-6xl md:text-7xl">
                  {couple.bride.name}
                </h3>
                <p className="mt-2.5 font-sans text-[10px] uppercase tracking-[0.25em] text-ink/45">
                  {couple.bride.family}
                </p>
              </div>
            </div>

            {/* Bottom accent line */}
            <div className="mt-10 h-px w-16 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
          </motion.div>

        </div>
      </section>

      {/* 4. WEDDING DATE & TIME */}
      <section className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionHeading label="Save The Date" title="Wedding Date & Time" />

        <Card variant={scaleIn} className="mt-10 text-center sm:mt-12">
          <p className="font-sans text-sm tracking-[0.35em] uppercase text-gold">
            Wednesday
          </p>
          <p className="mt-3 font-sans text-4xl tracking-[0.08em] text-maroon font-bold sm:text-6xl">
            02
          </p>
          <p className="mt-2 font-sans text-lg tracking-[0.25em] uppercase text-maroon sm:text-xl">
            December &middot; 2026
          </p>
          <p className="mt-2 font-sans text-xs tracking-[0.2em] uppercase text-ink/60 sm:text-sm">
            9.30 AM &ndash; 4.30 PM
          </p>
        </Card>
      </section>

      {/* 5. COUNTDOWN */}
      <section ref={countdownRef} className="relative overflow-hidden py-14 sm:py-20">
        <motion.div style={{ y: countdownBgY }} className="absolute -inset-y-20 inset-x-0 scale-[1.15]">
          <Image
            src="/images/BackgroundImage.png"
            alt=""
            fill
            className="object-cover object-center"
          />
        </motion.div>
        <div className="absolute inset-0 bg-maroon-deep/80" />

        <div className="relative z-10 mx-auto w-full max-w-3xl px-4 sm:px-6">
          <SectionHeading light label="Counting Every Moment" title="The Big Day Is Near" />

        <motion.div
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          className="mt-10 grid grid-cols-4 gap-2 sm:gap-4"
        >
          {[
            { value: days, label: "Days" },
            { value: hours, label: "Hours" },
            { value: minutes, label: "Minutes" },
            { value: seconds, label: "Seconds" },
          ].map((unit) => (
            <motion.div
              key={unit.label}
              variants={popIn}
              className="flex flex-col items-center rounded-2xl border border-gold-light/40 bg-ivory/10 px-2 py-4 backdrop-blur-sm sm:py-6"
            >
                <span className="font-sans text-2xl font-semibold text-ivory tabular-nums sm:text-4xl">
                  {String(unit.value).padStart(2, "0")}
                </span>
                <span className="mt-1 font-sans text-[8px] font-medium tracking-[0.25em] uppercase text-gold-light sm:text-[10px]">
                  {unit.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 6. WEDDING VENUE */}
      <section className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionHeading label="Location" title="Wedding Venue" />

        <div className="mt-10 flex flex-col gap-4 sm:mt-12 sm:gap-6">
          {venues.map((venue, i) => (
            <Card key={venue.name} variant={i % 2 === 0 ? slideLeft : slideRight}>
              <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
                <div className="flex-1 text-center sm:text-left">
                  <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-gold sm:text-[11px]">
                    {venue.event}
                  </p>
                  <h3 className="mt-2 font-sans text-xl uppercase text-maroon font-bold sm:text-2xl">
                    {venue.name}
                  </h3>
                  <p className="mt-3 font-sans text-sm italic text-ink/70 sm:text-base">
                    {venue.address}
                  </p>
                  <a
                    href={venue.mapUrl || `https://www.google.com/maps/dir/?api=1&destination=${venue.query}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-block cursor-pointer rounded-full bg-gradient-to-r from-maroon via-maroon-deep to-maroon px-6 py-2.5 font-sans text-[10px] font-medium tracking-[0.25em] uppercase text-ivory shadow-[0_8px_20px_-4px_rgba(74,14,24,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-4px_rgba(74,14,24,0.5)] sm:text-[11px]"
                  >
                    Get Directions
                  </a>
                </div>

                <div className="h-48 w-full overflow-hidden rounded-2xl border border-gold/25 sm:h-auto sm:min-h-[220px] sm:w-72">
                  <iframe
                    title={`Map - ${venue.name}`}
                    src={`https://maps.google.com/maps?q=${venue.query}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    className="h-full w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 7. WEDDING SCHEDULE */}
      <section className="border-y border-gold/20 bg-champagne/50 py-14 sm:py-20">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
          <SectionHeading label="Plan Your Day" title="Wedding Schedule" />

          <div className="relative mt-12 flex flex-col sm:mt-14">
            <motion.span
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              className="absolute bottom-4 left-[27px] top-4 w-px origin-top bg-gradient-to-b from-gold/60 via-gold/40 to-gold/60 sm:left-[31px]"
            />
            {schedule.map((row, i) => (
              <motion.div
                key={row.event}
                variants={i % 2 === 0 ? slideLeft : slideRight}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
                transition={{ delay: i * 0.08 }}
                className="group relative flex gap-5 pb-7 last:pb-0 sm:gap-7"
              >
                <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-ivory text-gold shadow-[0_6px_18px_-6px_rgba(74,14,24,0.3)] transition-all duration-300 group-hover:scale-110 group-hover:border-gold group-hover:bg-gradient-to-br group-hover:from-maroon group-hover:to-maroon-deep group-hover:text-gold-light sm:h-16 sm:w-16">
                  {row.icon}
                </div>
                <div className="flex-1 rounded-2xl border border-gold/20 bg-white/95 p-5 shadow-[0_8px_22px_-12px_rgba(74,14,24,0.2)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-gold/40 group-hover:shadow-[0_14px_32px_-12px_rgba(74,14,24,0.35)] sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-sans text-lg font-semibold uppercase tracking-[0.08em] text-maroon sm:text-xl">
                        {row.event}
                      </h3>
                      <p className="mt-1.5 font-sans text-sm font-light text-ink/70 sm:text-base">
                        {row.desc}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-2xl border border-gold/30 bg-gradient-to-br from-maroon to-maroon-deep px-4 py-2.5 text-center shadow-[0_8px_18px_-8px_rgba(74,14,24,0.45)] sm:px-5">
                      <span className="block font-sans text-lg font-semibold leading-none text-gold-light sm:text-xl">
                        {row.time.split(" ")[0]}
                      </span>
                      <span className="mt-1.5 block font-sans text-[10px] font-medium tracking-[0.3em] uppercase text-ivory">
                        {row.time.split(" ")[1]}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* 10. PERSONALIZED GUEST SECTION */}
      <section ref={guestRef} className="relative overflow-hidden py-14 sm:py-20">
        <motion.div style={{ y: guestBgY }} className="absolute -inset-y-20 inset-x-0 scale-[1.15]">
          <Image
            src="/images/BackgroundImage.png"
            alt=""
            fill
            className="object-cover object-center"
          />
        </motion.div>
        <div className="absolute inset-0 bg-maroon-deep/75" />

        <div className="relative z-10 mx-auto w-full max-w-3xl px-4 text-center sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={fadeUp}
          >
            <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-gold-light">
              A Special Note For You
            </p>
            <h2 className="mt-4 font-sans text-2xl tracking-[0.08em] uppercase text-ivory font-bold sm:text-3xl">
              {guest},
            </h2>
            <p className="mx-auto mt-5 max-w-xl font-sans text-base italic leading-relaxed text-ivory/90 sm:text-lg">
              We&rsquo;re delighted to invite you to share in our joy. Your presence at our wedding
              will mean the world to us.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 11. CONTACT INFORMATION */}
      <section className="border-y border-gold/20 bg-champagne/50 py-14 sm:py-20">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
          <SectionHeading label="Reach Out To Us" title="Contact Information" />

          <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6">
            <Card variant={slideLeft} className="text-center">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 font-sans text-[10px] font-medium tracking-[0.25em] uppercase text-gold">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  The Groom
                </span>
                <span className="font-sans text-xs font-light text-ink/50">0703225632</span>
              </div>
              <h3 className="mt-4 font-sans text-xl font-semibold uppercase text-maroon sm:text-2xl">
                {couple.groom.name}
              </h3>
              <div className="mt-5 flex justify-center gap-3">
                <a
                  href="tel:0703225632"
                  className="group flex flex-1 items-center justify-center gap-2 rounded-xl border border-gold/40 bg-ivory/80 px-4 py-3 font-sans text-[10px] font-medium tracking-[0.2em] uppercase text-maroon shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-maroon hover:bg-maroon hover:text-ivory hover:shadow-lg"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12"
                    aria-hidden="true"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Call
                </a>
                <a
                  href="https://wa.me/94703225632"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-1 items-center justify-center gap-2 rounded-xl border border-gold/40 bg-ivory/80 px-4 py-3 font-sans text-[10px] font-medium tracking-[0.2em] uppercase text-maroon shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#25D366] hover:bg-[#25D366] hover:text-white hover:shadow-lg"
                >
                  <svg
                    viewBox="0 0 32 32"
                    fill="currentColor"
                    className="h-4 w-4 transition-transform duration-300 group-hover:scale-110"
                    aria-hidden="true"
                  >
                    <path d="M16.004 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.59 4.46 1.71 6.4L3.2 28.8l6.56-1.68c1.87 1.02 3.98 1.56 6.24 1.56h.01c7.06 0 12.79-5.74 12.79-12.8 0-3.42-1.33-6.63-3.75-9.05a12.72 12.72 0 0 0-9.05-3.63zm0 2.4c2.79 0 5.41 1.09 7.38 3.06a10.38 10.38 0 0 1 3.06 7.39c0 5.73-4.67 10.4-10.4 10.4-1.85 0-3.66-.49-5.25-1.42l-.38-.22-3.89 1 1.04-3.79-.25-.39a10.34 10.34 0 0 1-1.58-5.51c0-5.73 4.67-10.4 10.4-10.4zm-5.66 5.99c-.19 0-.49.07-.75.35-.26.28-1 .98-1 2.38 0 1.41 1.02 2.76 1.17 2.95.14.19 1.99 3.04 4.82 4.26.67.29 1.2.47 1.61.6.67.22 1.29.19 1.77.11.54-.08 1.67-.68 1.9-1.34.24-.66.24-1.22.17-1.34-.07-.12-.26-.19-.54-.33-.28-.14-1.67-.82-1.93-.92-.26-.09-.45-.14-.64.14-.19.28-.74.92-.9 1.11-.17.19-.33.21-.61.07-.28-.14-1.19-.44-2.27-1.4-.84-.75-1.4-1.68-1.57-1.96-.17-.28-.02-.43.13-.57.13-.13.28-.33.42-.5.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.63-1.51-.86-2.07-.22-.54-.45-.47-.62-.48-.16-.01-.34-.01-.53-.01z" />
                  </svg>
                  WhatsApp
                </a>
              </div>
            </Card>

            <Card variant={slideRight} className="text-center">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 font-sans text-[10px] font-medium tracking-[0.25em] uppercase text-gold">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  The Bride
                </span>
                <span className="font-sans text-xs font-light text-ink/50">0703225638</span>
              </div>
              <h3 className="mt-4 font-sans text-xl font-semibold uppercase text-maroon sm:text-2xl">
                {couple.bride.name}
              </h3>
              <div className="mt-5 flex justify-center gap-3">
                <a
                  href="tel:0703225638"
                  className="group flex flex-1 items-center justify-center gap-2 rounded-xl border border-gold/40 bg-ivory/80 px-4 py-3 font-sans text-[10px] font-medium tracking-[0.2em] uppercase text-maroon shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-maroon hover:bg-maroon hover:text-ivory hover:shadow-lg"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12"
                    aria-hidden="true"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Call
                </a>
                <a
                  href="https://wa.me/94703225638"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-1 items-center justify-center gap-2 rounded-xl border border-gold/40 bg-ivory/80 px-4 py-3 font-sans text-[10px] font-medium tracking-[0.2em] uppercase text-maroon shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#25D366] hover:bg-[#25D366] hover:text-white hover:shadow-lg"
                >
                  <svg
                    viewBox="0 0 32 32"
                    fill="currentColor"
                    className="h-4 w-4 transition-transform duration-300 group-hover:scale-110"
                    aria-hidden="true"
                  >
                    <path d="M16.004 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.59 4.46 1.71 6.4L3.2 28.8l6.56-1.68c1.87 1.02 3.98 1.56 6.24 1.56h.01c7.06 0 12.79-5.74 12.79-12.8 0-3.42-1.33-6.63-3.75-9.05a12.72 12.72 0 0 0-9.05-3.63zm0 2.4c2.79 0 5.41 1.09 7.38 3.06a10.38 10.38 0 0 1 3.06 7.39c0 5.73-4.67 10.4-10.4 10.4-1.85 0-3.66-.49-5.25-1.42l-.38-.22-3.89 1 1.04-3.79-.25-.39a10.34 10.34 0 0 1-1.58-5.51c0-5.73 4.67-10.4 10.4-10.4zm-5.66 5.99c-.19 0-.49.07-.75.35-.26.28-1 .98-1 2.38 0 1.41 1.02 2.76 1.17 2.95.14.19 1.99 3.04 4.82 4.26.67.29 1.2.47 1.61.6.67.22 1.29.19 1.77.11.54-.08 1.67-.68 1.9-1.34.24-.66.24-1.22.17-1.34-.07-.12-.26-.19-.54-.33-.28-.14-1.67-.82-1.93-.92-.26-.09-.45-.14-.64.14-.19.28-.74.92-.9 1.11-.17.19-.33.21-.61.07-.28-.14-1.19-.44-2.27-1.4-.84-.75-1.4-1.68-1.57-1.96-.17-.28-.02-.43.13-.57.13-.13.28-.33.42-.5.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.63-1.51-.86-2.07-.22-.54-.45-.47-.62-.48-.16-.01-.34-.01-.53-.01z" />
                  </svg>
                  WhatsApp
                </a>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 14. RSVP FORM */}
      <RsvpForm />

      {/* 15. FOOTER */}
      <footer className="relative overflow-hidden bg-maroon-deep py-14 text-center">
        <div className="absolute inset-0 opacity-10">
          <Image
            src="/images/BackgroundImage.png"
            alt=""
            fill
            className="object-cover"
          />
        </div>
        <div className="relative z-10 px-4">
          <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-gold-light">
            Thank You
          </p>
          <h2 className="mt-3 font-display text-2xl tracking-[0.14em] uppercase text-ivory font-bold sm:text-3xl">
            We Can&rsquo;t Wait To Celebrate With You
          </h2>
          <div className="mx-auto mt-6 max-w-[220px]">
            <OrnamentalDivider />
          </div>
          <p className="mt-6 font-body text-lg italic text-ivory/80">With Love,</p>
          <p className="mt-2 font-display text-xl tracking-[0.2em] uppercase text-gold-light sm:text-2xl">
            Dilanka <span className="font-body italic font-normal text-ivory px-1">&amp;</span> Piyumi
          </p>
          <p className="mt-4 font-sans text-[9px] tracking-[0.35em] uppercase text-ivory/50">
            02 &middot; 12 &middot; 2026 &mdash; Ratnapura, Sri Lanka
          </p>
        </div>
      </footer>

      {/* Back to top */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={scrollToTop}
            aria-label="Back to top"
            className="fixed bottom-4 right-4 z-40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/40 bg-gradient-to-br from-maroon/75 to-maroon-deep/75 shadow-[0_8px_24px_-6px_rgba(74,14,24,0.5)] backdrop-blur-xl transition-all duration-300 hover:border-gold-light sm:bottom-6 sm:right-6 sm:h-14 sm:w-14"
          >
            <svg viewBox="0 0 56 56" className="pointer-events-none absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
              <circle
                cx="28"
                cy="28"
                r="25"
                fill="none"
                strokeWidth="2.5"
                className="stroke-white/15"
              />
              <motion.circle
                cx="28"
                cy="28"
                r="25"
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="stroke-gold-light"
                style={{ pathLength: topProgress }}
              />
            </svg>
            <motion.span
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-gold-light sm:h-5 sm:w-5"
                aria-hidden="true"
              >
                <path d="M12 19V5" />
                <path d="M5 12l7-7 7 7" />
              </svg>
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
