# api_test.py
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
api_key="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"
MODEL = "Qwen/Qwen2.5-1.5B-Instruct"   # small, works on M1 Pro
device = "mps" if torch.backends.mps.is_available() else "cpu"
dtype = torch.float16 if device == "mps" else torch.float32

tokenizer = AutoTokenizer.from_pretrained(MODEL)

if device == "mps":
    # Use accelerate device mapping on Apple Silicon; do NOT call .to(device)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL,
        torch_dtype=dtype,
        device_map="auto"
    )
else:
    # CPU: load normally and move the whole model to CPU
    model = AutoModelForCausalLM.from_pretrained(
        MODEL,
        torch_dtype=dtype
    )
    model.to(device)

system = "You are a helpful assistant. Give concise, accurate answers without unnecessary explanation."
history = []

def chat_once(user_text: str) -> str:
    # For simpler, cleaner responses, we'll use minimal history
    # Just create a simple prompt without complex history
    prompt = f"System: You are a helpful assistant. Give a short, direct answer.\nUser: {user_text}\nAssistant:"

    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    with torch.no_grad():
        out = model.generate(
            **inputs,
            max_new_tokens=100,  # Reduced from 256 to get shorter responses
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            eos_token_id=tokenizer.eos_token_id,
            pad_token_id=tokenizer.eos_token_id  # Add padding token
        )
    text = tokenizer.decode(out[0], skip_special_tokens=True)
    
    # Extract only the assistant's response
    reply = text.split("Assistant:", 1)[-1].strip()
    
    # Clean up any repeated text or previous conversation fragments
    if "User:" in reply:
        reply = reply.split("User:")[0].strip()
    if "Human:" in reply:
        reply = reply.split("Human:")[0].strip()
    
    # Remove common unwanted prefixes and clean up
    unwanted_phrases = [
        "You're an AI", "I'm an AI", "As an AI", "I'm here to help",
        "feel free to ask", "Please let me know", "If you need assistance",
        "You have just learned", "You have reached", "You are an AI assistant",
        "If you have any questions"
    ]
    for phrase in unwanted_phrases:
        if phrase in reply:
            reply = reply.split(phrase)[0].strip()
    
    # Remove any trailing periods that are followed by incomplete sentences
    if reply.endswith('.'):
        # Check if the last sentence looks complete
        sentences = reply.split('.')
        if len(sentences) > 1 and sentences[-2]:  # If there's a complete sentence before the period
            reply = '.'.join(sentences[:-1]).strip() + '.'
    
    # Limit response length for chat interface
    if len(reply) > 200:
        # Find the last complete sentence within limit
        sentences = reply[:200].split('.')
        if len(sentences) > 1:
            reply = '.'.join(sentences[:-1]).strip() + '.'
        else:
            reply = reply[:200].strip() + "..."
    
    history.append((user_text, reply))
    return reply

def clear_history():
    """Clear conversation history to start fresh"""
    global history
    history = []

if __name__ == "__main__":
    while True:
        try:
            msg = input("You: ")
            if msg.strip().lower() in {"exit","quit"}:
                break
            print("Assistant:", chat_once(msg))
        except (EOFError, KeyboardInterrupt):
            break