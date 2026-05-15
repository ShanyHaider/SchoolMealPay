"use client";

import Link from "next/link";
import { useSignUp } from "@clerk/nextjs";
import { OAuthStrategy } from "@clerk/shared/types";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AuthCard,
  AuthButton,
  AuthInput,
  OrDivider,
  GoogleIcon,
} from "@/Components/AuthCard";

export default function SignUpPage() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const router = useRouter();
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  const loading = fetchStatus === "fetching";
  const errorMessage =
    errors?.fields ?
      Object.values(errors.fields)
        .filter(Boolean)
        .map((e) => e!.message)
        .join(", ")
    : (errors?.global?.[0]?.longMessage ?? null);

  const signUpWith = async (strategy: OAuthStrategy) => {
    await signUp.sso({
      strategy,
      redirectCallbackUrl: "/sso-callback",
      redirectUrl: "/dashboard",
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const firstName = (form.elements.namedItem("firstName") as HTMLInputElement)
      .value;
    const lastName = (form.elements.namedItem("lastName") as HTMLInputElement)
      .value;
    const emailAddress = (form.elements.namedItem("email") as HTMLInputElement)
      .value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;

    const { error } = await signUp.password({
      firstName,
      lastName,
      emailAddress,
      password,
    });
    if (error) return;

    await signUp.verifications.sendEmailCode();
    setPendingVerification(true);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUp.verifications.verifyEmailCode({ code });
    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ decorateUrl }) => router.push(decorateUrl("/dashboard")),
      });
    }
  };

  if (pendingVerification) {
    return (
      <AuthCard
        title="Check your inbox"
        subtitle="We sent a 6-digit code to your email. Enter it below to verify your account."
      >
        <form onSubmit={handleVerify}>
          <div className="auth-field">
            <label htmlFor="code" className="auth-label">
              Verification code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="auth-code-input"
            />
          </div>

          {errorMessage && <p className="auth-error">{errorMessage}</p>}

          <AuthButton type="submit" disabled={loading || code.length < 6}>
            {loading ? "Verifying…" : "Verify email"}
          </AuthButton>
        </form>

        <div className="auth-resend">
          Didn't receive it?{" "}
          <button onClick={() => signUp.verifications.sendEmailCode()}>
            Resend code
          </button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start for free. No credit card required."
    >
      <AuthButton
        variant="secondary"
        onClick={() => signUpWith("oauth_google")}
        disabled={loading}
      >
        <GoogleIcon />
        Continue with Google
      </AuthButton>

      <OrDivider />

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form__row">
          <div className="auth-field">
            <label htmlFor="firstName" className="auth-label">
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="Jane"
              required
              className="auth-input"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="lastName" className="auth-label">
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Doe"
              required
              className="auth-input"
            />
          </div>
        </div>

        <AuthInput
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          required
        />
        <AuthInput
          id="password"
          label="Password"
          type="password"
          placeholder="8+ characters"
          required
        />

        {errorMessage && <p className="auth-error">{errorMessage}</p>}

        {/* Required for Clerk bot protection */}
        {/* <div id="clerk-captcha" /> */}

        <AuthButton type="submit" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </AuthButton>
      </form>

      <p className="auth-legal">
        By continuing, you agree to our{" "}
        <Link href="/terms">Terms of Service</Link> and{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <p className="auth-footer">
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </p>
    </AuthCard>
  );
}
