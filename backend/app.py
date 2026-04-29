"""API Flask principale pour Zürich - Édition NDAOBA MOHAMAT 24G2687."""

from __future__ import annotations
import logging
import os
import threading
from flask import Flask, jsonify, request
from flask_cors import CORS

from database import (
    count_articles,
    get_alerts,
    get_article_by_id,
    get_articles,
    get_last_scrape_time,
    get_stats,
    init_db,
)
from scheduler import start_scheduler
from scraper import scrape_all

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
LOGGER = logging.getLogger(__name__)

ALLOWED_REGIONS = {"world", "africa", "asia", "americas", "europe", "oceania"}
ALLOWED_THEMES = {"waste", "air", "water", "soil"}

app = Flask(__name__)
# AMÉLIORATION : Ouverture du CORS pour permettre la connexion avec Vercel
CORS(app, resources={r"/api/*": {"origins": "*"}})

_SCHEDULER_STARTED = False

def _ensure_initialized() -> None:
    """Initialise DB + scheduler une seule fois par process."""
    global _SCHEDULER_STARTED
    init_db()
    if not _SCHEDULER_STARTED:
        start_scheduler()
        _SCHEDULER_STARTED = True

@app.route("/api/articles", methods=["GET"])
def api_get_articles():
    _ensure_initialized()
    region = request.args.get("region")
    theme = request.args.get("theme")
    limit_param = request.args.get("limit", "50")

    if region and region not in ALLOWED_REGIONS:
        return jsonify({"error": "Paramètre region invalide"}), 400
    if theme and theme not in ALLOWED_THEMES:
        return jsonify({"error": "Paramètre theme invalide"}), 400

    try:
        limit = int(limit_param)
    except ValueError:
        return jsonify({"error": "Paramètre limit invalide"}), 400

    articles = get_articles(region=region, theme=theme, limit=limit)
    return jsonify({"articles": articles, "total": len(articles)})

@app.route("/api/articles/<article_id>", methods=["GET"])
def api_get_article_by_id(article_id: str):
    _ensure_initialized()
    article = get_article_by_id(article_id)
    if not article:
        return jsonify({"error": "Article introuvable"}), 404
    return jsonify(article)

@app.route("/api/stats", methods=["GET"])
def api_get_stats():
    _ensure_initialized()
    stats = get_stats()
    return jsonify(stats)

@app.route("/api/alerts", methods=["GET"])
def api_get_alerts():
    _ensure_initialized()
    alerts = get_alerts()
    return jsonify({"alerts": alerts})

@app.route("/api/scrape", methods=["POST"])
def api_trigger_scrape():
    _ensure_initialized()
    try:
        thread = threading.Thread(target=scrape_all, daemon=True)
        thread.start()
        return jsonify({"status": "started", "message": "Scraping en cours..."})
    except Exception:
        LOGGER.exception("Erreur pendant /api/scrape")
        return jsonify({"status": "error", "message": "Échec du scraping"}), 500

@app.route("/api/health", methods=["GET"])
def api_health():
    _ensure_initialized()
    return jsonify({
        "status": "ok",
        "db_articles": count_articles(),
        "last_scrape": get_last_scrape_time(),
        "identity": "NDAOBA MOHAMAT 24G2687"
    })

if __name__ == "__main__":
    _ensure_initialized()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
