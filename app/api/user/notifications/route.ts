// // app/api/notifications/route.ts
// import { auth } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";
// import { getUserFromDb } from "@/features/users/queries";
// import { getNotificationsByUser } from "@/db/queries/Notifications";

// export async function GET() {
//     const { userId: clerkId } = await auth();
//     if (!clerkId)
//         return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

//     const dbUser = await getUserFromDb(clerkId);
//     if (!dbUser)
//         return NextResponse.json({ error: "User not found" }, { status: 404 });

//     const notifications = await getNotificationsByUser(dbUser.id);

//     const sorted = [...notifications].sort(
//         (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
//     );

//     return NextResponse.json({ notifications: sorted, userId: dbUser.id });
// }