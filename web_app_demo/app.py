# Flask Chat App with AI Model Integration + React Frontend
# This file creates a web server that serves a React chat interface and connects to a local AI model

from flask import Flask, render_template, send_from_directory, request, jsonify
import os

# Create Flask application instance
# static_folder='dist' serves the React build files
# template_folder='dist' serves the React index.html
app = Flask(__name__, static_folder='dist', template_folder='dist', static_url_path='')

# Setup file paths for serving static assets (CSS, JS)
# These paths allow us to serve CSS and JS files from custom template subdirectories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # Get current directory
TEMPLATES_DIR = os.path.join(BASE_DIR, 'templates')     # templates/ folder
CSS_DIR = os.path.join(TEMPLATES_DIR, 'css')           # templates/css/ folder
JS_DIR = os.path.join(TEMPLATES_DIR, 'js')             # templates/js/ folder

# Lazy loading pattern for AI model to avoid slow startup
# The model is heavy to load, so we only import it when first needed
_CHAT_FN = None  # Global variable to cache the chat function

def get_chat_fn():
    """
    Lazy loader for the AI chat function.
    Only imports and loads the model on first use to keep startup fast.
    Returns None if model fails to load (fallback to 'read' response).
    """
    global _CHAT_FN
    if _CHAT_FN is None:  # First time calling this function
        try:
            from py_functions.api_llm import chat_once  # Import the AI model function
            _CHAT_FN = chat_once  # Cache it for future use
        except Exception:
            # If model fails to load (missing dependencies, etc.), set to None
            _CHAT_FN = None
    return _CHAT_FN


# ROUTE DEFINITIONS
# Routes define what happens when users visit different URLs

@app.route('/')
def index():
    """
    Main page route - serves the React chat interface.
    When user visits http://127.0.0.1:5000/, this function runs.
    render_template() finds dist/index.html (React build output).
    """
    return render_template('index.html')


# Remove the custom static route - Flask will handle it automatically with static_url_path=''


@app.post('/api/send')
def api_send():
    """
    API endpoint for chat messages.
    Receives POST requests with JSON: {"text": "user message"}
    Processes the message through the AI model and returns JSON response.
    """
    # Parse JSON from request body, default to empty dict if parsing fails
    data = request.get_json(silent=True) or {}
    text = data.get('text', '')  # Extract 'text' field, default to empty string

    # Default response - will be overridden if model works
    reply = 'read'
    
    # Try to get the AI chat function
    chat_fn = get_chat_fn()
    if chat_fn and text:  # If model loaded successfully and we have text
        try:
            # Call the AI model with user's text
            reply = chat_fn(text) or 'read'  # Fallback to 'read' if model returns empty
        except Exception:
            # If model crashes during processing, use fallback
            reply = 'read'

    # Return JSON response that JavaScript can process
    return jsonify({
        'you': text,      # Echo back what user said
        'answer': reply   # AI's response (or 'read' fallback)
    })


if __name__ == '__main__':
    """
    This block runs only when script is executed directly (not imported).
    Starts the Flask development server.
    debug=True enables hot reloading and error details.
    host='127.0.0.1' means only accept connections from localhost.
    port=5000 means server runs on http://127.0.0.1:5000
    """
    app.run(debug=True, host='127.0.0.1', port=5000)
