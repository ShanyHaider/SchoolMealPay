"use client";

import React from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { ArrowRight, Play, Sparkles } from "lucide-react";

import { PhoneMockup } from "./PhoneMockup";
import { StatsStrip } from "./StatsStrip";

export function HeroSection() {
  // Container variants with strict typing to cascade animations downwards
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  // Child element variants with fixed literal typing for 'ease'
  const childVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <section className="relative overflow-hidden pb-24 pt-35 lg:pt-40">
      {/* Background Ambient Glows */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      {/* Main Centered Wrapper */}
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 xl:px-8">
        <motion.div
          className="flex flex-col items-center text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Announcement Badge */}
          <motion.div
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-(--border-primary) bg-(--bg-secondary) px-4 py-2 text-xs font-medium text-(--text-secondary) shadow-sm"
            variants={childVariants}
          >
            <Sparkles size={14} className="text-emerald-500" />
            Now live — Transform your school canteen
          </motion.div>

          {/* Epic Centered Headline */}
          <motion.h1
            className="text-4xl font-black tracking-tighter sm:text-5xl md:text-6xl lg:text-6xl"
            variants={childVariants}
          >
            <span className="block">Order meals.</span>
            <span className="block">Skip the lines.</span>
            <span className="block bg-linear-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
              Track everything.
            </span>
          </motion.h1>

          {/* Balanced Subtitle paragraph */}
          <motion.p
            className="mt-7 max-w-2xl text-base leading-8 text-(--text-secondary) sm:text-lg"
            variants={childVariants}
          >
            SchoolMealPay brings parents, schools, and canteen staff together
            into one seamless platform with QR pickup, nutrition tracking, and
            real-time meal updates.
          </motion.p>

          {/* Call To Actions */}
          <motion.div
            className="mt-10 flex flex-col gap-4 sm:flex-row w-full sm:w-auto"
            variants={childVariants}
          >
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-(--text-primary) px-7 py-3 text-sm font-semibold text-(--bg-primary) transition-all hover:scale-[1.02]"
            >
              Get started free
              <ArrowRight size={16} />
            </Link>

            <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-(--border-primary) bg-(--bg-secondary) px-7 py-3 text-sm font-semibold text-(--text-primary) transition-colors hover:bg-(--bg-tertiary)">
              <Play size={15} strokeWidth={2.5} />
              Watch demo
            </button>
          </motion.div>

          {/* Fully Responsive Centered Stats Layout */}
          <motion.div className="w-full" variants={childVariants}>
            <StatsStrip />
          </motion.div>

          {/* Fluid Theme-Adaptive Phone Mockup */}
          <motion.div
            className="mt-20 w-full max-w-md"
            variants={childVariants}
          >
            <PhoneMockup />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
