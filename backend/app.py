from flask import Flask, request, jsonify
from flask_cors import CORS
import PyPDF2
import re
import google.generativeai as genai

app = Flask(__name__)
CORS(app, resources={r"/legal-help": {"origins": "http://localhost:3000"}})  # Allow requests from React frontend

# Configure Gemini API
GEMINI_API_KEY = "AIzaSyD4-XgjIHC8DuDtT4MRnep8z82XJ_GgzYc"  # Replace with your actual API key
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-pro")

# Path to Constitution text
CONSTITUTION_TEXT_PATH = "constitution.txt"

# Extract text from PDF (run once if constitution.txt doesn't exist)
def extract_text_from_pdf(pdf_path):
    text = ""
    with open(pdf_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)
        for page in reader.pages:
            text += page.extract_text() + "\n"
    return text

# Save extracted text
def save_constitution_text():
    pdf_path = "static/constution.pdf"
    constitution_text = extract_text_from_pdf(pdf_path)
    with open(CONSTITUTION_TEXT_PATH, "w", encoding="utf-8") as f:
        f.write(constitution_text)

# Load and split Constitution text into articles
def load_articles():
    with open(CONSTITUTION_TEXT_PATH, "r", encoding="utf-8") as f:
        constitution_text = f.read()
    articles = {}
    matches = re.finditer(r"(\d{1,3}[A-Za-z]*\.)\s(.*?)(\n|$)", constitution_text, re.DOTALL)
    for match in matches:
        article_number = match.group(1).strip()
        article_content = match.group(2).strip()
        articles[article_number] = article_content
    return articles

# Search articles based on query
def search_articles(query, articles_dict):
    relevant_articles = {}
    for article, content in articles_dict.items():
        if any(word.lower() in content.lower() for word in query.split()):
            relevant_articles[article] = content
    return relevant_articles

# Generate legal advice using Gemini
def get_legal_advice(query, articles_dict):
    relevant_articles = search_articles(query, articles_dict)
    if not relevant_articles:
        return "No relevant legal articles found in the Constitution."

    references = "\n".join([f"{art}: {content[:300]}..." for art, content in relevant_articles.items()])
    prompt = f"""
    You are an expert in Indian constitutional law. Based on the query:
    "{query}"
    Refer to the relevant articles:
    {references}
    Provide a concise legal interpretation and possible legal solution.
    """
    response = model.generate_content(prompt)
    return response.text

# Load articles once at startup
try:
    articles_dict = load_articles()
except FileNotFoundError:
    save_constitution_text()
    articles_dict = load_articles()

# API endpoint for legal queries
@app.route('/legal-help', methods=['POST'])
def legal_help():
    data = request.json
    if not data or "query" not in data:
        return jsonify({"error": "Missing 'query' in request"}), 400
    query = data["query"]
    advice = get_legal_advice(query, articles_dict)
    return jsonify({"query": query, "advice": advice})

if __name__ == '__main__':
    app.run(port=5000)