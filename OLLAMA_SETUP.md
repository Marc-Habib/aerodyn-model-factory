# Ollama Setup Guide for AeroDyn Model Factory

## 🤖 Local AI Integration with Ollama

This guide helps you set up Ollama for local AI-powered patch generation.

---

## 📥 Installation

### 1. Download Ollama

**Windows:**
- Download from: https://ollama.com/download/windows
- Run the installer
- Ollama will start automatically as a service

**Verify Installation:**
```bash
ollama --version
```

---

## 🧠 Recommended Model: Llama 3.1 (8B)

For system dynamics modeling and patch generation, we recommend **Llama 3.1 8B**:
- **Size:** ~4.7GB
- **RAM Required:** 8GB minimum
- **Speed:** Fast on local PC
- **Quality:** Excellent for structured JSON generation

### Pull the Model

```bash
ollama pull llama3.1:8b
```

**Alternative Models:**

If you have more RAM (16GB+):
```bash
# Larger, more capable
ollama pull llama3.1:70b
```

If you want faster responses (lower quality):
```bash
# Smaller, faster
ollama pull llama3.1:3b
```

For code-focused tasks:
```bash
# Specialized for code generation
ollama pull codellama:13b
```

---

## ✅ Verify Ollama is Running

```bash
# Test the API
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.1:8b",
  "prompt": "Say hello",
  "stream": false
}'
```

**Expected response:** JSON with generated text

---

## 🔧 Backend Integration

The backend will use Ollama's REST API at `http://localhost:11434`

**No API keys needed** - it's all local!

---

## 🚀 Usage in AeroDyn

Once Ollama is running:

1. **Start Ollama** (should auto-start on Windows)
2. **Start backend:** `python backend/api_v2.py`
3. **Start frontend:** `npm run dev`
4. **Click "Ask AI"** in Model Editor
5. **Enter prompt:** e.g., "Add a feedback loop for regulatory pressure"
6. **Review AI suggestions** (shown in green)
7. **Accept/edit/reject** each proposed change

---

## 📊 Model Comparison

| Model | Size | RAM | Speed | Quality | Best For |
|-------|------|-----|-------|---------|----------|
| llama3.1:3b | 2GB | 4GB | ⚡⚡⚡ | ⭐⭐ | Quick tests |
| llama3.1:8b | 4.7GB | 8GB | ⚡⚡ | ⭐⭐⭐⭐ | **Recommended** |
| llama3.1:70b | 40GB | 64GB | ⚡ | ⭐⭐⭐⭐⭐ | High quality |
| codellama:13b | 7.4GB | 16GB | ⚡⚡ | ⭐⭐⭐⭐ | Code generation |

---

## 🛠️ Troubleshooting

### Ollama not responding
```bash
# Restart Ollama service (Windows)
# Close Ollama from system tray and restart
```

### Model not found
```bash
# List installed models
ollama list

# Pull the model
ollama pull llama3.1:8b
```

### Out of memory
- Use a smaller model (3b instead of 8b)
- Close other applications
- Increase system RAM if possible

### Slow responses
- Use a smaller model
- Reduce prompt length
- Ensure no other heavy processes running

---

## 🎯 What the AI Will Do

The AI will analyze your model and generate **patch operations** in JSON format:

**Example Prompt:**
> "Add a mechanism that models regulatory delay after incidents"

**AI Response (JSON):**
```json
{
  "changes": [
    {
      "op": "add_state",
      "symbol": "G",
      "data": {
        "name": "Regulatory Pressure",
        "initial": 0.1,
        "category": "governance"
      },
      "reason": "Models regulatory response to incidents"
    },
    {
      "op": "add_relation",
      "id": "rel.X_to_G",
      "data": {
        "source": "X",
        "target": "G",
        "coefficient": 0.6
      },
      "reason": "Incidents trigger regulatory pressure"
    }
  ]
}
```

The UI will show these as **green proposals** that you can accept/edit/reject!

---

## 🔒 Privacy & Security

✅ **100% Local** - No data sent to external servers  
✅ **No API keys** - No accounts or subscriptions  
✅ **Offline capable** - Works without internet  
✅ **Your data stays yours** - Complete privacy  

---

## 📚 Resources

- Ollama Documentation: https://ollama.com/docs
- Llama 3.1 Model Card: https://ollama.com/library/llama3.1
- AeroDyn Architecture: See `ARCHITECTURE.md`

---

**Ready to use AI-powered model editing!** 🚀
