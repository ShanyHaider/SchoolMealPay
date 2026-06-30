"use server";

import { db } from "@/drizzle/db";
import { chatbotConversationsTable, chatbotMessagesTable } from "@/drizzle/schema";
import { fetchPopulationInsight, fetchAdminNutritionChat, PopulationTrend } from "@/lib/flaskClient";
import { desc, eq } from "drizzle-orm";
export type { PopulationTrend, MenuGapSuggestion } from "@/lib/flaskClient";

export type AdminChatMessage = {
    role: "user" | "assistant";
    content: string;
};

export async function generatePopulationNutritionInsight(
    schoolName: string,
    trends: PopulationTrend[],
    currentMenuItems: { id: string; name: string }[],
) {
    return fetchPopulationInsight(schoolName, trends, currentMenuItems);
}

export async function chatAboutAdminNutrition(
    userId: string,
    schoolName: string,
    trends: PopulationTrend[],
    currentMenuItems: { id: string; name: string }[],
    conversationId: string | null,
    newMessage: string,
): Promise<{ reply: string; conversationId: string }> {

    let convId = conversationId;
    if (!convId) {
        const [conv] = await db
            .insert(chatbotConversationsTable)
            .values({
                userId,
                topic: "admin_nutrition",
                userContext: { schoolName, trendCount: trends.length },
            })
            .returning({ id: chatbotConversationsTable.id });
        convId = conv.id;
    }

    const history = await db.query.chatbotMessagesTable.findMany({
        where: eq(chatbotMessagesTable.conversationId, convId),
        orderBy: [desc(chatbotMessagesTable.createdAt)],
        limit: 8,
    });

    const orderedHistory = history.reverse().map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
    }));

    const { reply } = await fetchAdminNutritionChat(
        schoolName, trends, currentMenuItems, orderedHistory, newMessage,
    );

    await db.insert(chatbotMessagesTable).values([
        { conversationId: convId, role: "user", content: newMessage },
        { conversationId: convId, role: "assistant", content: reply },
    ]);

    return { reply: reply || "Sorry, I couldn't generate a response.", conversationId: convId };
}