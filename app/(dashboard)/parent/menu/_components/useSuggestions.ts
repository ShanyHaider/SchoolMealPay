"use client";

import { useState, useEffect } from "react";
import type { Student } from "./types";

type SuggestionEntry = {
    suggestions: { name: string; targetNutrients: string[] }[];
    generatedAt: number;
};

function suggestionsKey(childName: string) {
    return `meal_suggestions_${childName.toLowerCase().replace(/\s+/g, "_")}`;
}

export function useSuggestions(selectedStudentId: string, students: Student[]) {
    const [suggestedNames, setSuggestedNames] = useState<Set<string>>(new Set());
    const [suggestedFor, setSuggestedFor] = useState<string>("");

    useEffect(() => {
        const student = students.find((s) => s.id === selectedStudentId);
        if (!student) return;
        try {
            const raw = localStorage.getItem(suggestionsKey(student.name));
            if (!raw) {
                setSuggestedNames(new Set());
                setSuggestedFor("");
                return;
            }
            const { suggestions, generatedAt }: SuggestionEntry = JSON.parse(raw);
            if (Date.now() - generatedAt > 24 * 60 * 60 * 1000) {
                setSuggestedNames(new Set());
                setSuggestedFor("");
                return;
            }
            setSuggestedNames(new Set(suggestions.map((s) => s.name.toLowerCase())));
            setSuggestedFor(student.name);
        } catch {
            setSuggestedNames(new Set());
            setSuggestedFor("");
        }
    }, [selectedStudentId, students]);

    return { suggestedNames, suggestedFor };
}