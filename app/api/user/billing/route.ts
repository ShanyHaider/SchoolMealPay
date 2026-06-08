// import { auth } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";
// import { getUserFromDb } from "@/features/users/queries";
// import {
//   getSchoolSubscription,
//   getSubscriptionInvoices,
//   getParentProSubscription,
// } from "@/db/queries/Subscription";

// export async function GET() {
//   const { userId: clerkId } = await auth();
//   if (!clerkId)
//     return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

//   // getUserFromDb is already "use cache" — no extra DB hit
//   const dbUser = await getUserFromDb(clerkId);
//   if (!dbUser)
//     return NextResponse.json({ subscription: null, invoices: [] });

//   if (dbUser.role === "school_admin") {
//     const [subscription, invoices] = await Promise.all([
//       getSchoolSubscription(),
//       getSubscriptionInvoices(),
//     ]);
//     return NextResponse.json({ subscription, invoices });
//   }

//   // parent / canteen_staff — parent pro subscription, no invoice table
//   const subscription = await getParentProSubscription(dbUser.id);
//   return NextResponse.json({ subscription, invoices: [] });
// }