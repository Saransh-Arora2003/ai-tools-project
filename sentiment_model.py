import re
from collections import Counter
import json
import os

try:
    import torch
    from transformers import pipeline
    TRANSFORMERS_AVAILABLE = True
except Exception as e:
    print(f"Warning: Transformers/Text generation modules unavailable: {e}")
    TRANSFORMERS_AVAILABLE = False

class TextGenerator:
    def __init__(self):
        """Initialize DistilGPT-2 for text generation"""
        self.generator = None
        if not TRANSFORMERS_AVAILABLE:
            return

        try:
            # Check if GPU is available
            device = 0 if torch.cuda.is_available() else -1
            self.generator = pipeline('text-generation', model='distilgpt2', device=device)
        except Exception as e:
            print(f"Warning: Error loading DistilGPT-2: {e}")
            self.generator = None
    
    def generate(self, prompt, max_length=100, num_return_sequences=1):
        """Generate text using DistilGPT-2"""
        if not self.generator:
            return {
                'error': 'Text generation model not available',
                'original_prompt': prompt,
                'success': False
            }
        
        if not prompt or not prompt.strip():
            return {
                'error': 'No prompt provided',
                'original_prompt': prompt,
                'success': False
            }
        
        try:
            # Generate text with safety limits
            max_length = min(max_length, 150)  # Cap at 150 to avoid memory issues
            
            results = self.generator(
                prompt, 
                max_length=max_length,
                num_return_sequences=num_return_sequences,
                do_sample=True,
                top_p=0.95,
                top_k=50,
                temperature=0.7,
                no_repeat_ngram_size=2
            )
            
            generated_texts = [result['generated_text'] for result in results]
            
            return {
                'original_prompt': prompt,
                'generated_texts': generated_texts,
                'success': True
            }
        except Exception as e:
            return {
                'error': f"Generation error: {str(e)}",
                'original_prompt': prompt,
                'success': False
            }

class SentimentAnalyzer:
    def __init__(self):
        # In a real application, you would load a pre-trained model here
        # For demonstration, we'll use a rule-based approach with ML elements
        self.positive_words = self._load_word_list('positive')
        self.negative_words = self._load_word_list('negative')
        self.neutral_words = self._load_word_list('neutral')
        
    def _load_word_list(self, sentiment_type):
        # Load sentiment lexicons (in real app, use NLTK or custom trained embeddings)
        word_lists = {
            'positive': [
                'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
                'outstanding', 'superb', 'brilliant', 'awesome', 'perfect', 'love',
                'like', 'nice', 'happy', 'pleased', 'delighted', 'marvelous',
                'terrific', 'fabulous', 'spectacular', 'incredible', 'best',
                'better', 'beautiful', 'gorgeous', 'stunning', 'impressive'
            ],
            'negative': [
                'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate',
                'dislike', 'disappointing', 'poor', 'unhappy', 'sad', 'angry',
                'frustrating', 'annoying', 'disgusting', 'ugly', 'broken',
                'useless', 'waste', 'rubbish', 'garbage', 'trash', 'pathetic'
            ],
            'neutral': [
                'okay', 'fine', 'average', 'decent', 'moderate', 'standard',
                'normal', 'regular', 'usual', 'typical', 'adequate', 'sufficient'
            ]
        }
        return set(word_lists.get(sentiment_type, []))
    
    def preprocess_text(self, text):
        """Basic text preprocessing"""
        # Convert to lowercase
        text = text.lower()
        # Remove special characters and digits
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        # Tokenize
        tokens = text.split()
        return tokens
    
    def calculate_sentiment_score(self, tokens):
        """Calculate sentiment score using word frequencies"""
        positive_count = sum(1 for token in tokens if token in self.positive_words)
        negative_count = sum(1 for token in tokens if token in self.negative_words)
        neutral_count = sum(1 for token in tokens if token in self.neutral_words)
        
        total_sentiment_words = positive_count + negative_count + neutral_count
        
        if total_sentiment_words == 0:
            return 0.5, 0.3  # Neutral with low confidence
        
        # Calculate raw score (-1 to 1 scale)
        raw_score = (positive_count - negative_count) / total_sentiment_words
        # Normalize to 0-1 scale
        normalized_score = (raw_score + 1) / 2
        
        # Calculate confidence based on ratio of sentiment words
        confidence = min(total_sentiment_words / len(tokens), 0.95) if tokens else 0.3
        confidence = max(confidence, 0.3)  # Minimum confidence
        
        return normalized_score, confidence
    
    def analyze(self, text):
        """Main analysis function"""
        if not text or not text.strip():
            return {
                'sentiment': 'neutral',
                'confidence': 0.0,
                'score': 0.5,
                'tokens_analyzed': 0
            }
        
        # Preprocess text
        tokens = self.preprocess_text(text)
        
        if not tokens:
            return {
                'sentiment': 'neutral',
                'confidence': 0.0,
                'score': 0.5,
                'tokens_analyzed': 0
            }
        
        # Calculate sentiment
        score, confidence = self.calculate_sentiment_score(tokens)
        
        # Determine sentiment category
        if score > 0.6:
            sentiment = 'positive'
        elif score < 0.4:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
        
        # Enhanced analysis
        positive_words = [token for token in tokens if token in self.positive_words]
        negative_words = [token for token in tokens if token in self.negative_words]
        
        return {
            'text': text,
            'sentiment': sentiment,
            'confidence': round(confidence, 3),
            'score': round(score, 3),
            'tokens_analyzed': len(tokens),
            'sentiment_words': {
                'positive': positive_words,
                'negative': negative_words,
                'count': len(positive_words) + len(negative_words)
            },
            'analysis': {
                'positive_score': len(positive_words),
                'negative_score': len(negative_words),
                'text_length': len(text),
                'word_count': len(tokens)
            }
        }

# Example usage for testing
if __name__ == "__main__":
    analyzer = SentimentAnalyzer()
    test_text = "I love this product! It's amazing and works perfectly."
    result = analyzer.analyze(test_text)
    print(json.dumps(result, indent=2))