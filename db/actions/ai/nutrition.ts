"use server";

import { db } from "@/drizzle/db";
import { aiMealSuggestionsTable } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import {
    fetchNutritionSummary,
    fetchMealSuggestions,
    fetchNutritionChat,
    fetchPickDailyMeals,
} from "@/lib/flaskClient";
import type { NutritionAverages } from "@/types/nutritionTypes";
import { chatbotConversationsTable, chatbotMessagesTable } from "@/drizzle/schema";
import { desc } from "drizzle-orm";


export type { NutritionSummary, MealSuggestion, NutritionTargets } from "@/lib/flaskClient";
export type NutrientKey = "calories" | "protein" | "carbs" | "fat" | "fiber";

export async function generateNutritionSummary(
    childName: string,
    avg: NutritionAverages,
    targets: { calories: number; protein: number; carbs: number; fat: number; fiber: number },
    topMeals: { name: string; healthStatus: string }[],
) {
    return fetchNutritionSummary(childName, avg, targets, topMeals);
}

export async function generateMealSuggestions(
    childName: string,
    avg: NutritionAverages,
    targets: { calories: number; protein: number; carbs: number; fat: number; fiber: number },
    topMeals: { name: string; healthStatus: string }[],
    verdict: string,
    concerns: string[],
    menuItems: { id: string; name: string }[],
    studentId: string,
) {
    const date = new Date().toISOString().split("T")[0];

    // Check DB cache first — avoid regenerating if already done today
    const cached = await db.query.aiMealSuggestionsTable.findMany({
        where: and(
            eq(aiMealSuggestionsTable.studentId, studentId),
            eq(aiMealSuggestionsTable.forDate, date),
        ),
        with: { menuItem: { columns: { id: true, name: true } } },
    });

    if (cached.length > 0) {
        return cached.map(row => ({
            name: row.menuItem.name,
            description: row.reason ?? "",
            highlights: [],
            targetNutrients: [],
        }));
    }

    // Call Flask
    const { suggestions } = await fetchMealSuggestions(
        childName, avg, targets, topMeals, verdict, concerns, menuItems,
    );

    if (!suggestions || suggestions.length === 0) return null;

    // Persist to DB
    const menuMap = new Map(menuItems.map(m => [m.name.toLowerCase(), m]));
    const validSuggestions = suggestions.filter(s => menuMap.has(s.name.toLowerCase()));

    if (validSuggestions.length > 0) {
        await db.insert(aiMealSuggestionsTable).values(
            validSuggestions.map(s => ({
                studentId,
                menuItemId: menuMap.get(s.name.toLowerCase())!.id,
                reason: s.description,
                forDate: date,
            }))
        ).onConflictDoNothing();
    }

    return validSuggestions.length > 0 ? validSuggestions : null;
}

export async function invalidateStudentMealSuggestions(
    studentId: string,
    date: string,
) {
    await db.delete(aiMealSuggestionsTable).where(
        and(
            eq(aiMealSuggestionsTable.studentId, studentId),
            eq(aiMealSuggestionsTable.forDate, date),
        )
    );
}

export async function chatAboutNutrition(
    userId: string,
    childName: string,
    avg: NutritionAverages,
    targets: { calories: number; protein: number; carbs: number; fat: number; fiber: number },
    conversationId: string | null,
    newMessage: string,
): Promise<{ reply: string; conversationId: string }> {

    // Create conversation if first message
    let convId = conversationId;
    if (!convId) {
        const [conv] = await db
            .insert(chatbotConversationsTable)
            .values({
                userId,
                topic: "nutrition",
                userContext: { childName, avg, targets },
            })
            .returning({ id: chatbotConversationsTable.id });
        convId = conv.id;
    }

    // Load last 8 messages for context
    const history = await db.query.chatbotMessagesTable.findMany({
        where: eq(chatbotMessagesTable.conversationId, convId),
        orderBy: [desc(chatbotMessagesTable.createdAt)],
        limit: 8,
    });

    const orderedHistory = history.reverse().map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
    }));

    // Call Flask
    const { reply } = await fetchNutritionChat(
        childName, avg, targets, orderedHistory, newMessage,
    );

    // Persist both messages
    await db.insert(chatbotMessagesTable).values([
        { conversationId: convId, role: "user", content: newMessage },
        { conversationId: convId, role: "assistant", content: reply },
    ]);

    return { reply: reply || "Sorry, I couldn't generate a response.", conversationId: convId };
}

export async function pickDailyMeals(
    childName: string,
    avg: NutritionAverages,
    targets: { calories: number; protein: number; carbs: number; fat: number; fiber: number },
    days: { date: string; menuItems: { id: string; name: string }[] }[],
) {
    const { picks } = await fetchPickDailyMeals(childName, avg, targets, days);
    return picks;
}

