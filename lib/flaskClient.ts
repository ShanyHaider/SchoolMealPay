// lib/flaskClient.ts
// Single point of contact between Next.js server actions and the Flask API.
// All functions are typed end-to-end — server actions just call these.

import { NutrientKey } from "@/db/actions/ai/nutrition";

const FLASK_URL = process.env.FLASK_API_URL ?? "http://localhost:5000";

async function post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${FLASK_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        // No caching — AI responses are dynamic
        cache: "no-store",
    });

    if (!res.ok) {
        console.error(`[flaskClient] ${path} → ${res.status}`, await res.text());
        throw new Error(`Flask API error: ${res.status}`);
    }

    return res.json() as Promise<T>;
}

// ── Types (mirror your existing types) ────────────────────────────────────────

export type NutritionAverages = {
    calories: number; protein: number;
    carbs: number; fat: number; fiber: number;
};

export type NutritionTargets = {
    calories: number; protein: number;
    carbs: number; fat: number; fiber: number;
};

export type NutritionSummary = {
    summary: string;
    concerns: string[];
    swaps: { current: string; suggestion: string; reason: string }[];
    verdict: "Healthy" | "Needs Improvement" | "Concerning";
};

export type MealSuggestion = {
    name: string;
    description: string;
    highlights: string[];
    targetNutrients: string[];
};

export type PopulationTrend = {
    nutrient: NutrientKey;
    averageDaily: number;
    targetDaily: number;
    percentOfTarget: number;
    trendLevel: "on_track" | "low" | "high";
    affectedStudentCount: number;
    totalStudentCount: number;
};

export type MenuGapSuggestion = {
    mealName: string;
    reason: string;
    targetNutrients: string[];
    priorityScore: number;
};

export type PopulationInsight = {
    headline: string;
    keyFindings: string[];
    menuGapSuggestions: MenuGapSuggestion[];
    overallRating: "Good" | "Needs Attention" | "Critical";
};

// ── Parent nutrition ───────────────────────────────────────────────────────────

export async function fetchNutritionSummary(
    childName: string,
    avg: NutritionAverages,
    targets: NutritionTargets,
    topMeals: { name: string; healthStatus: string }[],
): Promise<NutritionSummary> {
    return post("/api/nutrition/summary", { childName, avg, targets, topMeals });
}

export async function fetchMealSuggestions(
    childName: string,
    avg: NutritionAverages,
    targets: NutritionTargets,
    topMeals: { name: string; healthStatus: string }[],
    verdict: string,
    concerns: string[],
    menuItems: { id: string; name: string }[],
): Promise<{ suggestions: MealSuggestion[] }> {
    return post("/api/nutrition/suggestions", {
        childName, avg, targets, topMeals, verdict, concerns, menuItems,
    });
}

export async function fetchNutritionChat(
    childName: string,
    avg: NutritionAverages,
    targets: NutritionTargets,
    history: { role: "user" | "assistant"; content: string }[],
    newMessage: string,
): Promise<{ reply: string }> {
    return post("/api/nutrition/chat", {
        childName, avg, targets, history, newMessage,
    });
}

export async function fetchPickDailyMeals(
    childName: string,
    avg: NutritionAverages,
    targets: NutritionTargets,
    days: { date: string; menuItems: { id: string; name: string }[] }[],
): Promise<{ picks: Record<string, string> }> {
    return post("/api/nutrition/pick-daily-meals", {
        childName, avg, targets, days,
    });
}

// ── Admin nutrition ────────────────────────────────────────────────────────────

export async function fetchPopulationInsight(
    schoolName: string,
    trends: PopulationTrend[],
    currentMenuItems: { id: string; name: string }[],
): Promise<PopulationInsight> {
    return post("/api/admin/nutrition/insight", {
        schoolName, trends, currentMenuItems,
    });
}

export async function fetchAdminNutritionChat(
    schoolName: string,
    trends: PopulationTrend[],
    currentMenuItems: { id: string; name: string }[],
    history: { role: "user" | "assistant"; content: string }[],
    newMessage: string,
): Promise<{ reply: string }> {
    return post("/api/admin/nutrition/chat", {
        schoolName, trends, currentMenuItems, history, newMessage,
    });
}

// ── Demand forecast ─────────────────────────────────────────────────────────

export type ForecastPrediction = {
    date: string;
    weekday: string;
    predictedQuantity: number;
    confidence: "high" | "medium" | "low";
};

export type ItemForecast = {
    menuItemId: string;
    menuItemName: string;
    predictions: ForecastPrediction[];
    trend: "increasing" | "stable" | "decreasing";
};

export async function fetchDemandForecast(
    orders: { date: string; menuItemId: string; menuItemName: string; quantity: number }[],
    forecastDays = 7,
): Promise<{ forecasts: ItemForecast[] }> {
    return post("/api/admin/demand-forecast", { orders, forecastDays });
}

// ── Feedback sentiment ──────────────────────────────────────────────────────

export type SentimentResult = {
    id: string;
    sentiment: "positive" | "neutral" | "negative";
    score: number;
    flagged: boolean;
};

export type SentimentSummary = {
    positive: number;
    neutral: number;
    negative: number;
    overallScore: number;
    topNegativeThemes: string[];
};

export async function fetchFeedbackSentiment(
    feedback: { id: string; comment: string; rating: number }[],
): Promise<{ results: SentimentResult[]; summary: SentimentSummary }> {
    return post("/api/admin/feedback-sentiment", { feedback });
}