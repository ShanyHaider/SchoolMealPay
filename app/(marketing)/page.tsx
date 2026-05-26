"use client";

import Footer from "@/app/(marketing)/_components/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CTASection } from "@/components/landing/CTASection";
import { PricingSection } from "@/components/PricingSection";

export default function LandingPage() {
  return (
    <>
      <main className="overflow-hidden bg-(--bg-primary) text-(--text-primary)">
        <HeroSection />

        <section className="px-4 py-24  sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <div className="mb-4 inline-flex rounded-full border border-(--border-primary) bg-(--bg-secondary) px-4 py-1.5 text-xs font-medium text-(--text-secondary)">
                Built for modern school cafeterias
              </div>

              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Everything your cafeteria needs
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-(--text-secondary) sm:text-base">
                Streamlined operations for parents, students, school admins, and
                canteen staff — all in one connected platform.
              </p>
            </div>

            <FeatureGrid />
          </div>
        </section>

        <HowItWorks />

        <PricingSection />

        <CTASection />

        <Footer />
      </main>
    </>
  );
}
