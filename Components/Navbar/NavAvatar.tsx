"use client";

import { useUser } from "@clerk/nextjs";

/**
 * Renders a skeleton circle while Clerk hydrates (prevents "?" flash),
 * then shows the real avatar image or initials.
 */
export function NavAvatar({
  user,
  isLoaded,
  size = "sm",
}: {
  user: ReturnType<typeof useUser>["user"];
  isLoaded: boolean;
  size?: "sm" | "lg";
}) {
  const cls = size === "lg" ? "user-menu__avatar-lg" : "user-menu__avatar";

  if (!isLoaded) {
    return <span className={`${cls} user-menu__avatar--skeleton`} />;
  }

  if (user?.imageUrl) {
    const name =
      user.fullName ??
      user.username ??
      user.primaryEmailAddress?.emailAddress ??
      "User";
    return (
      <img
        src={user.imageUrl}
        alt={name}
        className={cls}
        style={{ borderRadius: "50%", objectFit: "cover" }}
      />
    );
  }

  const initials =
    ((user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "")).trim() ||
    user?.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() ||
    "·";

  return <span className={cls}>{initials}</span>;
}
