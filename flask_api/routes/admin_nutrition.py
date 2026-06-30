import os
import json
from typing import Any, cast
# pyrefly: ignore [missing-import]
from flask import Blueprint, request, jsonify
# pyrefly: ignore [missing-import]
from groq import Groq
# pyrefly: ignore [missing-import]
from groq.types.chat import ChatCompletionMessageParam

admin_nutrition_bp = Blueprint("admin_nutrition", __name__)
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


# ── Shared helper ──────────────────────────────────────────────────────────────

def call_groq(
    messages: list[ChatCompletionMessageParam],
    max_tokens: int = 1000,
    json_mode: bool = False,
) -> str:
    if json_mode:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=max_tokens,
            messages=messages,
            response_format=cast(Any, {"type": "json_object"}),
        )
    else:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=max_tokens,
            messages=messages,
        )
    return response.choices[0].message.content or ""


def parse_json(text: str) -> dict | list | None:
    try:
        cleaned = text.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)
    except Exception as e:
        print(f"[parse_json] failed: {e} | text: {text[:200]}")
        return None


# ── POST /api/admin/nutrition/insight ──────────────────────────────────────────

@admin_nutrition_bp.post("/insight")
def population_insight():
    """
    Body: { schoolName, trends: [PopulationTrend], currentMenuItems: [{ id, name }] }
    Returns: { headline, keyFindings, menuGapSuggestions, overallRating }
    """
    body = request.get_json()
    school_name = body["schoolName"]
    trends = body["trends"]
    menu_items = body["currentMenuItems"]

    trend_lines = "\n".join(
        f"{t['nutrient']}: avg {t['averageDaily']} vs target {t['targetDaily']} "
        f"({t['percentOfTarget']}% of target, level: {t['trendLevel']}, "
        f"{t['affectedStudentCount']}/{t['totalStudentCount']} students affected)"
        for t in trends
    )
    menu_list = ", ".join(m["name"] for m in menu_items) or "No items yet"

    prompt = f"""You are a school nutrition advisor helping {school_name} improve their canteen menu.

Population nutrition trends across all students:
{trend_lines}

Current canteen menu items: {menu_list}

Respond in JSON only (no markdown, no backticks):
{{
  "headline": "one sentence summary of the school's overall nutrition picture",
  "keyFindings": [
    "finding 1 — specific, data-driven, plain language",
    "finding 2",
    "finding 3"
  ],
  "menuGapSuggestions": [
    {{
      "mealName": "suggested meal or food item name",
      "reason": "one sentence why this addresses a gap",
      "targetNutrients": ["nutrient1", "nutrient2"],
      "priorityScore": 8
    }}
  ],
  "overallRating": "Good" or "Needs Attention" or "Critical"
}}

Rules:
- menuGapSuggestions should NOT duplicate existing menu items
- targetNutrients must be from: calories, protein, carbs, fat, fiber
- priorityScore: 10 = urgent gap affecting most students, 1 = minor/optional
- max 5 menuGapSuggestions
- keyFindings should reference actual numbers from the data"""

    messages: list[ChatCompletionMessageParam] = [
        {"role": "user", "content": prompt},
    ]
    text = call_groq(messages, max_tokens=900, json_mode=True)
    result = parse_json(text)

    if not result:
        return jsonify({"error": "AI parse failed"}), 500

    return jsonify(result)


# ── POST /api/admin/nutrition/chat ─────────────────────────────────────────────

@admin_nutrition_bp.post("/chat")
def admin_chat():
    """
    Body: { schoolName, trends, currentMenuItems, history, newMessage }
    Returns: { reply }
    """
    body = request.get_json()
    school_name = body["schoolName"]
    trends = body["trends"]
    menu_items = body["currentMenuItems"]
    history = body.get("history", [])
    new_message = body["newMessage"]

    trend_summary = "; ".join(
        f"{t['nutrient']}: {t['percentOfTarget']}% of target ({t['trendLevel']}), "
        f"affects {t['affectedStudentCount']}/{t['totalStudentCount']} students"
        for t in trends
    )
    menu_list = ", ".join(m["name"] for m in menu_items) or "none"

    system_prompt = f"""You are a school nutrition consultant helping {school_name}'s admin team improve their canteen menu.

Population data: {trend_summary}
Current menu: {menu_list}

You help with: menu planning, understanding nutrition gaps, meal cost-benefit, and practical canteen improvements.
Be concise, data-driven, and practical. Answer in 3-5 sentences max unless asked for more detail.
Never give medical advice — you advise on menu composition only."""

    messages: list[ChatCompletionMessageParam] = [
        {"role": "system", "content": system_prompt},
        *[{"role": m["role"], "content": m["content"]} for m in history[-8:]],
        {"role": "user", "content": new_message},
    ]

    reply = call_groq(messages, max_tokens=450, json_mode=False)

    if not reply:
        return jsonify({"error": "AI failed"}), 500

    return jsonify({"reply": reply})