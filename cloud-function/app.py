from flask import Flask, request, jsonify
from main import executions_api, github_webhook

app = Flask(__name__)

@app.route("/")
def health():
    return jsonify({"status": "ok"})

@app.route("/executions", methods=["GET", "OPTIONS"])
def executions():
    return executions_api(request)

@app.route("/webhook", methods=["POST"])
def webhook():
    return github_webhook(request)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
