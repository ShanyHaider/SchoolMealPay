"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Send, Bot, User, MessageSquare } from "lucide-react";
import { chatAboutAdminNutrition, type PopulationTrend, type AdminChatMessage } from "@/db/actions/admin/Nutrition";

interface Props {
    userId: string;
    schoolName: string;
    trends: PopulationTrend[];
    currentMenuItems: { id: string; name: string }[];
}

const STARTER_QUESTIONS = [
    "Which nutrients need the most urgent menu attention?",
    "What are 3 low-cost meals that would address our biggest gaps?",
    "How does our population's fiber intake compare to the target?",
    "What changes would have the biggest impact on student nutrition?",
];

export function AdminNutritionChat({ userId, schoolName, trends, currentMenuItems }: Props) {
    const [history, setHistory] = useState<AdminChatMessage[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [input, setInput] = useState("");
    const [isPending, startTransition] = useTransition();
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history, isPending]);

    function send(text?: string) {
        const msg = (text ?? input).trim();
        if (!msg || isPending) return;

        setHistory(h => [...h, { role: "user", content: msg }]);
        setInput("");

        startTransition(async () => {
            const { reply, conversationId: newConvId } = await chatAboutAdminNutrition(
                userId,
                schoolName,
                trends,
                currentMenuItems,
                conversationId,
                msg,
            );
            setConversationId(newConvId);
            setHistory(h => [...h, { role: "assistant", content: reply }]);
        });
    }

    return (
        <div className="bg-(--bg-card) border border-(--border-card) rounded-3xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-5 border-b border-(--border-card)">
                <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <MessageSquare size={15} className="text-violet-600" />
                </div>
                <div>
                    <p className="font-bold text-sm text-(--text-primary)">Menu Advisor</p>
                    <p className="text-xs text-(--text-muted)">Ask about nutrition gaps, menu ideas, or student trends</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-(--text-muted)">Online</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex flex-col gap-4 p-5 min-h-[240px] max-h-[400px] overflow-y-auto">
                {history.length === 0 && (
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center shrink-0">
                                <Bot size={14} />
                            </div>
                            <div className="px-4 py-2.5 bg-(--bg-tertiary) rounded-2xl rounded-tl-sm text-sm text-(--text-secondary) max-w-[85%]">
                                Hi! I have access to your school's nutrition trend data. Ask me anything about improving your canteen menu.
                            </div>
                        </div>
                        <div className="pl-10 space-y-2">
                            <p className="text-xs text-(--text-muted) font-medium">Suggested questions</p>
                            {STARTER_QUESTIONS.map((q) => (
                                <button
                                    key={q}
                                    onClick={() => send(q)}
                                    className="block w-full text-left text-sm px-3 py-2 bg-(--bg-tertiary) hover:bg-(--bg-secondary) rounded-xl text-(--text-secondary) transition-colors"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {history.map((m, i) => (
                    <div key={i} className={`flex items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${m.role === "assistant"
                            ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600"
                            : "bg-(--bg-tertiary) text-(--text-secondary)"
                            }`}>
                            {m.role === "assistant" ? <Bot size={14} /> : <User size={14} />}
                        </div>
                        <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === "user"
                            ? "bg-(--accent) text-(--accent-text) rounded-tr-sm"
                            : "bg-(--bg-tertiary) text-(--text-secondary) rounded-tl-sm"
                            }`}>
                            {m.content}
                        </div>
                    </div>
                ))}

                {isPending && (
                    <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center shrink-0">
                            <Bot size={14} />
                        </div>
                        <div className="px-4 py-3 bg-(--bg-tertiary) rounded-2xl rounded-tl-sm">
                            <div className="flex gap-1">
                                {[0, 1, 2].map((i) => (
                                    <span
                                        key={i}
                                        className="w-1.5 h-1.5 bg-(--text-muted) rounded-full animate-bounce"
                                        style={{ animationDelay: `${i * 0.15}s` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-(--border-card) flex gap-3">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Ask about menu gaps, nutrition trends…"
                    className="flex-1 text-sm bg-(--bg-tertiary) text-(--text-primary) placeholder:text-(--text-muted) border border-(--border-card) rounded-xl px-4 py-2.5 outline-none focus:border-(--border-primary) transition-colors"
                />
                <button
                    onClick={() => send()}
                    disabled={!input.trim() || isPending}
                    className="w-10 h-10 flex items-center justify-center bg-(--accent) text-(--accent-text) rounded-xl hover:bg-(--accent-hover) transition-colors disabled:opacity-40"
                >
                    <Send size={15} />
                </button>
            </div>
        </div>
    );
}