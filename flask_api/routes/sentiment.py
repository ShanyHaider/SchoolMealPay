# routes/sentiment.py
from flask import Blueprint, request, jsonify
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

sentiment_bp = Blueprint("sentiment", __name__)
analyzer = SentimentIntensityAnalyzer()

# Extend VADER's general-purpose lexicon with food-service domain terms it
# doesn't score by default. Scale matches VADER's own: -4 (very negative) to
# +4 (very positive).
FOOD_DOMAIN_LEXICON = {
    "salty": -1.8, "oversalted": -2.5, "bland": -1.5, "tasteless": -2.0,
    "cold": -1.2, "soggy": -1.8, "stale": -2.2, "undercooked": -2.0,
    "overcooked": -1.8, "burnt": -2.0, "greasy": -1.3, "mushy": -1.5,
    "small": -0.8, "tiny": -1.0, "expensive": -1.0, "late": -1.2,
    "delicious": 2.2, "fresh": 1.8, "tasty": 2.0, "crispy": 1.5,
    "generous": 1.5, "flavorful": 1.8, "hot": 0.8, "perfect": 2.5,
}
analyzer.lexicon.update(FOOD_DOMAIN_LEXICON)


def _classify(compound: float, rating: int | None = None) -> str:
    # Star rating is a stronger, more reliable signal than short comment text.
    # If a low rating carries mild/neutral wording, still treat it as a
    # complaint — a 2-star review is negative regardless of politeness.
    if rating is not None:
        if rating <= 2 and compound > -0.3:
            return "negative"
        if rating >= 4 and compound < 0.3:
            return "positive"

    if compound >= 0.05:
        return "positive"
    elif compound <= -0.05:
        return "negative"
    return "neutral"


@sentiment_bp.route("/api/admin/feedback-sentiment", methods=["POST"])
def feedback_sentiment():
    """
    Input JSON:
    {
      "feedback": [
        { "id": "uuid", "comment": "The biryani was too salty today", "rating": 2 },
        ...
      ]
    }

    Output JSON:
    {
      "results": [
        { "id": "uuid", "sentiment": "negative", "score": -0.42, "flagged": true }
      ],
      "summary": {
        "positive": 12, "neutral": 5, "negative": 8,
        "overallScore": -0.05,
        "topNegativeThemes": ["salty", "cold", "portion"]
      }
    }
    """
    data = request.get_json(force=True)
    items = data.get("feedback", [])

    results = []
    scores = []
    negative_comments = []

    for item in items:
        comment = (item.get("comment") or "").strip()
        if not comment:
            continue
        rating = item.get("rating")
        vs = analyzer.polarity_scores(comment)
        sentiment = _classify(vs["compound"], rating)
        # Flag: negative sentiment on a text comment, useful for admin triage
        # regardless of star rating (mismatch is itself informative)
        flagged = sentiment == "negative"

        results.append({
            "id": item["id"],
            "sentiment": sentiment,
            "score": round(vs["compound"], 3),
            "flagged": flagged,
        })
        scores.append(vs["compound"])
        if sentiment == "negative":
            negative_comments.append(comment.lower())

    positive = sum(1 for r in results if r["sentiment"] == "positive")
    neutral = sum(1 for r in results if r["sentiment"] == "neutral")
    negative = sum(1 for r in results if r["sentiment"] == "negative")
    overall = round(sum(scores) / len(scores), 3) if scores else 0.0

    # Cheap keyword frequency on negative comments — no NLP model needed
    STOPWORDS = {
    "the", "was", "is", "and", "a", "to", "it", "of", "in", "for", "this",
    "that", "i", "my", "were", "are", "too", "way", "today", "very", "so",
    "but", "with", "on", "at", "be", "been", "have", "had", "has", "not",
    "no", "did", "didn't", "wasn't", "there", "their", "they", "he", "she",
    "we", "you", "your", "them", "his", "her", "just", "get", "got",
}
    word_freq = {}
    for c in negative_comments:
        for w in c.replace(",", " ").replace(".", " ").split():
            w = w.strip().lower()
            if len(w) > 2 and w not in STOPWORDS:
                word_freq[w] = word_freq.get(w, 0) + 1
    top_themes = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:5]

    return jsonify({
        "results": results,
        "summary": {
            "positive": positive,
            "neutral": neutral,
            "negative": negative,
            "overallScore": overall,
            "topNegativeThemes": [w for w, _ in top_themes],
        },
    })