from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import re
from sentiment_model import SentimentAnalyzer, TextGenerator
import os

# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=BASE_DIR, static_url_path='')
CORS(app)

# Initialize the sentiment analyzer
analyzer = SentimentAnalyzer()

# Initialize the text generator
generator = TextGenerator()

@app.route('/')
def home():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/analyze', methods=['POST'])
def analyze_sentiment():
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Perform sentiment analysis
        result = analyzer.analyze(text)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/batch_analyze', methods=['POST'])
def batch_analyze():
    try:
        data = request.get_json()
        texts = data.get('texts', [])
        
        if not texts:
            return jsonify({'error': 'No texts provided'}), 400
        
        results = []
        for text in texts:
            result = analyzer.analyze(text)
            results.append(result)
        
        return jsonify({'results': results})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/generate-text', methods=['POST'])
def generate_text():
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        max_length = data.get('max_length', 100)
        
        if not prompt:
            return jsonify({'error': 'No prompt provided'}), 400
        
        # Generate text using DistilGPT
        result = generator.generate(prompt, max_length=max_length)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)