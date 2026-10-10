"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import OrnamentalDivider from "./OrnamentalDivider";

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.14, delayChildren: 1.7 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 26, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

const sparkle = [
  { top: "18%", left: "22%", delay: 0.4, size: 5 },
  { top: "30%", left: "72%", delay: 1.3, size: 4 },
  { top: "10%", left: "55%", delay: 2.2, size: 6 },
  { top: "45%", left: "10%", delay: 0.9, size: 4 },
  { top: "55%", left: "86%", delay: 1.8, size: 5 },
];

function Letters({
  text,
  start,
  className,
}: {
  text: string;
  start: number;
  className?: string;
}) {
  return (
    <span className={className}>
      {text.split("").map((ch, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 20, rotateX: 90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 0.55,
            delay: start + i * 0.05,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

export default function HeroInvite() {
  const [showIntro, setShowIntro] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 1700);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="hero-full relative flex w-full items-center justify-center overflow-hidden bg-ivory px-3 py-3 sm:px-5 sm:py-5 md:px-8 md:py-6">
      {/* Elegant intro overlay - lifts away to reveal the invitation */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            key="intro"
            initial={{ clipPath: "inset(0 0 0% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ivory"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center px-6 text-center"
            >
              <p className="font-display text-[10px] tracking-[0.4em] text-gold uppercase">
                The Wedding Of
              </p>
              <h1 className="mt-4 whitespace-nowrap font-display text-[clamp(16px,4.8vw,20px)] sm:text-3xl tracking-[0.2em] sm:tracking-[0.25em] text-maroon font-bold uppercase">
                <Letters text="Dilanka" start={0.35} />{" "}
                <span className="text-gold font-normal">
                  <Letters text="&" start={0.65} />
                </span>{" "}
                <Letters text="Piyumi" start={0.85} />
              </h1>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.1 }}
                className="mt-4 opacity-70"
              >
                <OrnamentalDivider />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background: silk drape photo with slow Ken Burns drift */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 14, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Image
            src="/images/BackgroundImage.png"
            alt=""
            fill
            priority
            className="object-cover object-center"
          />
        </motion.div>
        {/* soft shimmer overlay */}
        <div
          className="absolute inset-0 animate-shimmer opacity-35"
          style={{
            backgroundImage:
              "linear-gradient(120deg, transparent 30%, rgba(212,185,124,0.35) 50%, transparent 70%)",
            backgroundSize: "200% 200%",
          }}
        />
        {/* subtle vignette for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(74,14,24,0.18)_100%)]" />
        <div className="absolute inset-0 bg-ivory/20" />
      </div>

      {/* Content Wrapper - centered as one balanced group */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex h-full w-full max-w-md flex-col items-center justify-center text-center gap-2 sm:gap-3 md:gap-4"
      >
        {/* TOP SECTION: Divider + Invitation Header */}
        <motion.div variants={fadeUp} className="flex w-full flex-col items-center pt-1 sm:pt-2">
          <OrnamentalDivider />

          <h2 className="mt-2 sm:mt-3 font-display text-[11px] sm:text-sm md:text-base tracking-[0.24em] sm:tracking-[0.3em] text-maroon font-semibold uppercase drop-shadow-[0_1px_2px_rgba(246,238,224,0.9)]">
            Together With Their Families
          </h2>

          <p className="mt-1 sm:mt-1.5 max-w-lg font-display text-[10px] sm:text-xs md:text-sm tracking-[0.2em] sm:tracking-[0.24em] text-gold font-medium uppercase">
            Request The Honour Of Your Presence
          </p>
        </motion.div>

        {/* MIDDLE SECTION: Center Couple Portrait - scales with screen */}
        <motion.div
          variants={fadeUp}
          className="relative flex w-full min-h-0 items-center justify-center"
        >
          {/* Soft Golden Radiance Aura behind couple */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-200/60 via-gold/15 to-transparent blur-2xl sm:blur-3xl animate-pulse pointer-events-none"
            style={{ animationDuration: '6s' }}
          />

          {/* Expanding golden halo rings */}
          <motion.div
            aria-hidden
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] aspect-square rounded-full border border-gold/30 pointer-events-none"
            initial={{ scale: 0.55, opacity: 0 }}
            animate={{ scale: 1.3, opacity: [0, 0.55, 0] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
          />
          <motion.div
            aria-hidden
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] aspect-square rounded-full border border-gold/25 pointer-events-none"
            initial={{ scale: 0.55, opacity: 0 }}
            animate={{ scale: 1.3, opacity: [0, 0.45, 0] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeOut", delay: 2.3 }}
          />

          {/* Floating golden sparkles */}
          {sparkle.map((s, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute rounded-full bg-gold-light pointer-events-none"
              style={{
                top: s.top,
                left: s.left,
                width: s.size,
                height: s.size,
                filter: "blur(0.5px)",
              }}
              animate={{ y: [0, -14, 0], opacity: [0.1, 0.85, 0.1] }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: s.delay,
              }}
            />
          ))}

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative h-[50vh] max-h-[54vh] w-full max-w-[340px] sm:h-[54vh] sm:max-w-[480px] md:h-[56vh] md:max-w-[540px] lg:h-[58vh] lg:max-w-[580px] landscape:h-[46vh]"
          >
            <Image
              src="/images/couple.png"
              alt="The couple"
              fill
              priority
              className="object-contain drop-shadow-[0_18px_35px_rgba(74,14,24,0.28)]"
            />
          </motion.div>
        </motion.div>

        {/* BOTTOM SECTION: Button */}
        <motion.div variants={fadeUp} className="flex w-full flex-col items-center pb-1 sm:pb-2">
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => router.push("/invitation")}
            className="relative mt-3 sm:mt-4 cursor-pointer overflow-hidden rounded-full border border-gold-light/70 bg-gradient-to-r from-maroon via-maroon-deep to-maroon px-7 py-2.5 sm:px-9 sm:py-3 font-sans text-[11px] sm:text-xs md:text-sm tracking-[0.22em] sm:tracking-[0.26em] text-ivory font-semibold uppercase shadow-[0_8px_22px_-3px_rgba(74,14,24,0.4),0_0_15px_rgba(212,185,124,0.25)] transition-all duration-300 hover:border-gold hover:shadow-[0_12px_28px_-3px_rgba(74,14,24,0.5),0_0_22px_rgba(212,185,124,0.4)]"
          >
            <span className="relative z-10">Open Invitation</span>
            {/* flowing shine sweep */}
            <motion.span
              aria-hidden
              className="absolute top-0 bottom-0 w-1/2 skew-x-[-20deg] bg-gradient-to-r from-transparent via-ivory/25 to-transparent"
              initial={{ x: "-160%" }}
              animate={{ x: "360%" }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.2,
              }}
            />
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
}
