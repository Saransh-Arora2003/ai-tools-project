class SentimentAnalyzer {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000';
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Analyze button
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.analyzeText();
        });

        // Clear button
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearText();
        });

        // Generate button
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generateText();
        });

        // Clear prompt button
        document.getElementById('clearPromptBtn').addEventListener('click', () => {
            this.clearPrompt();
        });

        // Example buttons for sentiment
        document.querySelectorAll('.example-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const text = e.target.getAttribute('data-text');
                document.getElementById('textInput').value = text;
                this.analyzeText();
            });
        });

        // Example buttons for GPT
        document.querySelectorAll('.example-btn-gpt').forEach(button => {
            button.addEventListener('click', (e) => {
                const text = e.target.getAttribute('data-text');
                document.getElementById('promptInput').value = text;
                this.generateText();
            });
        });

        // Enter key support for sentiment
        document.getElementById('textInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.analyzeText();
            }
        });

        // Enter key support for generation
        document.getElementById('promptInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.generateText();
            }
        });
    }

    async analyzeText() {
        const textInput = document.getElementById('textInput');
        const text = textInput.value.trim();

        if (!text) {
            this.showError('Please enter some text to analyze.');
            return;
        }

        this.showLoading();

        try {
            const response = await fetch(`${this.apiBaseUrl}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.displayResults(result);

        } catch (error) {
            console.error('Error analyzing text:', error);
            this.showError('Failed to analyze text. Please ensure the backend server is running.');
            // Fallback to client-side analysis
            this.fallbackAnalysis(text);
        }
    }

    fallbackAnalysis(text) {
        // Simple client-side fallback analysis
        const positiveWords = ['love', 'great', 'excellent', 'amazing', 'good', 'perfect', 'fantastic', 'wonderful', 'happy'];
        const negativeWords = ['hate', 'terrible', 'awful', 'bad', 'horrible', 'worst', 'disappointing', 'poor'];
        
        const words = text.toLowerCase().split(/\s+/);
        let positiveCount = 0;
        let negativeCount = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) positiveCount++;
            if (negativeWords.includes(word)) negativeCount++;
        });
        
        const total = positiveCount + negativeCount;
        let score = 0.5;
        let confidence = 0.3;
        
        if (total > 0) {
            score = positiveCount / total;
            confidence = Math.min(total / words.length, 0.8);
        }
        
        let sentiment = 'neutral';
        if (score > 0.6) sentiment = 'positive';
        else if (score < 0.4) sentiment = 'negative';
        
        const result = {
            sentiment: sentiment,
            confidence: confidence,
            score: score,
            text: text,
            tokens_analyzed: words.length,
            sentiment_words: {
                positive: words.filter(word => positiveWords.includes(word)),
                negative: words.filter(word => negativeWords.includes(word)),
                count: positiveCount + negativeCount
            },
            analysis: {
                positive_score: positiveCount,
                negative_score: negativeCount,
                text_length: text.length,
                word_count: words.length
            }
        };
        
        this.displayResults(result);
    }

    displayResults(result) {
        // Update sentiment display
        const sentimentDisplay = document.getElementById('sentimentResult');
        sentimentDisplay.className = `sentiment-display ${result.sentiment}`;
        
        const sentimentIcons = {
            positive: '😊',
            negative: '😞',
            neutral: '😐'
        };
        
        sentimentDisplay.innerHTML = `
            <div class="sentiment-icon">${sentimentIcons[result.sentiment]}</div>
            <div class="sentiment-text">
                <div>${result.sentiment.toUpperCase()} SENTIMENT</div>
                <div style="font-size: 0.9rem; opacity: 0.8; margin-top: 5px;">
                    Score: ${(result.score * 100).toFixed(1)}%
                </div>
            </div>
        `;

        // Update confidence meter
        const confidenceValue = document.getElementById('confidenceValue');
        const confidenceFill = document.getElementById('confidenceFill');
        const confidencePercent = Math.round(result.confidence * 100);
        
        confidenceValue.textContent = `${confidencePercent}%`;
        confidenceFill.style.width = `${confidencePercent}%`;

        // Update detailed results
        const detailedResults = document.getElementById('detailedResults');
        detailedResults.innerHTML = `
            <h3>Detailed Analysis</h3>
            <div class="detail-item">
                <span>Text Length:</span>
                <span>${result.analysis.text_length} characters</span>
            </div>
            <div class="detail-item">
                <span>Words Analyzed:</span>
                <span>${result.tokens_analyzed} tokens</span>
            </div>
            <div class="detail-item">
                <span>Sentiment Words Found:</span>
                <span>${result.sentiment_words.count}</span>
            </div>
            <div class="detail-item">
                <span>Positive Indicators:</span>
                <span>${result.analysis.positive_score}</span>
            </div>
            <div class="detail-item">
                <span>Negative Indicators:</span>
                <span>${result.analysis.negative_score}</span>
            </div>
        `;

        // Show sentiment words if available
        if (result.sentiment_words.positive.length > 0 || result.sentiment_words.negative.length > 0) {
            const analysisDetails = document.getElementById('analysisDetails');
            analysisDetails.innerHTML = `
                <h4>Key Sentiment Words</h4>
                ${result.sentiment_words.positive.length > 0 ? `
                    <div style="color: #4caf50; margin: 10px 0;">
                        <strong>Positive:</strong> ${result.sentiment_words.positive.join(', ')}
                    </div>
                ` : ''}
                ${result.sentiment_words.negative.length > 0 ? `
                    <div style="color: #f44336; margin: 10px 0;">
                        <strong>Negative:</strong> ${result.sentiment_words.negative.join(', ')}
                    </div>
                ` : ''}
            `;
        }
    }

    showLoading() {
        const sentimentDisplay = document.getElementById('sentimentResult');
        sentimentDisplay.className = 'sentiment-display neutral';
        sentimentDisplay.innerHTML = `
            <div class="sentiment-icon">⏳</div>
            <div class="sentiment-text">
                <div>ANALYZING...</div>
                <div style="font-size: 0.9rem; opacity: 0.8; margin-top: 5px;">
                    <div class="loading" style="display: inline-block;"></div>
                    Processing with NLP & Deep Learning
                </div>
            </div>
        `;

        document.getElementById('confidenceValue').textContent = '0%';
        document.getElementById('confidenceFill').style.width = '0%';
        document.getElementById('detailedResults').innerHTML = '<p>Analyzing text sentiment...</p>';
        document.getElementById('analysisDetails').innerHTML = '';
    }

    showError(message) {
        const sentimentDisplay = document.getElementById('sentimentResult');
        sentimentDisplay.className = 'sentiment-display neutral';
        sentimentDisplay.innerHTML = `
            <div class="sentiment-icon">❌</div>
            <div class="sentiment-text">${message}</div>
        `;
    }

    clearText() {
        document.getElementById('textInput').value = '';
        document.getElementById('sentimentResult').className = 'sentiment-display neutral';
        document.getElementById('sentimentResult').innerHTML = `
            <div class="sentiment-icon">😐</div>
            <div class="sentiment-text">Ready for analysis</div>
        `;
        document.getElementById('confidenceValue').textContent = '0%';
        document.getElementById('confidenceFill').style.width = '0%';
        document.getElementById('detailedResults').innerHTML = '<p>Enter text and click "Analyze Sentiment" to see detailed results.</p>';
        document.getElementById('analysisDetails').innerHTML = '';
    }

    async generateText() {
        const promptInput = document.getElementById('promptInput');
        const prompt = promptInput.value.trim();

        if (!prompt) {
            this.showGenerationError('Please enter a prompt to generate text.');
            return;
        }

        this.showGenerationLoading();

        try {
            const response = await fetch(`${this.apiBaseUrl}/generate-text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    prompt: prompt,
                    max_length: 100
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.displayGeneratedContent(result);

        } catch (error) {
            console.error('Error generating text:', error);
            this.showGenerationError('Failed to generate text. Please make sure the backend server is running.');
        }
    }

    clearPrompt() {
        document.getElementById('promptInput').value = '';
        document.getElementById('generatedResult').className = 'sentiment-display neutral';
        document.getElementById('generatedResult').innerHTML = `
            <div class="sentiment-icon" style="align-self: center; margin-bottom: 10px;">✍️</div>
            <div class="sentiment-text" style="width: 100%; text-align: left;">Ready for generation</div>
        `;
        document.getElementById('generatedContent').innerHTML = '<p>Enter a prompt and click "Generate Text" to see results.</p>';
    }

    showGenerationLoading() {
        const generatedResult = document.getElementById('generatedResult');
        generatedResult.className = 'sentiment-display neutral';
        generatedResult.innerHTML = `
            <div class="sentiment-icon">⏳</div>
            <div class="sentiment-text">
                <div>GENERATING...</div>
                <div style="font-size: 0.9rem; opacity: 0.8; margin-top: 5px;">
                    <div class="loading" style="display: inline-block;"></div>
                    Processing with DistilGPT-2
                </div>
            </div>
        `;
        document.getElementById('generatedContent').innerHTML = '<p>Generating text...</p>';
    }

    showGenerationError(message) {
        const generatedResult = document.getElementById('generatedResult');
        generatedResult.className = 'sentiment-display neutral';
        generatedResult.innerHTML = `
            <div class="sentiment-icon">❌</div>
            <div class="sentiment-text">${message}</div>
        `;
    }

    displayGeneratedContent(result) {
        const generatedResult = document.getElementById('generatedResult');
        const generatedContent = document.getElementById('generatedContent');

        if (result.error || !result.success) {
            generatedResult.className = 'sentiment-display neutral';
            generatedResult.innerHTML = `
                <div class="sentiment-icon">⚠️</div>
                <div class="sentiment-text">${result.error || 'Error generating text'}</div>
            `;
            generatedContent.innerHTML = `<p>Error: ${result.error || 'Unknown error'}</p>`;
            return;
        }

        if (result.success && result.generated_texts && result.generated_texts.length > 0) {
            generatedResult.className = 'sentiment-display neutral';
            generatedResult.innerHTML = `
                <div class="sentiment-icon">✍️</div>
                <div class="sentiment-text">Generated Text (DistilGPT-2)</div>
            `;

            let contentHTML = '<h3>Generated Text:</h3>';
            result.generated_texts.forEach((text, index) => {
                contentHTML += `
                    <div class="generated-item">
                        <p><strong>Output ${index + 1}:</strong></p>
                        <p class="generated-text">${this.escapeHtml(text)}</p>
                    </div>
                `;
            });

            generatedContent.innerHTML = contentHTML;
        } else {
            generatedResult.className = 'sentiment-display neutral';
            generatedResult.innerHTML = `
                <div class="sentiment-icon">⚠️</div>
                <div class="sentiment-text">No text generated</div>
            `;
            generatedContent.innerHTML = '<p>Could not generate text. Please try again.</p>';
        }
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SentimentAnalyzer();
});