export function mapClerkError(err: unknown): string {
  const e = err as {
    errors?: { message?: string; longMessage?: string; code?: string }[];
    message?: string;
    status?: number;
  };
  const raw =
    e?.errors?.[0]?.longMessage ??
    e?.errors?.[0]?.message ??
    e?.message ??
    "An unexpected error occurred.";
  const code = e?.errors?.[0]?.code ?? "";

  if (
    raw.toLowerCase().includes("already connected") ||
    raw.toLowerCase().includes("already linked")
  )
    return "This Google account is already linked to another user profile.";
  if (
    raw.toLowerCase().includes("email address is taken") ||
    raw.toLowerCase().includes("that email")
  )
    return "This email address is already registered in our system.";
  if (
    raw.includes("phone_number must be a phone_number") ||
    code === "form_param_format_invalid"
  )
    return "Please enter a valid phone number using international formatting (e.g., +1234567890).";
  if (
    raw.includes("phone_number is not a valid parameter") ||
    code === "form_identifier_not_allowed"
  )
    return "Phone registration is currently disabled. Please contact support or use email.";

  return raw;
}
