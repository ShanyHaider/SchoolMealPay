import type { useUser } from "@clerk/nextjs";

export type UserResource = NonNullable<ReturnType<typeof useUser>["user"]>;
