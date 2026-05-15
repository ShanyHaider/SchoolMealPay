"use client";

import Image from "next/image";
interface ClerkUser {
  fullName?: string | null;
  username?: string | null;
  imageUrl?: string;
  primaryEmailAddress?: { emailAddress: string } | null;
}

interface UserAvatarProps {
  user: ClerkUser | null | undefined;
  size: "sm" | "md" | "lg";
  isLoaded?: boolean;
}

const SIZE_MAP = { sm: 32, md: 36, lg: 44 };

function getInitials(user: ClerkUser | null | undefined): string {
  if (!user) return "?";
  if (user.fullName) {
    const parts = user.fullName.split(" ");
    return parts.length >= 2 ?
        `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  }
  if (user.username) return user.username[0].toUpperCase();
  if (user.primaryEmailAddress?.emailAddress)
    return user.primaryEmailAddress.emailAddress[0].toUpperCase();
  return "?";
}

export function UserAvatar({ user, size, isLoaded = true }: UserAvatarProps) {
  const px = SIZE_MAP[size];

  if (!isLoaded) {
    return (
      <span
        className={`user-avatar user-avatar--${size} user-avatar--skeleton`}
        style={{ width: px, height: px }}
        aria-hidden="true"
      />
    );
  }

  if (user?.imageUrl) {
    return (
      <Image
        className={`user-avatar user-avatar--${size}`}
        src={user.imageUrl}
        alt={user.fullName ?? "User avatar"}
        width={px}
        height={px}
      />
    );
  }

  return (
    <span
      className={`user-avatar user-avatar--${size} user-avatar--initials`}
      style={{ width: px, height: px }}
      aria-label={`Avatar for ${user?.fullName ?? "user"}`}
    >
      {getInitials(user)}
    </span>
  );
}
