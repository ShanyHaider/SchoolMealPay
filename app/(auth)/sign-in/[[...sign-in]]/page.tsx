"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useSignIn } from "@clerk/nextjs";
import { OAuthStrategy } from "@clerk/shared/types";

import {
  AuthButton,
  AuthCard,
  AuthInput,
  GoogleIcon,
  OrDivider,
} from "@/app/(auth)/_components/AuthCard";

export default function SignInPage() {
  const { signIn, fetchStatus } = useSignIn();

  const router = useRouter();

  const [showMfaStep, setShowMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loading = fetchStatus === "fetching";

  // ─────────────────────────────────────────────────────────────
  // Navigate helper
  // ─────────────────────────────────────────────────────────────

  const navigate = ({
    decorateUrl,
  }: {
    decorateUrl: (url: string) => string;
  }) => {
    const url = decorateUrl("/dashboard");

    if (url.startsWith("http")) {
      window.location.href = url;
    } else {
      router.push(url);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // OAuth
  // ─────────────────────────────────────────────────────────────

  const signInWith = async (strategy: OAuthStrategy) => {
    try {
      const { error } = await signIn.sso({
        strategy,
        redirectCallbackUrl: "/sso-callback",
        redirectUrl: "/dashboard",
      });

      if (error) {
        toast.error(error.message || "Authentication failed.");
      }
    } catch {
      toast.error("Something went wrong.");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Email/password login
  // ─────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const { error } = await signIn.password({
        emailAddress: email,
        password,
      });

      if (error) {
        toast.error(error.message || "Invalid credentials.");
        return;
      }

      if (signIn.status === "complete") {
        toast.success("Successfully signed in.");
        await signIn.finalize({ navigate });
      } else if (
        signIn.status === "needs_client_trust" ||
        signIn.status === "needs_second_factor"
      ) {
        await signIn.mfa.sendEmailCode();

        setShowMfaStep(true);

        toast.success("Verification code sent.");
      }
    } catch {
      toast.error("Unable to sign in.");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // MFA verify
  // ─────────────────────────────────────────────────────────────

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await signIn.mfa.verifyEmailCode({
        code: mfaCode,
      });

      if (signIn.status === "complete") {
        toast.success("Verification successful.");
        await signIn.finalize({ navigate });
      }
    } catch {
      toast.error("Invalid verification code.");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // MFA Screen
  // ─────────────────────────────────────────────────────────────

  if (showMfaStep) {
    return (
      <AuthCard
        title="Check your inbox"
        subtitle="We sent a 6-digit verification code to your email address."
      >
        <form onSubmit={handleVerify} className="space-y-4">
          <AuthInput
            id="mfa-code"
            type="text"
            placeholder="000000"
            value={mfaCode}
            onChange={(e) =>
              setMfaCode(e.target.value.replace(/\D/g, ""))
            }
          />

          <AuthButton
            type="submit"
            disabled={loading || mfaCode.length < 6}
          >
            {loading ? "Verifying..." : "Verify code"}
          </AuthButton>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => signIn.mfa.sendEmailCode()}
            className="text-muted-foreground transition hover:text-foreground"
          >
            Resend code
          </button>

          <button
            type="button"
            onClick={() => {
              setShowMfaStep(false);
              signIn.reset();
            }}
            className="text-muted-foreground transition hover:text-foreground"
          >
            Back
          </button>
        </div>
      </AuthCard>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Main screen
  // ─────────────────────────────────────────────────────────────

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue to your dashboard."
    >
      <div className="space-y-6">
        <AuthButton
          variant="secondary"
          onClick={() => signInWith("oauth_google")}
          disabled={loading}
        >
          <GoogleIcon />
          Continue with Google
        </AuthButton>

        <OrDivider />

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthInput
            id="email"
            type="email"
            placeholder="Email address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <AuthInput
            id="password"
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>

          <AuthButton type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </AuthButton>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}