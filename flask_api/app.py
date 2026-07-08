import os
from dotenv import load_dotenv
load_dotenv()


# pyrefly: ignore [missing-import]
from flask import Flask
from flask_cors import CORS
# pyrefly: ignore [missing-import]

from routes.nutrition import nutrition_bp
from routes.admin_nutrition import admin_nutrition_bp
from routes.forecast import forecast_bp
from routes.sentiment import sentiment_bp


app = Flask(__name__)

# Only allow requests from your Next.js app
CORS(app, origins=[
    "http://localhost:3000",
    os.environ.get("NEXTJS_URL", ""),
])

app.register_blueprint(nutrition_bp, url_prefix="/api/nutrition")
app.register_blueprint(admin_nutrition_bp, url_prefix="/api/admin/nutrition")
app.register_blueprint(forecast_bp)   # routes already define full /api/admin/... paths
app.register_blueprint(sentiment_bp)

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=os.environ.get("FLASK_ENV") == "development", port=port)