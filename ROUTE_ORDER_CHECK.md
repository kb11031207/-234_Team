# ✅ Backend Route Ordering - VERIFIED

**Date:** October 26, 2025  
**Issue Fixed:** Route ordering causing 500 errors

---

## 🐛 **The Problem**

FastAPI matches routes in the order they're registered. If a parameterized route like `/{id}` comes before specific routes like `/public`, the parameterized route will catch ALL requests.

**Example of the bug:**
```python
# ❌ WRONG ORDER
@router.get("/{event_id}")      # Catches EVERYTHING including "/public"
@router.get("/public")           # NEVER REACHED!

# When calling GET /events/public:
# FastAPI matches /{event_id} with event_id="public"
# Tries to parse "public" as UUID → CRASH!
```

**Correct order:**
```python
# ✅ CORRECT ORDER
@router.get("/public")           # Specific route first
@router.get("/{event_id}")       # Parameterized route last
```

---

## ✅ **VERIFIED: `events.py` - FIXED**

**Routes in correct order:**

1. `POST /` - Create event (no conflict)
2. `GET /public` - Get public events ✅ (MOVED UP - FIXED!)
3. `GET /me/events` - Get my events ✅ (specific path)
4. `POST /validate-access` - Validate access code ✅ (specific path)
5. `GET /{event_id}` - Get event by ID ✅ (parameterized - comes last)
6. `PUT /{event_id}` - Update event ✅ (parameterized)
7. `DELETE /{event_id}` - Delete event ✅ (parameterized)

**Status:** ✅ All routes ordered correctly!

---

## ✅ **VERIFIED: `media.py` - CORRECT**

**Routes in correct order:**

1. `POST /upload-url` - Get presigned upload URL ✅ (specific path)
2. `POST /{media_id}/confirm` - Confirm upload ✅ (parameterized but POST method)
3. `GET /events/{event_id}/media` - List event media ✅ (multi-segment path)

**Why this is safe:**
- `/upload-url` is specific and comes first
- `/{media_id}/confirm` uses POST (won't conflict with GET routes)
- `/events/{event_id}/media` has multiple segments so won't conflict

**Status:** ✅ No issues!

**Note:** If we ever add `GET /{media_id}`, it must come AFTER `/events/{event_id}/media`

---

## ✅ **VERIFIED: `faces.py` - CORRECT**

**Routes in correct order:**

1. `POST /search` - Search for faces ✅ (specific path)
2. `GET /events/{event_id}/clusters` - Get face clusters ✅ (multi-segment path)

**Status:** ✅ No issues! All routes are specific or multi-segment.

---

## ✅ **VERIFIED: `auth.py` - CORRECT**

**Routes in correct order:**

1. `POST /register` - Register/login user ✅ (specific path)
2. `GET /me` - Get current user ✅ (specific path)

**Status:** ✅ No issues! All routes are specific.

---

## 📋 **FastAPI Route Ordering Rules**

### **Rule 1: Specific Before General**
```python
# ✅ CORRECT
@router.get("/public")
@router.get("/special")
@router.get("/{id}")

# ❌ WRONG
@router.get("/{id}")
@router.get("/public")    # Never reached!
```

### **Rule 2: Multi-segment Paths Are More Specific**
```python
# ✅ These don't conflict
@router.get("/events/{event_id}/media")  # More specific
@router.get("/{media_id}")                # Less specific

# FastAPI matches longest/most specific path first
```

### **Rule 3: Different HTTP Methods Don't Conflict**
```python
# ✅ These don't conflict
@router.get("/{id}")      # GET method
@router.post("/{id}")     # POST method
@router.put("/{id}")      # PUT method
```

### **Rule 4: Check Route Registration Order**
Visit `http://localhost:8000/docs` - routes are listed in the order they're registered.

---

## 🧪 **Testing Routes**

### **Test Specific Routes First**
```bash
# Should return list of public events
curl http://localhost:8000/api/v1/events/public

# Should return current user's events (with auth)
curl http://localhost:8000/api/v1/events/me/events

# Should validate access code
curl -X POST http://localhost:8000/api/v1/events/validate-access \
  -H "Content-Type: application/json" \
  -d '{"access_code":"ABC123"}'
```

### **Test Parameterized Routes**
```bash
# Should return specific event
curl http://localhost:8000/api/v1/events/{uuid-here}
```

---

## 🔍 **How to Detect Route Ordering Issues**

### **Symptom 1: Invalid UUID Error**
```
asyncpg.exceptions.DataError: invalid input for query argument $1: 'public' 
(invalid UUID 'public': length must be between 32..36 characters, got 6)
```
**Cause:** Parameterized route catching specific route name

### **Symptom 2: 404 on Known Routes**
- Route exists in code but returns 404
- **Cause:** Another route catching it first

### **Symptom 3: Wrong Endpoint Being Called**
- Check backend logs to see which function is executing
- If wrong function runs, check route order

---

## ✅ **Current Status: ALL FIXED**

- ✅ `events.py` - Route order corrected
- ✅ `media.py` - No issues found
- ✅ `faces.py` - No issues found  
- ✅ `auth.py` - No issues found

**Backend API is now fully operational!** 🚀

---

## 📝 **Future Checklist**

When adding new routes, always:

1. ✅ Put specific paths BEFORE parameterized paths
2. ✅ Put multi-segment paths BEFORE single-segment paths
3. ✅ Test the new route immediately
4. ✅ Check `http://localhost:8000/docs` to verify route order
5. ✅ Test that existing routes still work

---

## 🎯 **Quick Reference**

**Correct Pattern:**
```python
@router.get("/specific1")        # 1. Most specific
@router.get("/specific2")        # 2. Still specific
@router.get("/path/{id}/sub")    # 3. Multi-segment with param
@router.get("/{id}")             # 4. Single param (least specific)
```

**Remember:** When in doubt, put the more specific route first!

