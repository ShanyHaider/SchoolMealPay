"use client";

import Link from "next/link";
import { ArrowLeft, ChevronLeft, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────
// Image slider data
// Replace with your own images anytime
// ─────────────────────────────────────────────────────────────

const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1600&auto=format&fit=crop",
    title: "Smart school meal management",
    description:
      "Securely manage student meals, payments, and cafeteria operations.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1600&auto=format&fit=crop",
    title: "Fast & secure payments",
    description:
      "Built for modern schools with seamless authentication and security.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1600&auto=format&fit=crop",
    title: "Designed for parents & schools",
    description:
      "Track orders, balances, and nutrition from one clean dashboard.",
  },
];

// ─────────────────────────────────────────────────────────────
// Layout wrapper
// ─────────────────────────────────────────────────────────────

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background px-4 py-6 lg:flex lg:items-center lg:justify-center">
      <div className="grid w-full max-w-7xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl lg:grid-cols-2">
        {/* ───────────────── Left Slider ───────────────── */}

        <div className="relative hidden min-h-[700px] overflow-hidden lg:block">
          {slides.map((slide, index) => (
            <div
              key={slide.title}
              className={`absolute inset-0 transition-opacity duration-700 ${activeSlide === index
                ? "opacity-100"
                : "pointer-events-none opacity-0"
                }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-black/45" />

              {/* top nav */}
              <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-8">
                <div className="text-xl font-black tracking-tight text-white">
                  SchoolMealPay
                </div>

                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
                >
                  <ChevronLeft size={16} />
                  Back to website
                </Link>
              </div>

              {/* bottom text */}
              <div className="absolute bottom-10 left-10 max-w-md text-white">
                <h2 className="mb-3 text-4xl font-bold leading-tight">
                  {slide.title}
                </h2>

                <p className="text-sm leading-relaxed text-white/80">
                  {slide.description}
                </p>

                {/* indicators */}
                <div className="mt-8 flex items-center gap-2">
                  {slides.map((_, dotIndex) => (
                    <div
                      key={dotIndex}
                      className={`h-2 rounded-full transition-all ${activeSlide === dotIndex
                        ? "w-10 bg-white"
                        : "w-2 bg-white/40"
                        }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ───────────────── Right Form ───────────────── */}

        <div className="flex min-h-[700px] items-center justify-center bg-card px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">
            {/* mobile back */}
            <div className="mb-8 lg:hidden">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
              >
                <ArrowLeft size={16} />
                Back to website
              </Link>
            </div>

            <div className="mb-8">
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                {title}
              </h1>

              <p className="mt-3 text-sm text-muted-foreground">
                {subtitle}
              </p>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Buttons
// ─────────────────────────────────────────────────────────────

export function AuthButton({
  children,
  variant = "primary",
  type = "button",
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        flex h-12 w-full items-center justify-center gap-2 rounded-xl
        text-sm font-semibold transition-all duration-200
        disabled:cursor-not-allowed disabled:opacity-50

        ${variant === "primary"
          ? `
              bg-primary text-primary-foreground
              hover:opacity-90
            `
          : `
              border border-border bg-background
              hover:bg-muted
            `
        }
      `}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────────

export function AuthInput({
  id,
  type,
  placeholder,
  required,
  value,
  onChange,
}: {
  id: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  return (
    <div className="relative">
      <input
        id={id}
        name={id}
        type={isPassword ? (showPassword ? "text" : "password") : type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange}
        className="
          h-12 w-full rounded-xl border border-border bg-background
          px-4 text-sm outline-none transition-all
          placeholder:text-muted-foreground
          focus:border-primary
          focus:ring-2 focus:ring-primary/20
        "
      />

      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Divider
// ─────────────────────────────────────────────────────────────

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-4">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        OR
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Google icon
// ─────────────────────────────────────────────────────────────

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}