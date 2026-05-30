import requests

OLLAMA_BASE_URL = "http://localhost:11434"

def get_ollama_models():
    """Fetch list of available models from the local Ollama API."""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=3)
        if response.status_code == 200:
            data = response.json()
            models = [model['name'] for model in data.get('models', [])]
            return sorted(models)
    except Exception:
        pass
    return []

# Default recommended model from user input, or fallback options
DEFAULT_MODEL = "qwen3:4b"

def get_best_default(available_models):
    """Return the default model if available, otherwise search for a match or fall back to the first available."""
    if not available_models:
        return DEFAULT_MODEL
        
    # Check if exactly matching default
    if DEFAULT_MODEL in available_models:
        return DEFAULT_MODEL
        
    # Check for any "qwen" models
    qwen_models = [m for m in available_models if "qwen" in m.lower()]
    if qwen_models:
        return qwen_models[0]
        
    # Fallback to the first available model
    return available_models[0]
