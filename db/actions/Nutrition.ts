"use server";

import type { NutritionAverages } from "@/types/nutritionTypes";

export type NutritionTargets = {
  calories: number;
  protein: number;
  fiber: number;
  carbs: number;
  fat: number;
};

export type MealSuggestion = {
  name: string; // exact name from the canteen menu
  description: string;
  highlights: string[];
  targetNutrients: string[];
};

// ── Shared Groq helper ─────────────────────────────────────────────────────────

async function groq(prompt: string, maxTokens = 1000): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ── generateNutritionSummary ───────────────────────────────────────────────────

export async function generateNutritionSummary(
  childName: string,
  avg: NutritionAverages,
  targets: NutritionTargets,
  topMeals: { name: string; healthStatus: string }[],
) {
  const prompt = `
You are a child nutrition assistant for a school meal system.
Analyze this data for ${childName} and respond in JSON only (no markdown, no backticks):

{
  "summary": "2-3 sentence plain-English overview of their nutrition",
  "concerns": ["array of specific concern strings, empty if none"],
  "swaps": [{"current": "meal name or None", "suggestion": "healthier alternative", "reason": "one line why"}],
  "verdict": "Healthy" | "Needs Improvement" | "Concerning"
}

Average daily intake vs targets:
- Calories: ${avg.calories} / ${targets.calories} kcal
- Protein:  ${avg.protein}g / ${targets.protein}g
- Carbs:    ${avg.carbs}g / ${targets.carbs}g
- Fat:      ${avg.fat}g / ${targets.fat}g
- Fiber:    ${avg.fiber}g / ${targets.fiber}g

Most ordered meals: ${topMeals.map((m) => `${m.name} (${m.healthStatus})`).join(", ")}
`;

  const text = await groq(prompt, 1000);
  if (!text) return null;

  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return parsed as {
      summary: string;
      concerns: string[];
      swaps: { current: string; suggestion: string; reason: string }[];
      verdict: "Healthy" | "Needs Improvement" | "Concerning";
    };
  } catch {
    console.error("[nutrition] summary parse failed:", text);
    return null;
  }
}

// ── generateMealSuggestions ────────────────────────────────────────────────────
// menuItems: actual names from the canteen — AI must pick ONLY from this list.

// export async function generateMealSuggestions(
//     childName: string,
//     avg: NutritionAverages,
//     targets: NutritionTargets,
//     topMeals: { name: string; healthStatus: string }[],
//     verdict: string,
//     concerns: string[],
//     menuItems: { id: string; name: string }[],  // ← real canteen items
// ) {
//     if (menuItems.length === 0) return null;

//     const gaps = (Object.keys(targets) as (keyof NutritionTargets)[])
//         .filter((k) => avg[k] < targets[k] * 0.8)
//         .map((k) => `${k} (${avg[k]} vs ${targets[k]} target)`);

//     const overordered = topMeals
//         .filter((m) => m.healthStatus !== "Healthy")
//         .map((m) => m.name);

//     const menuList = menuItems.map((m) => m.name).join(", ");

//     const prompt = `
// You are a child nutrition assistant for a school meal system.
// Pick up to 3 meals for ${childName} from the canteen menu below.

// IMPORTANT: You MUST only use meal names that appear EXACTLY in the menu list. Do not invent names.

// Menu available: ${menuList}

// Respond in JSON only (no markdown, no backticks):
// {
//   "suggestions": [
//     {
//       "name": "exact meal name from the menu",
//       "description": "one sentence why this is good for ${childName}",
//       "highlights": ["short highlight 1", "short highlight 2"],
//       "targetNutrients": ["nutrient1", "nutrient2"]
//     }
//   ]
// }

// Context:
// - Overall verdict: ${verdict}
// - Nutrient gaps (below 80% of target): ${gaps.length > 0 ? gaps.join(", ") : "none"}
// - Concerns: ${concerns.length > 0 ? concerns.join(", ") : "none"}
// - Meals to avoid (overordered/unhealthy): ${overordered.length > 0 ? overordered.join(", ") : "none"}

// Rules:
// - ONLY pick from the menu list above — exact names only
// - Pick meals that address the nutrient gaps
// - targetNutrients must be from: calories, protein, carbs, fat, fiber
// - If the menu has fewer than 3 suitable items, return fewer suggestions
// `;

//     const text = await groq(prompt, 800);
//     if (!text) return null;

//     try {
//         const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
//         // Filter out any hallucinated names not in the actual menu
//         const validNames = new Set(menuItems.map((m) => m.name.toLowerCase()));
//         const filtered = (parsed.suggestions as MealSuggestion[]).filter(
//             (s) => validNames.has(s.name.toLowerCase()),
//         );
//         return filtered.length > 0 ? filtered : null;
//     } catch {
//         console.error("[nutrition] suggestions parse failed:", text);
//         return null;
//     }
// }

// ── pickDailyMeals ─────────────────────────────────────────────────────────────
// For recurring orders: given a list of dates and available menu items per date,
// pick the best single meal for each day based on nutrition needs.

export async function pickDailyMeals(
  childName: string,
  avg: NutritionAverages,
  targets: NutritionTargets,
  days: { date: string; menuItems: { id: string; name: string }[] }[],
): Promise<Record<string, string> | null> {
  // Only include days that actually have menu items
  const validDays = days.filter((d) => d.menuItems.length > 0);
  if (validDays.length === 0) return null;

  const gaps = (Object.keys(targets) as (keyof NutritionTargets)[])
    .filter((k) => avg[k] < targets[k] * 0.8)
    .map((k) => k);

  const daysBlock = validDays
    .map((d) => `${d.date}: [${d.menuItems.map((m) => m.name).join(", ")}]`)
    .join("\n");

  const prompt = `
You are a child nutrition assistant. Pick the best single meal for ${childName} for each school day.

${childName}'s main nutrient gaps: ${gaps.join(", ") || "none — diet is balanced"}

Available meals per day (pick EXACTLY one per day from the list):
${daysBlock}

Respond in JSON only:
{
  "picks": {
    "YYYY-MM-DD": "exact meal name from that day's list",
    ...
  }
}

Rules:
- Use ONLY meal names that appear in that day's list
- Vary the picks across days where possible
- Prioritise meals that address the nutrient gaps
`;

  const text = await groq(prompt, 600);
  if (!text) return null;

  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return parsed.picks as Record<string, string>;
  } catch {
    console.error("[nutrition] pickDailyMeals parse failed:", text);
    return null;
  }
}

// ── chatAboutNutrition ────────────────────────────────────────────────────────

// export async function chatAboutNutrition(
//   childName: string,
//   avg: NutritionAverages,
//   targets: NutritionTargets,
//   history: { role: "user" | "assistant"; content: string }[],
//   newMessage: string,
// ) {
//   const systemPrompt = `You are a helpful child nutrition assistant for a school meal app.
// You are helping a parent understand their child ${childName}'s nutrition.

// Current averages: Calories ${avg.calories}kcal, Protein ${avg.protein}g,
// Carbs ${avg.carbs}g, Fat ${avg.fat}g, Fiber ${avg.fiber}g.
// Targets: Calories ${targets.calories}kcal, Protein ${targets.protein}g,
// Carbs ${targets.carbs}g, Fat ${targets.fat}g, Fiber ${targets.fiber}g.

// Be concise, warm, and practical. Answer in 2-4 sentences max unless asked for detail.`;

//   const res = await fetch("https://api.anthropic.com/v1/messages", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "x-api-key": process.env.ANTHROPIC_API_KEY!,
//       "anthropic-version": "2023-06-01",
//     },
//     body: JSON.stringify({
//       model: "claude-sonnet-4-20250514",
//       max_tokens: 1000,
//       system: systemPrompt,
//       messages: [...history, { role: "user", content: newMessage }],
//     }),
//   });

//   const data = await res.json();
//   return data.content?.[0]?.text ?? "Sorry, I couldn't generate a response.";
// }
