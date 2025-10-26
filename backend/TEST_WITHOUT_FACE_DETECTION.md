# Testing APIs Without Face Detection

## 🎯 **You Can Test 90% of Your APIs Without dlib!**

Only face detection/clustering requires `dlib`. Everything else works fine.

---

## ✅ **What You CAN Test (Without dlib):**

### **All of these work:**
- ✅ Health checks
- ✅ Event creation
- ✅ Event listing (public/private)
- ✅ Access code validation
- ✅ User profile endpoints
- ✅ Media listing
- ✅ Upload URL generation
- ✅ Event statistics

### **What you CAN'T test:**
- ❌ Face detection processing
- ❌ Face clustering
- ❌ Face search

**That's only 3 features out of 30+ endpoints!**

---

## 🚀 **Run Tests Without Face Detection**

### **Option 1: Skip face tests**
```bash
# Test everything except faces
pytest tests/test_health.py tests/test_events.py tests/test_media.py tests/test_users.py -v
```

### **Option 2: Mark face tests as optional**
Add this to `conftest.py`:
```python
import pytest

# Skip tests that need face_recognition
skip_face_tests = pytest.mark.skipif(
    not has_face_recognition(),
    reason="face_recognition not installed"
)

def has_face_recognition():
    try:
        import face_recognition
        return True
    except ImportError:
        return False
```

---

## 💡 **For Now: Test Core APIs**

Let's focus on the **high-value tests** that work immediately:

```bash
# 1. Install only what we need (skip dlib for now)
pip install fastapi uvicorn sqlalchemy asyncpg pydantic firebase-admin azure-storage-blob

# 2. Run core API tests
pytest tests/test_health.py tests/test_events.py tests/test_users.py -v
```

---

## 🔧 **If You Want to Fix dlib Later:**

### **Windows:**
1. Install CMake: https://cmake.org/download/
2. Add to PATH
3. Reinstall dlib: `pip install dlib`

### **Or Use Docker:**
Your Dockerfile already handles this! Face detection will work in Docker.


