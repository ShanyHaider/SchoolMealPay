// import { NextRequest, NextResponse } from "next/server";
// import { generateNutritionTrendsForAll } from "@/lib/cron/generateNutritionTrends";

// // Triggered weekly by Vercel Cron or an external scheduler.
// // Protect with CRON_SECRET so it can't be called by anyone publicly.
// export async function GET(req: NextRequest) {
//     const authHeader = req.headers.get("authorization");
//     if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
//         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     try {
//         await generateNutritionTrendsForAll();
//         return NextResponse.json({ ok: true });
//     } catch (err) {
//         console.error("[cron/nutrition-trends]", err);
//         return NextResponse.json({ error: "Failed" }, { status: 500 });
//     }
// }