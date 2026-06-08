"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

// ─── Fade up on scroll ────────────────────────────────────────────
export function Reveal({
  children,
  delay = 0,
  className,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── Staggered children ───────────────────────────────────────────
export function StaggerGroup({
  children,
  className,
  style,
  stagger = 0.08,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  stagger?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── Horizontal slide ─────────────────────────────────────────────
export function SlideIn({
  children,
  from = "left",
  delay = 0,
  className,
  style,
}: {
  children: React.ReactNode;
  from?: "left" | "right";
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: from === "left" ? -40 : 40 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── Scale in ─────────────────────────────────────────────────────
export function ScaleIn({
  children,
  delay = 0,
  className,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── Marquee label ────────────────────────────────────────────────
export function EyebrowLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em]"
      style={{ color: "var(--text-muted)" }}
    >
      <span
        className="inline-block w-5 h-px"
        style={{ background: "var(--text-muted)" }}
      />
      {children}
      <span
        className="inline-block w-5 h-px"
        style={{ background: "var(--text-muted)" }}
      />
    </span>
  );
}

// ─── Display heading ──────────────────────────────────────────────
export function DisplayHeading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={`font-normal leading-[1.05] tracking-[-0.03em] ${className ?? ""}`}
      style={{
        fontFamily: "'Instrument Serif', serif",
        color: "var(--text-primary)",
      }}
    >
      {children}
    </h1>
  );
}

// ─── Horizontal rule with label ───────────────────────────────────
export function RuleLabel({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="flex-1"
        style={{ height: 1, background: "var(--divider)" }}
      />
      {children && (
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          {children}
        </span>
      )}
      <div
        className="flex-1"
        style={{ height: 1, background: "var(--divider)" }}
      />
    </div>
  );
}

export function FadeIn({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      {children}
    </motion.div>
  );
}
