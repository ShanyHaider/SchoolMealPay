"use client";

import Link from "next/link";
import { useSignIn } from "@clerk/nextjs";
import { OAuthStrategy } from "@clerk/shared/types";
import { useRouter } from "next/navigation";
import {
  AuthCard,
  AuthButton,
  AuthInput,
  OrDivider,
  GoogleIcon,
} from "@/Components/AuthCard";

export default function SignInPage() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  const loading = fetchStatus === "fetching";
  const errorMessage =
    errors?.global?.[0]?.longMessage ??
    errors?.fields?.identifier?.message ??
    errors?.fields?.password?.message ??
    null;

  const signInWith = async (strategy: OAuthStrategy) => {
    await signIn.sso({
      strategy,
      redirectCallbackUrl: "/sso-callback",
      redirectUrl: "/dashboard",
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const emailAddress = (form.elements.namedItem("email") as HTMLInputElement)
      .value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;

    const { error } = await signIn.password({ emailAddress, password });
    if (error) return;

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => router.push(decorateUrl("/dashboard")),
      });
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your account to continue"
    >
      <AuthButton
        variant="secondary"
        onClick={() => signInWith("oauth_google")}
        disabled={loading}
      >
        <GoogleIcon />
        Continue with Google
      </AuthButton>

      <OrDivider />

      <form className="auth-form" onSubmit={handleSubmit}>
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
          placeholder="••••••••"
          required
        />

        <div className="auth-forgot">
          <Link href="/forgot-password">Forgot password?</Link>
        </div>

        {errorMessage && <p className="auth-error">{errorMessage}</p>}

        <AuthButton type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </AuthButton>
      </form>

      <p className="auth-footer">
        Don't have an account? <Link href="/sign-up">Sign up free</Link>
      </p>
    </AuthCard>
  );
}
