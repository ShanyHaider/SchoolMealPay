"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/Components/ThemeProvider";
import Footer from "@/Components/Footer";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export default function LandingPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero__container">
          <motion.div
            className="hero__content"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            {/* Animated badge */}
            <motion.div className="hero__badge" variants={fadeInUp}>
              <span className="hero__badge-dot"></span>
              <span className="hero__badge-text">
                Now live — Transform your school canteen
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.h1 className="hero__title" variants={fadeInUp}>
              Order meals. Skip the lines. <br />
              <span className="hero__title-accent">Track everything.</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p className="hero__subtitle" variants={fadeInUp}>
              SchoolMealPay brings parents, schools, and canteen staff together
              on one platform. Pre-order meals, manage nutrition, control
              spending — all with QR-code pickup.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div className="hero__ctas" variants={fadeInUp}>
              <Link href="/sign-up" className="hero__cta hero__cta--primary">
                Get started free
              </Link>
              <button className="hero__cta hero__cta--secondary">
                Watch demo
              </button>
            </motion.div>

            {/* Social proof */}
            <motion.div className="hero__stats" variants={fadeInUp}>
              <div className="hero__stat">
                <div className="hero__stat-value">5,000+</div>
                <div className="hero__stat-label">Students served</div>
              </div>
              <div className="hero__stat-divider"></div>
              <div className="hero__stat">
                <div className="hero__stat-value">50+</div>
                <div className="hero__stat-label">Schools live</div>
              </div>
              <div className="hero__stat-divider"></div>
              <div className="hero__stat">
                <div className="hero__stat-value">4.9★</div>
                <div className="hero__stat-label">Average rating</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            className="hero__visual"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="hero__phone-frame">
              <div className="hero__phone-screen">
                {/* Phone notch */}
                <div className="hero__phone-notch-bar">
                  <div className="hero__phone-notch"></div>
                </div>

                {/* App header */}
                <div className="hero__app-header">
                  <span className="hero__app-greeting">Good morning 👋</span>
                  <span className="hero__app-name">SchoolMealPay</span>
                </div>

                {/* Today's menu card */}
                <div className="hero__app-card">
                  <div className="hero__app-card-label">Today's Order</div>
                  <div className="hero__app-meal">
                    <div className="hero__app-meal-icon">🍱</div>
                    <div className="hero__app-meal-info">
                      <div className="hero__app-meal-name">
                        Grilled Chicken Rice
                      </div>
                      <div className="hero__app-meal-meta">
                        520 cal · Protein 38g
                      </div>
                    </div>
                    <div className="hero__app-meal-status">Ready</div>
                  </div>
                </div>

                {/* QR code area */}
                <div className="hero__app-qr-section">
                  <div className="hero__app-qr-label">Scan to collect</div>
                  <div className="hero__app-qr">
                    <svg viewBox="0 0 60 60" width="64" height="64">
                      {/* QR pattern */}
                      <rect
                        x="2"
                        y="2"
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <rect
                        x="6"
                        y="6"
                        width="12"
                        height="12"
                        fill="currentColor"
                      />
                      <rect
                        x="38"
                        y="2"
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <rect
                        x="42"
                        y="6"
                        width="12"
                        height="12"
                        fill="currentColor"
                      />
                      <rect
                        x="2"
                        y="38"
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <rect
                        x="6"
                        y="42"
                        width="12"
                        height="12"
                        fill="currentColor"
                      />
                      {/* dots */}
                      <rect
                        x="26"
                        y="2"
                        width="6"
                        height="6"
                        fill="currentColor"
                      />
                      <rect
                        x="34"
                        y="2"
                        width="4"
                        height="4"
                        fill="currentColor"
                      />
                      <rect
                        x="26"
                        y="10"
                        width="4"
                        height="4"
                        fill="currentColor"
                      />
                      <rect
                        x="32"
                        y="10"
                        width="6"
                        height="6"
                        fill="currentColor"
                      />
                      <rect
                        x="26"
                        y="26"
                        width="8"
                        height="8"
                        fill="currentColor"
                      />
                      <rect
                        x="36"
                        y="26"
                        width="6"
                        height="6"
                        fill="currentColor"
                      />
                      <rect
                        x="44"
                        y="26"
                        width="4"
                        height="4"
                        fill="currentColor"
                      />
                      <rect
                        x="50"
                        y="26"
                        width="8"
                        height="8"
                        fill="currentColor"
                      />
                      <rect
                        x="26"
                        y="36"
                        width="4"
                        height="4"
                        fill="currentColor"
                      />
                      <rect
                        x="32"
                        y="36"
                        width="6"
                        height="6"
                        fill="currentColor"
                      />
                      <rect
                        x="40"
                        y="36"
                        width="4"
                        height="4"
                        fill="currentColor"
                      />
                      <rect
                        x="26"
                        y="44"
                        width="6"
                        height="6"
                        fill="currentColor"
                      />
                      <rect
                        x="34"
                        y="42"
                        width="4"
                        height="8"
                        fill="currentColor"
                      />
                      <rect
                        x="40"
                        y="42"
                        width="8"
                        height="4"
                        fill="currentColor"
                      />
                      <rect
                        x="50"
                        y="42"
                        width="8"
                        height="4"
                        fill="currentColor"
                      />
                      <rect
                        x="50"
                        y="48"
                        width="8"
                        height="8"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </div>

                {/* Bottom balance */}
                <div className="hero__app-balance">
                  <span className="hero__app-balance-label">
                    Wallet balance
                  </span>
                  <span className="hero__app-balance-amount">$24.50</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Animated gradient orb background */}
        <div className="hero__bg-orb hero__bg-orb--1"></div>
        <div className="hero__bg-orb hero__bg-orb--2"></div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features__container">
          <motion.div
            className="features__header"
            initial="initial"
            whileInView="animate"
            variants={staggerContainer}
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.h2 className="features__title" variants={fadeInUp}>
              Built for everyone
            </motion.h2>
            <motion.p className="features__subtitle" variants={fadeInUp}>
              Streamlined workflows for parents, schools, and canteen staff
            </motion.p>
          </motion.div>

          <motion.div
            className="features__grid"
            initial="initial"
            whileInView="animate"
            variants={staggerContainer}
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div className="feature-card" variants={fadeInUp}>
              <div className="feature-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <circle cx="17" cy="17" r="3.5" />
                </svg>
              </div>
              <h3 className="feature-card__title">QR Code Pickup</h3>
              <p className="feature-card__description">
                No more lines or lost meal slips. Students scan a QR code and
                collect instantly.
              </p>
            </motion.div>

            <motion.div className="feature-card" variants={fadeInUp}>
              <div className="feature-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </div>
              <h3 className="feature-card__title">Order Ahead</h3>
              <p className="feature-card__description">
                Parents order meals up to 7 days in advance. Reduce waste and
                wait times.
              </p>
            </motion.div>

            <motion.div className="feature-card" variants={fadeInUp}>
              <div className="feature-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2v20m10-10H2" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <h3 className="feature-card__title">Nutrition Tracking</h3>
              <p className="feature-card__description">
                Full nutrition details for every meal. Track intake and get
                personalized insights.
              </p>
            </motion.div>

            <motion.div className="feature-card" variants={fadeInUp}>
              <div className="feature-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <h3 className="feature-card__title">Parental Controls</h3>
              <p className="feature-card__description">
                Set spending limits, block items, get real-time notifications.
                Complete visibility.
              </p>
            </motion.div>

            <motion.div className="feature-card" variants={fadeInUp}>
              <div className="feature-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18.364 5.636l-3.536 3.536M9.172 9.172L5.636 5.636M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="feature-card__title">Real-time Updates</h3>
              <p className="feature-card__description">
                Instant notifications for orders, payments, and meal readiness.
                Stay informed.
              </p>
            </motion.div>

            <motion.div className="feature-card" variants={fadeInUp}>
              <div className="feature-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </div>
              <h3 className="feature-card__title">Analytics Dashboard</h3>
              <p className="feature-card__description">
                Schools get sales, nutrition, and inventory insights for
                data-driven decisions.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="how-it-works__container">
          <motion.h2
            className="how-it-works__title"
            initial="initial"
            whileInView="animate"
            variants={fadeInUp}
            viewport={{ once: true }}
          >
            How it works
          </motion.h2>

          <motion.div
            className="steps"
            initial="initial"
            whileInView="animate"
            variants={staggerContainer}
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* Step 1 */}
            <motion.div className="step" variants={fadeInUp}>
              <div className="step__number">1</div>
              <h3 className="step__title">Parent orders</h3>
              <p className="step__description">
                Browse today's menu with full nutrition info and order meals up
                to 7 days ahead. Set spending limits and get instant
                confirmation.
              </p>
            </motion.div>

            {/* Down Arrow */}
            <motion.div className="steps__arrow" variants={fadeInUp}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 5v14M5 12l7 7 7-7" strokeWidth={2} />
              </svg>
            </motion.div>

            {/* Step 2 */}
            <motion.div className="step" variants={fadeInUp}>
              <div className="step__number">2</div>
              <h3 className="step__title">Canteen prepares</h3>
              <p className="step__description">
                Staff see incoming orders in real-time with alerts for dietary
                restrictions. No more confusion or wasted food.
              </p>
            </motion.div>

            {/* Down Arrow */}
            <motion.div className="steps__arrow" variants={fadeInUp}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 5v14M5 12l7 7 7-7" strokeWidth={2} />
              </svg>
            </motion.div>

            {/* Step 3 */}
            <motion.div className="step" variants={fadeInUp}>
              <div className="step__number">3</div>
              <h3 className="step__title">Student collects</h3>
              <p className="step__description">
                Scan QR code, verify identity, collect meal in seconds. No
                lines. No waiting. No lost slips.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing">
        <div className="pricing__container">
          <motion.div
            className="pricing__header"
            initial="initial"
            whileInView="animate"
            variants={staggerContainer}
            viewport={{ once: true }}
          >
            <motion.h2 className="pricing__title" variants={fadeInUp}>
              Simple, transparent pricing
            </motion.h2>
            <motion.p className="pricing__subtitle" variants={fadeInUp}>
              Start free. Upgrade when you're ready. No hidden fees.
            </motion.p>
          </motion.div>

          <motion.div
            className="pricing__grid"
            initial="initial"
            whileInView="animate"
            variants={staggerContainer}
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* Free Tier */}
            <motion.div className="pricing-card" variants={fadeInUp}>
              <div className="pricing-card__header">
                <h3 className="pricing-card__name">Free</h3>
                <p className="pricing-card__description">For small schools</p>
              </div>
              <div className="pricing-card__price">
                <span className="pricing-card__amount">$0</span>
                <span className="pricing-card__period">/month</span>
              </div>
              <ul className="pricing-card__features">
                <li className="pricing-card__feature">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                  </svg>
                  <span>Up to 50 students</span>
                </li>
                <li className="pricing-card__feature">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                  </svg>
                  <span>Menu management</span>
                </li>
                <li className="pricing-card__feature">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                  </svg>
                  <span>QR code pickup</span>
                </li>
                <li className="pricing-card__feature pricing-card__feature--disabled">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.4L17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z" />
                  </svg>
                  <span>AI nutrition tracking</span>
                </li>
              </ul>
              <button className="pricing-card__cta pricing-card__cta--secondary">
                Get started
              </button>
            </motion.div>

            {/* Premium Tier */}
            <motion.div
              className="pricing-card pricing-card--featured"
              variants={fadeInUp}
            >
              <div className="pricing-card__badge">Most Popular</div>
              <div className="pricing-card__header">
                <h3 className="pricing-card__name">Premium</h3>
                <p className="pricing-card__description">For growing schools</p>
              </div>
              <div className="pricing-card__price">
                <span className="pricing-card__amount">$49</span>
                <span className="pricing-card__period">/month</span>
              </div>
              <ul className="pricing-card__features">
                <li className="pricing-card__feature">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                  </svg>
                  <span>Unlimited students</span>
                </li>
                <li className="pricing-card__feature">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                  </svg>
                  <span>All Free features</span>
                </li>
                <li className="pricing-card__feature">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                  </svg>
                  <span>AI nutrition tracking</span>
                </li>
                <li className="pricing-card__feature">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                  </svg>
                  <span>Advanced analytics</span>
                </li>
              </ul>
              <button className="pricing-card__cta pricing-card__cta--primary">
                Start free trial
              </button>
            </motion.div>

            {/* Parent Pro Tier */}
            <motion.div className="pricing-card" variants={fadeInUp}>
              <div className="pricing-card__header">
                <h3 className="pricing-card__name">Parent Pro</h3>
                <p className="pricing-card__description">
                  For health-conscious parents
                </p>
              </div>
              <div className="pricing-card__price">
                <span className="pricing-card__amount">$4.99</span>
                <span className="pricing-card__period">/month</span>
              </div>
              <ul className="pricing-card__features">
                <li className="pricing-card__feature">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                  </svg>
                  <span>Nutrition dashboard</span>
                </li>
                <li className="pricing-card__feature">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                  </svg>
                  <span>AI meal planning</span>
                </li>
                <li className="pricing-card__feature">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                  </svg>
                  <span>Health trends</span>
                </li>
                <li className="pricing-card__feature">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                  </svg>
                  <span>7-day free trial</span>
                </li>
              </ul>
              <button className="pricing-card__cta pricing-card__cta--secondary">
                Start trial
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="final-cta">
        <div className="final-cta__container">
          <motion.div
            initial="initial"
            whileInView="animate"
            variants={staggerContainer}
            viewport={{ once: true }}
          >
            <motion.h2 className="final-cta__title" variants={fadeInUp}>
              Ready to transform your school canteen?
            </motion.h2>
            <motion.p className="final-cta__subtitle" variants={fadeInUp}>
              Join schools that are saving time, reducing waste, and improving
              nutrition.
            </motion.p>
            <motion.div className="final-cta__actions" variants={fadeInUp}>
              <Link
                href="/sign-up"
                className="final-cta__btn final-cta__btn--primary"
              >
                Start free
              </Link>
              <button className="final-cta__btn final-cta__btn--secondary">
                Schedule demo
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
