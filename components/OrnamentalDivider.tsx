"use client";

import { motion } from "framer-motion";

export default function OrnamentalDivider() {
  return (
    <motion.svg
      width="220"
      height="24"
      viewBox="0 0 220 24"
      fill="none"
      className="mx-auto w-44 sm:w-56"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* left line */}
      <motion.line
        x1="10"
        y1="12"
        x2="90"
        y2="12"
        stroke="#B4913F"
        strokeWidth="1.2"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: {
            pathLength: 1,
            opacity: 1,
            transition: { duration: 0.9, ease: "easeInOut" },
          },
        }}
      />
      {/* left diamond dot */}
      <motion.polygon
        points="10,12 13,9 16,12 13,15"
        fill="#B4913F"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 0.4, delay: 0.5 } },
        }}
      />
      {/* right line */}
      <motion.line
        x1="130"
        y1="12"
        x2="210"
        y2="12"
        stroke="#B4913F"
        strokeWidth="1.2"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: {
            pathLength: 1,
            opacity: 1,
            transition: { duration: 0.9, ease: "easeInOut" },
          },
        }}
      />
      {/* right diamond dot */}
      <motion.polygon
        points="210,12 207,9 204,12 207,15"
        fill="#B4913F"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 0.4, delay: 0.5 } },
        }}
      />
      {/* center ornament outer circle */}
      <motion.circle
        cx="110"
        cy="12"
        r="7.5"
        stroke="#B4913F"
        strokeWidth="1.2"
        variants={{
          hidden: { scale: 0, opacity: 0 },
          visible: {
            scale: 1,
            opacity: 1,
            transition: { duration: 0.5, delay: 0.7, ease: "easeOut" },
          },
        }}
      />
      {/* center ornament inner dot */}
      <motion.circle
        cx="110"
        cy="12"
        r="2.5"
        fill="#B4913F"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 0.4, delay: 1 } },
        }}
      />
    </motion.svg>
  );
}
