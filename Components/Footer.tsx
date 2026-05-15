"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__grid">
          {/* Brand Column */}
          <div className="footer__col footer__col--brand">
            <Link href="/" className="footer__logo">
              SchoolMeal<span>Pay</span>
            </Link>
            <p className="footer__description">
              Revolutionizing school nutrition through smart technology and
              seamless payments.
            </p>
            <div className="footer__socials">
              {["twitter", "facebook", "instagram", "linkedin"].map(
                (social) => (
                  <a key={social} href="#" className="footer__social-link">
                    <span className="sr-only">{social}</span>
                    <div className={`icon icon--${social}`} />
                  </a>
                ),
              )}
            </div>
          </div>

          {/* Links Columns */}
          <div className="footer__col">
            <h4 className="footer__title">Product</h4>
            <ul className="footer__links">
              <li>
                <Link href="#features">Features</Link>
              </li>
              <li>
                <Link href="#pricing">Pricing</Link>
              </li>
              <li>
                <Link href="/demo">Watch Demo</Link>
              </li>
            </ul>
          </div>

          <div className="footer__col">
            <h4 className="footer__title">Company</h4>
            <ul className="footer__links">
              <li>
                <Link href="/about">About Us</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
              <li>
                <Link href="/privacy">Privacy Policy</Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="footer__col footer__col--newsletter">
            <h4 className="footer__title">Stay Updated</h4>
            <p>Join our newsletter for the latest updates.</p>
            <form className="footer__form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email" />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>

        <div className="footer__bottom">
          <p>
            &copy; {new Date().getFullYear()} SchoolMealPay. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
