# AeroDyn Model Factory - Testing Guide

## ✅ System Status

**Backend:** Running on http://localhost:8000  
**Frontend:** Running on http://localhost:5173  
**Ollama:** Available with llama3.1:8b model  
**All Endpoints:** ✅ Working

---

## 🧪 Quick Health Check

### 1. Test AI Service
```bash
curl http://localhost:8000/ai/status
```

**Expected Response:**
```json
{
  "available": true,
  "model": "llama3.1:8b",
  "ollama_url": "http://localhost:11434"
}
```

### 2. Test Draft Creation
```bash
curl -X POST http://localhost:8000/drafts \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Draft", "description": "Testing the system"}'
```

**Expected:** Draft ID returned (e.g., `draft_20260205_171715`)

### 3. Test Model Endpoint
```bash
curl http://localhost:8000/config/full
```

**Expected:** Full model configuration JSON

---

## 🎯 Complete Workflow Test

### **Scenario: Add a New Feedback Loop Using AI**

#### Step 1: Open the Application
1. Navigate to http://localhost:5173
2. You should see the AeroDyn dashboard

#### Step 2: Enter Model Editor
1. Click the **"Model Editor"** button (green, top right)
2. Graph visualization should appear with nodes and edges

#### Step 3: Create a Draft
1. Click **"Start Editing"** button
2. Draft panel should appear on the right
3. Status should show "Active Draft"

#### Step 4: Use AI Assistant
1. Click **"Ask AI"** button (purple with sparkle icon)
2. AI modal should open

#### Step 5: Generate AI Suggestions
1. Enter this prompt:
   ```
   Add a feedback loop where regulatory pressure increases 
   after incidents and reduces available resources
   ```
2. Click **"Generate Suggestions"**
3. Wait 5-10 seconds for Ollama to generate
4. AI proposals should appear with purple badges

#### Step 6: Review and Accept
1. Review each proposed change
2. Check the boxes for changes you want
3. Click **"Accept Selected (X)"**
4. Changes should appear in the Draft Panel

#### Step 7: Validate Draft
1. Click **"Validate"** button
2. Should show validation results
3. Check for any errors

#### Step 8: Apply Draft
1. Click **"Apply Draft"** button
2. Confirm the action
3. Draft should be merged into the model

---

## 🔧 Manual Editing Test

### **Scenario: Edit an Existing Node**

#### Step 1: Click a Node
1. In the graph editor, click any node (e.g., "Targeting")
2. Node edit modal should open

#### Step 2: Modify Properties
1. Change the **Name** (e.g., "Advanced Targeting")
2. Adjust **Initial Value** (e.g., 0.6)
3. Update **Business Meaning**
4. Click **"Save Changes"**

#### Step 3: Verify Changes
1. Node should update in the graph
2. Change should appear in Draft Panel
3. Badge should show on the node

### **Scenario: Edit an Edge**

#### Step 1: Click an Edge
1. Click any edge (connection line)
2. Edge edit modal should open

#### Step 2: Modify Coefficient
1. Adjust the **Coefficient** slider
2. Update **Description**
3. Click **"Save Changes"**

#### Step 3: Verify Changes
1. Edge color/thickness should update
2. Change should appear in Draft Panel

---

## 🎨 Visual Feedback Test

### **Check Visual Indicators:**

✅ **Added Nodes** - Green border + "NEW" badge  
✅ **Modified Nodes** - Yellow border + "MOD" badge  
✅ **Removed Nodes** - Red border + "DEL" badge  
✅ **Added Edges** - Green dashed line  
✅ **Modified Edges** - Yellow line  
✅ **Removed Edges** - Red dashed line  

---

## 🤖 AI Generation Test Cases

### Test Case 1: Add New Variable
**Prompt:**
```
Add a market share variable that depends on targeting capability and trust
```

**Expected:**
- New state variable "M" or similar
- Relations from T → M and L → M
- Appropriate coefficients

### Test Case 2: Create Feedback Loop
**Prompt:**
```
Create a reinforcing loop between trust and resources
```

**Expected:**
- Relation from L → R (trust increases resources)
- Relation from R → L (resources increase trust)
- Positive coefficients

### Test Case 3: Add Constraint
**Prompt:**
```
Add a budget constraint that limits resource growth
```

**Expected:**
- New parameter for budget
- Modified equation for resources
- Constraint logic in DSL

### Test Case 4: Modify Relationship
**Prompt:**
```
Make incidents have a stronger negative impact on trust
```

**Expected:**
- Update to X → L relation
- More negative coefficient (e.g., -0.8 instead of -0.5)

---

## 🐛 Troubleshooting

### Issue: "Ask AI" button not showing
**Solution:** Check Ollama is running
```bash
ollama list
# Should show llama3.1:8b
```

### Issue: Draft creation fails (404)
**Solution:** Verify backend is running with updated code
```bash
# Check backend logs for /drafts endpoint
# Should see: POST /drafts 200 OK (not 404)
```

### Issue: AI generation takes too long
**Possible causes:**
- First generation is slower (model loading)
- Complex prompt requires more processing
- System resources (check RAM usage)

**Solution:** Wait up to 30 seconds, or use simpler prompts

### Issue: Validation errors
**Common causes:**
- Invalid equation syntax
- Missing dependencies
- Circular references

**Solution:** Review the error message in validation results

### Issue: Graph not rendering
**Solution:** 
- Check browser console for errors
- Verify `/config/full` endpoint returns data
- Refresh the page

---

## 📊 Performance Benchmarks

**Expected Performance:**

| Operation | Time | Notes |
|-----------|------|-------|
| Load graph | < 1s | Initial render |
| Create draft | < 100ms | Backend operation |
| Add node | < 50ms | UI update |
| Edit node | < 100ms | Modal + save |
| AI generation | 5-15s | Depends on prompt |
| Validate draft | < 500ms | DSL validation |
| Apply draft | < 1s | Merge + save |

---

## 🎯 Success Criteria

**The system is working correctly if:**

✅ All endpoints return 200 OK (not 404)  
✅ Graph editor loads and displays nodes/edges  
✅ Draft can be created and changes tracked  
✅ AI status shows `available: true`  
✅ AI generates valid JSON patches  
✅ Node/edge editing modals work  
✅ Visual indicators show change types  
✅ Validation catches errors  
✅ Draft can be applied successfully  

---

## 🚀 Next Steps After Testing

Once all tests pass:

1. **Experiment with AI prompts** - Try different scenarios
2. **Build complex models** - Add multiple variables
3. **Test edge cases** - Invalid inputs, circular deps
4. **Export models** - Save your work
5. **Run simulations** - Test with modified models

---

## 📝 Reporting Issues

If you find bugs, note:
- What you were doing
- Expected vs actual behavior
- Browser console errors
- Backend logs
- Steps to reproduce

---

**Happy Testing!** 🎉

The AeroDyn Model Factory is ready for production use!
