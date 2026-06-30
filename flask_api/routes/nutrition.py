import os
import json
from typing import Any, cast
# pyrefly: ignore [missing-import]
from flask import Blueprint, request, jsonify
# pyrefly: ignore [missing-import]
from groq import Groq
# pyrefly: ignore [missing-import]
from groq.types.chat import ChatCompletionMessageParam

nutrition_bp = Blueprint("nutrition", __name__)
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


# ── POST /api/nutrition/summary ────────────────────────────────────────────────

@nutrition_bp.post("/summary")
def nutrition_summary():
    """
    Body: { childName, avg, targets, topMeals }
    Returns: { summary, concerns, swaps, verdict }
    """
    body = request.get_json()
    child_name = body["childName"]
    avg = body["avg"]
    targets = body["targets"]
    top_meals = body["topMeals"]

    top_meals_str = ", ".join(
        f"{m['name']} ({m['healthStatus']})" for m in top_meals
    )

    prompt = f"""You are a child nutrition assistant for a school meal system.
Analyze this data for {child_name} and respond in JSON only (no markdown, no backticks):

{{
  "summary": "2-3 sentence plain-English overview — be specific about which nutrients are low or high and what that means for the child's health and energy levels",
  "concerns": [
    "specific concern with context e.g. 'Calorie intake is only 29% of daily target, risking low energy and poor concentration'"
  ],
  "swaps": [
    {{
      "current": "specific meal name from their order history OR 'None' if no specific meal to replace",
      "suggestion": "specific healthier meal or food item",
      "reason": "one concrete sentence explaining the nutritional benefit"
    }}
  ],
  "verdict": "Healthy" or "Needs Improvement" or "Concerning"
}}

Average daily intake vs targets:
- Calories: {avg['calories']} / {targets['calories']} kcal  ({round(avg['calories']/targets['calories']*100)}% of target)
- Protein:  {avg['protein']}g / {targets['protein']}g  ({round(avg['protein']/targets['protein']*100)}% of target)
- Carbs:    {avg['carbs']}g / {targets['carbs']}g  ({round(avg['carbs']/targets['carbs']*100)}% of target)
- Fat:      {avg['fat']}g / {targets['fat']}g  ({round(avg['fat']/targets['fat']*100)}% of target)
- Fiber:    {avg['fiber']}g / {targets['fiber']}g  ({round(avg['fiber']/targets['fiber']*100)}% of target)

Most ordered meals: {top_meals_str}

Rules:
- concerns must be specific with numbers e.g. "Protein is at 20% of target"
- swaps must reference actual meals from the list above where possible
- if diet is severely deficient across multiple nutrients, verdict must be "Concerning"
- summary must mention the most critical gap first"""

    messages: list[ChatCompletionMessageParam] = [
        {"role": "user", "content": prompt},
    ]
    text = call_groq(messages, max_tokens=700, json_mode=True)
    result = parse_json(text)

    if not result:
        return jsonify({"error": "AI parse failed"}), 500

    return jsonify(result)


# ── POST /api/nutrition/suggestions ───────────────────────────────────────────

@nutrition_bp.post("/suggestions")
def meal_suggestions():
    """
    Body: { childName, avg, targets, topMeals, verdict, concerns, menuItems }
    Returns: { suggestions: [{ name, description, highlights, targetNutrients }] }
    """
    body = request.get_json()
    child_name = body["childName"]
    avg = body["avg"]
    targets = body["targets"]
    top_meals = body["topMeals"]
    verdict = body["verdict"]
    concerns = body["concerns"]
    menu_items = body["menuItems"]

    if not menu_items:
        return jsonify({"suggestions": []})

    gaps = [
        f"{k} ({avg[k]} vs {targets[k]} target)"
        for k in targets
        if avg.get(k, 0) < targets[k] * 0.8
    ]

    overordered = [m["name"] for m in top_meals if m["healthStatus"] != "Healthy"]
    menu_list = ", ".join(m["name"] for m in menu_items)

    prompt = f"""You are a child nutrition assistant for a school meal system.
Pick up to 3 meals for {child_name} from the canteen menu below.

IMPORTANT: You MUST only use meal names that appear EXACTLY in the menu list. Do not invent names.

Menu available: {menu_list}

Respond in JSON only (no markdown, no backticks):
{{
  "suggestions": [
    {{
      "name": "exact meal name from the menu",
      "description": "one sentence why this is good for {child_name}",
      "highlights": ["short highlight 1", "short highlight 2"],
      "targetNutrients": ["nutrient1", "nutrient2"]
    }}
  ]
}}

Context:
- Overall verdict: {verdict}
- Nutrient gaps (below 80% of target): {", ".join(gaps) if gaps else "none — diet is balanced"}
- Concerns: {", ".join(concerns) if concerns else "none"}
- Meals to avoid (overordered/unhealthy): {", ".join(overordered) if overordered else "none"}

Rules:
- ONLY pick from the menu list above — exact names only
- Pick meals that address the nutrient gaps
- targetNutrients must be from: calories, protein, carbs, fat, fiber
- If the menu has fewer than 3 suitable items, return fewer suggestions"""

    messages: list[ChatCompletionMessageParam] = [
        {"role": "user", "content": prompt},
    ]
    text = call_groq(messages, max_tokens=600, json_mode=True)
    result = parse_json(text)

    if not result or not isinstance(result, dict):
        return jsonify({"error": "AI parse failed"}), 500

    valid_names = {m["name"].lower() for m in menu_items}
    filtered = [s for s in result.get("suggestions", []) if s["name"].lower() in valid_names]

    return jsonify({"suggestions": filtered})


# ── POST /api/nutrition/chat ───────────────────────────────────────────────────

@nutrition_bp.post("/chat")
def nutrition_chat():
    """
    Body: { childName, avg, targets, history, newMessage }
    Returns: { reply }
    """
    body = request.get_json()
    child_name = body["childName"]
    avg = body["avg"]
    targets = body["targets"]
    history = body.get("history", [])
    new_message = body["newMessage"]

    system_prompt = f"""You are a helpful child nutrition assistant for a school meal app.
You are helping a parent understand their child {child_name}'s nutrition.

Current averages: Calories {avg['calories']}kcal, Protein {avg['protein']}g, 
Carbs {avg['carbs']}g, Fat {avg['fat']}g, Fiber {avg['fiber']}g.
Targets: Calories {targets['calories']}kcal, Protein {targets['protein']}g,
Carbs {targets['carbs']}g, Fat {targets['fat']}g, Fiber {targets['fiber']}g.

Be concise, warm, and practical. Answer in 2-4 sentences max unless asked for detail.
Never give medical advice."""

    messages: list[ChatCompletionMessageParam] = [
        {"role": "system", "content": system_prompt},
        *[{"role": m["role"], "content": m["content"]} for m in history[-8:]],
        {"role": "user", "content": new_message},
    ]

    reply = call_groq(messages, max_tokens=400, json_mode=False)

    if not reply:
        return jsonify({"error": "AI failed"}), 500

    return jsonify({"reply": reply})


# ── POST /api/nutrition/pick-daily-meals ───────────────────────────────────────

@nutrition_bp.post("/pick-daily-meals")
def pick_daily_meals():
    """
    Body: { childName, avg, targets, days: [{ date, menuItems: [{ id, name }] }] }
    Returns: { picks: { "YYYY-MM-DD": "meal name" } }
    """
    body = request.get_json()
    child_name = body["childName"]
    avg = body["avg"]
    targets = body["targets"]
    days = body["days"]

    valid_days = [d for d in days if d.get("menuItems")]
    if not valid_days:
        return jsonify({"picks": {}})

    gaps = [k for k in targets if avg.get(k, 0) < targets[k] * 0.8]

    days_block = "\n".join(
        f"{d['date']}: [{', '.join(m['name'] for m in d['menuItems'])}]"
        for d in valid_days
    )

    prompt = f"""You are a child nutrition assistant. Pick the best single meal for {child_name} for each school day.

{child_name}'s main nutrient gaps: {", ".join(gaps) if gaps else "none — diet is balanced"}

Available meals per day (pick EXACTLY one per day from the list):
{days_block}

Respond in JSON only:
{{
  "picks": {{
    "YYYY-MM-DD": "exact meal name from that day's list"
  }}
}}

Rules:
- Use ONLY meal names that appear in that day's list
- Vary the picks across days where possible
- Prioritise meals that address the nutrient gaps"""

    messages: list[ChatCompletionMessageParam] = [
        {"role": "user", "content": prompt},
    ]
    text = call_groq(messages, max_tokens=500, json_mode=True)
    result = parse_json(text)

    if not result or not isinstance(result, dict):
        return jsonify({"error": "AI parse failed"}), 500

    return jsonify({"picks": result.get("picks", {})})