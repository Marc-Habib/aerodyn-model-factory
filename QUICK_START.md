# AeroDyn Model Factory - Quick Start Guide

## 🚀 5-Minute Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- Ollama installed

---

## Step 1: Install Ollama & Model (2 minutes)

```bash
# Download Ollama from: https://ollama.com/download/windows
# After installation, pull the model:
ollama pull llama3.1:8b
```

---

## Step 2: Start Backend (30 seconds)

```bash
cd c:\Users\marcv\Desktop\Code\systems-dynamic
python backend/api_v2.py
```

**Expected output:**
```
INFO: Application startup complete.
INFO: Uvicorn running on http://0.0.0.0:8000
```

---

## Step 3: Start Frontend (30 seconds)

**New terminal:**
```bash
cd c:\Users\marcv\Desktop\Code\systems-dynamic\frontend
npm run dev
```

**Expected output:**
```
VITE ready in XXX ms
Local: http://localhost:5173/
```

---

## Step 4: Open Browser (10 seconds)

Navigate to: **http://localhost:5173**

---

## 🎯 Your First AI-Powered Edit (2 minutes)

### 1. Enter Model Editor
Click **"Model Editor"** (green button, top right)

### 2. Start Editing
Click **"Start Editing"** button

### 3. Ask AI
Click **"Ask AI"** (purple button with ✨)

### 4. Try This Prompt
```
Add a feedback loop where regulatory pressure 
increases after incidents and reduces resources
```

### 5. Generate & Accept
1. Click **"Generate Suggestions"**
2. Wait ~10 seconds
3. Select the changes you want
4. Click **"Accept Selected"**

### 6. Validate & Apply
1. Click **"Validate"**
2. Click **"Apply Draft"**

**Done!** You've just used AI to modify a system dynamics model! 🎉

---

## 🎨 What You Can Do

### Manual Editing
- **Click nodes** to edit properties
- **Click edges** to adjust coefficients
- **Drag nodes** to reposition
- **Add new nodes** with the "+" button

### AI-Powered Editing
- **Natural language prompts** → JSON patches
- **Review suggestions** before accepting
- **Cherry-pick changes** you want
- **100% local** - no data leaves your PC

### Simulation & Analysis
- **Run simulations** with modified models
- **Compare scenarios** side-by-side
- **View feedback loops** and dependencies
- **Executive/Expert modes** for different audiences

---

## 📚 Learn More

- **Full Testing Guide:** See `TESTING_GUIDE.md`
- **Architecture Details:** See `ARCHITECTURE.md`
- **Ollama Setup:** See `OLLAMA_SETUP.md`
- **Phase Summaries:** See `PHASE_*_COMPLETE.md` files

---

## 🆘 Quick Troubleshooting

**Backend won't start:**
```bash
# Check if port 8000 is in use
netstat -ano | findstr :8000
# Kill the process if needed
```

**Frontend won't start:**
```bash
# Install dependencies first
npm install
```

**AI not available:**
```bash
# Check Ollama is running
ollama list
# Should show llama3.1:8b
```

**Endpoints return 404:**
```bash
# Pull latest code
git pull origin main
# Restart backend
```

---

## 🎓 Example Prompts to Try

**Add new variables:**
> "Add a market share variable influenced by targeting and trust"

**Create feedback loops:**
> "Create a reinforcing loop between resources and capabilities"

**Add constraints:**
> "Add a budget constraint that limits resource growth"

**Modify relationships:**
> "Make incidents have a stronger negative impact on trust"

**Add delays:**
> "Add a time delay between incidents and regulatory response"

---

## ✅ System Health Check

Run this to verify everything is working:

```bash
# Test AI service
curl http://localhost:8000/ai/status

# Test draft creation
curl -X POST http://localhost:8000/drafts \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test\"}"

# Test model endpoint
curl http://localhost:8000/config/full
```

All should return 200 OK with JSON responses.

---

## 🎉 You're Ready!

The AeroDyn Model Factory is now running on your local machine with:
- ✅ Live graph editing
- ✅ AI-powered suggestions
- ✅ Draft/patch system
- ✅ Real-time validation
- ✅ Complete privacy (100% local)

**Start building your models!** 🚀
