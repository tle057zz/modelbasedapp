# Flask Chat App with AI Model Integration + React Frontend
# This file creates a web server that serves a React chat interface and connects to a local AI model

from flask import Flask, render_template, send_from_directory, request, jsonify
import os

# Create Flask application instance
# Serve built React assets from dist/ when present. Templates fallback lives in templates/html
# We expose custom routes for CSS and JS under /css and /js when using the fallback template
app = Flask(__name__, static_folder='dist', template_folder='templates/html', static_url_path='')

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
        # Allow disabling model load in production via env var to avoid long cold starts / OOM
        # Set LOAD_LLM=1 to enable loading; default is disabled online.
        load_llm = os.getenv('LOAD_LLM', '0').strip() in {'1', 'true', 'True', 'yes'}
        if not load_llm:
            _CHAT_FN = None
            return _CHAT_FN
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
    If a React build exists in dist/index.html, serve that; otherwise render the Flask template.
    """
    # Do not attempt to export environment variables from inside a request handler.
    # Configure LOAD_LLM at process startup via your hosting provider's env vars.
    dist_index = os.path.join(app.static_folder or '', 'index.html')
    if app.static_folder and os.path.exists(dist_index):
        return send_from_directory(app.static_folder, 'index.html')
    return render_template('index.html')


# Serve CSS and JS assets from templates subfolders
@app.route('/css/<path:filename>')
def css_file(filename):
    return send_from_directory(CSS_DIR, filename)


@app.route('/js/<path:filename>')
def js_file(filename):
    return send_from_directory(JS_DIR, filename)


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

    # If the model is disabled, provide a friendly message
    if not chat_fn:
        reply = 'Model disabled on server. Demo reply: read'

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
    os.system('export LOAD_LLM=1')
    host = os.getenv('HOST', '127.0.0.1')
    # Prefer PORT, then FLASK_RUN_PORT, default 5000
    port = int(os.getenv('PORT', os.getenv('FLASK_RUN_PORT', '5000')))
    app.run(debug=True, host=host, port=port)
