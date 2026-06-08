"use client";

import React from "react";

import {
  QrCode,
  ShoppingBag,
  ShieldCheck,
  Activity,
  BellRing,
  BarChart3,
} from "lucide-react";

import { BentoFeatureCard } from "./BentoFeatureCard";

const FEATURES = [
  {
    title: "QR Code Pickup",
    description:
      "Students scan and collect meals instantly without queues or printed slips.",
    icon: QrCode,
  },
  {
    title: "Order Ahead",
    description:
      "Parents can pre-order meals up to 7 days in advance to reduce waste and wait times.",
    icon: ShoppingBag,
  },
  {
    title: "Nutrition Tracking",
    description:
      "Track calories, allergens, proteins, and meal history with detailed insights.",
    icon: Activity,
  },
  {
    title: "Parental Controls",
    description:
      "Set spending limits, restrict menu items, and receive live notifications.",
    icon: ShieldCheck,
  },
  {
    title: "Real-time Updates",
    description:
      "Instant updates when meals are prepared, collected, or modified.",
    icon: BellRing,
  },
  {
    title: "Analytics Dashboard",
    description:
      "Operational insights and analytics for schools and canteen management.",
    icon: BarChart3,
  },
];

export function FeatureGrid() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {FEATURES.map((feature) => (
        <BentoFeatureCard key={feature.title} {...feature} />
      ))}
    </div>
  );
}
