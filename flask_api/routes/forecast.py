# routes/forecast.py
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from collections import defaultdict
import statistics

forecast_bp = Blueprint("forecast", __name__)

def _parse_date(d):
    return datetime.strptime(d, "%Y-%m-%d").date()

def _weekday_weighted_average(daily_counts: list[int]) -> float:
    """
    Weighted moving average — more recent occurrences of the same
    weekday count more. Weights: most recent = highest.
    daily_counts is ordered oldest -> newest for a single weekday.
    """
    if not daily_counts:
        return 0.0
    n = len(daily_counts)
    weights = list(range(1, n + 1))  # e.g. [1,2,3,4] for 4 samples
    weighted_sum = sum(c * w for c, w in zip(daily_counts, weights))
    return weighted_sum / sum(weights)

@forecast_bp.route("/api/admin/demand-forecast", methods=["POST"])
def demand_forecast():
    """
    Input JSON:
    {
      "orders": [
        { "date": "2026-06-15", "menuItemId": "uuid", "menuItemName": "Chicken Biryani", "quantity": 12 },
        ...
      ],
      "forecastDays": 7   # optional, default 7
    }

    Output JSON:
    {
      "forecasts": [
        {
          "menuItemId": "uuid",
          "menuItemName": "Chicken Biryani",
          "predictions": [
            { "date": "2026-07-09", "weekday": "Thursday", "predictedQuantity": 14, "confidence": "high" },
            ...
          ],
          "trend": "increasing" | "stable" | "decreasing"
        }
      ]
    }
    """
    data = request.get_json(force=True)
    orders = data.get("orders", [])
    forecast_days = int(data.get("forecastDays", 7))

    if not orders:
        return jsonify({"forecasts": []})

    # Group: menuItemId -> weekday(0-6) -> list of (date, quantity), oldest -> newest
    grouped = defaultdict(lambda: defaultdict(list))
    item_names = {}

    for o in orders:
        d = _parse_date(o["date"])
        item_id = o["menuItemId"]
        item_names[item_id] = o.get("menuItemName", item_id)
        grouped[item_id][d.weekday()].append((d, o.get("quantity", 0)))

    today = datetime.now().date()
    forecasts = []

    for item_id, weekday_map in grouped.items():
        predictions = []
        all_recent_totals = []

        for i in range(1, forecast_days + 1):
            target_date = today + timedelta(days=i)
            weekday = target_date.weekday()
            history = sorted(weekday_map.get(weekday, []), key=lambda x: x[0])
            quantities = [q for _, q in history[-6:]]  # last 6 occurrences of this weekday

            predicted = round(_weekday_weighted_average(quantities))
            confidence = "high" if len(quantities) >= 4 else "low" if len(quantities) <= 1 else "medium"

            predictions.append({
                "date": target_date.isoformat(),
                "weekday": target_date.strftime("%A"),
                "predictedQuantity": predicted,
                "confidence": confidence,
            })
            all_recent_totals.append(predicted)

        # Simple trend: compare first half vs second half of the item's full history
        all_qty_sorted = sorted(
            [(d, q) for wd in weekday_map.values() for d, q in wd],
            key=lambda x: x[0],
        )
        trend = "stable"
        if len(all_qty_sorted) >= 4:
            half = len(all_qty_sorted) // 2
            first_avg = statistics.mean(q for _, q in all_qty_sorted[:half])
            second_avg = statistics.mean(q for _, q in all_qty_sorted[half:])
            if second_avg > first_avg * 1.15:
                trend = "increasing"
            elif second_avg < first_avg * 0.85:
                trend = "decreasing"

        forecasts.append({
            "menuItemId": item_id,
            "menuItemName": item_names[item_id],
            "predictions": predictions,
            "trend": trend,
        })

    # Sort by total predicted demand, highest first — surfaces what canteen/admin needs to prep for
    forecasts.sort(key=lambda f: sum(p["predictedQuantity"] for p in f["predictions"]), reverse=True)

    return jsonify({"forecasts": forecasts})