"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth, useSignUp } from "@clerk/nextjs";
import { OAuthStrategy } from "@clerk/shared/types";

import {
  AuthCard,
  AuthButton,
  AuthInput,
  GoogleIcon,
  OrDivider,
} from "@/app/(auth)/_components/AuthCard";

import { ReverificationModal } from "@/components/userMenu/shared/ReverificationModal";

export default function SignUpPage() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();

  const router = useRouter();

  const [showVerification, setShowVerification] =
    useState(false);

  // ─────────────────────────────────────────────
  // Stable redirect
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isSignedIn, router]);

  // ─────────────────────────────────────────────
  // Prevent unstable renders
  // ─────────────────────────────────────────────

  if (!signUp || isSignedIn) {
    return null;
  }

  const loading = fetchStatus === "fetching";

  // ─────────────────────────────────────────────
  // OAuth
  // ─────────────────────────────────────────────

  const signUpWith = async (
    strategy: OAuthStrategy
  ) => {
    try {
      const { error } = await signUp.sso({
        strategy,
        redirectCallbackUrl: "/sso-callback",
        redirectUrl: "/dashboard",
      });

      if (error) {
        console.error(error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ─────────────────────────────────────────────
  // Password signup
  // ─────────────────────────────────────────────

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      const form = e.currentTarget;

      const firstName = (
        form.elements.namedItem(
          "firstName"
        ) as HTMLInputElement
      ).value;

      const lastName = (
        form.elements.namedItem(
          "lastName"
        ) as HTMLInputElement
      ).value;

      const emailAddress = (
        form.elements.namedItem(
          "email"
        ) as HTMLInputElement
      ).value;

      const password = (
        form.elements.namedItem(
          "password"
        ) as HTMLInputElement
      ).value;

      const { error } = await signUp.password({
        firstName,
        lastName,
        emailAddress,
        password,
      });

      if (error) {
        console.error(error);
        return;
      }

      // Send verification code

      await signUp.verifications.sendEmailCode();

      // Open custom modal

      setShowVerification(true);
    } catch (err: any) {
      console.error(err);

      alert(
        err?.errors?.[0]?.longMessage ||
        err?.message ||
        "Failed to create account."
      );
    }
  };

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────

  return (
    <>
      <AuthCard
        title="Create your account"
        subtitle="Start for free. No credit card required."
      >
        <AuthButton
          variant="secondary"
          disabled={loading}
          onClick={() =>
            signUpWith("oauth_google")
          }
        >
          <GoogleIcon />
          Continue with Google
        </AuthButton>

        <OrDivider />

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          {/* Name row */}

          <div className="auth-form__row">
            <div className="auth-field">
              <label
                htmlFor="firstName"
                className="auth-label"
              >
                First name
              </label>

              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                placeholder="Jane"
                autoComplete="given-name"
                className="auth-input"
              />

              {errors?.fields?.firstName && (
                <p className="auth-error">
                  {
                    errors.fields.firstName
                      .message
                  }
                </p>
              )}
            </div>

            <div className="auth-field">
              <label
                htmlFor="lastName"
                className="auth-label"
              >
                Last name
              </label>

              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                placeholder="Doe"
                autoComplete="family-name"
                className="auth-input"
              />

              {errors?.fields?.lastName && (
                <p className="auth-error">
                  {
                    errors.fields.lastName
                      .message
                  }
                </p>
              )}
            </div>
          </div>

          {/* Email */}

          <div className="auth-field">
            <AuthInput
              id="email"
              type="email"
              placeholder="you@example.com"
              required
            />

            {errors?.fields?.emailAddress && (
              <p className="auth-error">
                {
                  errors.fields.emailAddress
                    .message
                }
              </p>
            )}
          </div>

          {/* Password */}

          <div className="auth-field">
            <AuthInput
              id="password"
              type="password"
              placeholder="8+ characters"
              required
            />

            {errors?.fields?.password && (
              <p className="auth-error">
                {
                  errors.fields.password
                    .message
                }
              </p>
            )}
          </div>

          {/* Global errors */}

          {errors?.global?.map((err, i) => (
            <p
              key={i}
              className="auth-error"
            >
              {err.longMessage}
            </p>
          ))}

          {/* Required for Clerk bot protection */}

          <div id="clerk-captcha" />

          <AuthButton
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Creating account…"
              : "Create account"}
          </AuthButton>
        </form>

        <p className="auth-legal">
          By continuing, you agree to our{" "}
          <Link href="/terms">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy">
            Privacy Policy
          </Link>
          .
        </p>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link href="/sign-in">
            Sign in
          </Link>
        </p>
      </AuthCard>

      {/* ───────────────────────────────────── */}
      {/* Custom verification modal */}
      {/* ───────────────────────────────────── */}

      {showVerification && (
        <ReverificationModal
          onCancel={() =>
            setShowVerification(false)
          }
          onComplete={async ({
            code,
          }) => {
            try {
              await signUp.verifications.verifyEmailCode(
                {
                  code,
                }
              );

              if (
                signUp.status === "complete"
              ) {
                await signUp.finalize({
                  navigate: ({
                    decorateUrl,
                  }) => {
                    router.replace(
                      decorateUrl(
                        "/dashboard"
                      )
                    );
                  },
                });

                return true;
              }

              return false;
            } catch (err) {
              console.error(err);
              return false;
            }
          }}
        />
      )}
    </>
  );
}