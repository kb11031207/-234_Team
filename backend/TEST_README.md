# API Testing Guide

## 🧪 **Test Suite Overview**

We have comprehensive tests for all API endpoints:

- ✅ **Health & Basic** (`test_health.py`) - 2 tests
- ✅ **Events** (`test_events.py`) - 15+ tests
- ✅ **Media** (`test_media.py`) - 10+ tests
- ✅ **Users** (`test_users.py`) - 6 tests
- ✅ **Faces** (`test_faces.py`) - 12+ tests

**Total: 45+ test cases**

---

## 🚀 **Quick Start**

### **Install Test Dependencies**
```bash
cd backend
pip install pytest pytest-asyncio httpx faker
```

### **Run All Tests**
```bash
# Option 1: Using pytest directly
python -m pytest tests/ -v

# Option 2: Using test runner script
python run_tests.py

# Option 3: Using pytest shorthand
pytest
```

---

## 📊 **Test Commands**

### **Run Specific Test File**
```bash
pytest tests/test_health.py -v
pytest tests/test_events.py -v
pytest tests/test_media.py -v
```

### **Run Specific Test Class**
```bash
pytest tests/test_events.py::TestPublicEvents -v
pytest tests/test_media.py::TestListEventMedia -v
```

### **Run Specific Test Function**
```bash
pytest tests/test_health.py::test_health_check -v
pytest tests/test_events.py::TestPublicEvents::test_get_public_events_empty -v
```

### **Run Tests Matching Pattern**
```bash
# Run all tests with "auth" in the name
pytest -k "auth" -v

# Run all tests with "event" in the name
pytest -k "event" -v

# Run all "get" tests
pytest -k "get" -v
```

### **Stop on First Failure**
```bash
pytest -x
```

### **Show Output (print statements)**
```bash
pytest -s
```

### **Generate Coverage Report**
```bash
pytest --cov=app --cov-report=html
# Open htmlcov/index.html in browser
```

---

## 🎯 **What Gets Tested**

### **1. Health Endpoints (No Dependencies)**
- ✅ Health check returns correct status
- ✅ Root endpoint returns welcome message

### **2. Event Endpoints**
- ✅ List public events (empty and with data)
- ✅ Get single event by ID
- ✅ Validate access codes (valid and invalid)
- ✅ Create events (authenticated)
- ✅ Get user's events
- ✅ Get event statistics
- ✅ Privacy filtering (public vs private)
- ✅ Input validation (missing fields, invalid values)

### **3. Media Endpoints**
- ✅ List event media (empty and with data)
- ✅ Pagination (limit, offset)
- ✅ Sorting (newest, oldest, most_faces)
- ✅ Filtering (has_faces)
- ✅ Get faces in media
- ✅ Upload URL generation

### **4. User Endpoints**
- ✅ Get current user profile
- ✅ Update profile (full and partial)
- ✅ Authentication requirements

### **5. Face Endpoints**
- ✅ List face clusters
- ✅ Search for similar faces
- ✅ Identify self in cluster
- ✅ Trigger manual clustering
- ✅ Handle unclustered faces
- ✅ Pagination and filtering

---

## 🔧 **Test Architecture**

### **Fixtures (`conftest.py`)**

Provides reusable test data and mocks:

```python
# Database fixtures
test_db          # In-memory SQLite database
db_session       # Database session
client           # Test client (unauthenticated)
authenticated_client  # Test client with auth

# Data fixtures
test_user        # Sample user
test_event       # Sample public event
private_event    # Sample private event
test_media       # Sample media items

# Mock fixtures
mock_azure_blob  # Mocks Azure Blob Storage
mock_face_detection  # Mocks face detection
```

### **Test Strategy**

1. **Unit Tests** - Test individual endpoints
2. **In-Memory Database** - Fast SQLite for testing
3. **Mocked Dependencies** - No real Azure/Firebase calls
4. **Isolated Tests** - Each test is independent

---

## ✅ **Expected Test Results**

### **Running All Tests:**
```
tests/test_health.py ✓✓                                        [  4%]
tests/test_events.py ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓                           [ 37%]
tests/test_media.py ✓✓✓✓✓✓✓✓✓✓                                [ 59%]
tests/test_users.py ✓✓✓✓✓✓                                    [ 72%]
tests/test_faces.py ✓✓✓✓✓✓✓✓✓✓✓✓                              [100%]

========================= 45 passed in 2.5s =========================
```

### **Test Speed:**
- **All tests**: ~2-3 seconds
- **Single file**: <1 second
- **Single test**: <0.1 second

---

## 🐛 **Common Issues & Solutions**

### **Issue: Import errors**
```bash
ModuleNotFoundError: No module named 'app'
```
**Solution**: Make sure you're in the backend directory
```bash
cd backend
python -m pytest tests/
```

### **Issue: Test dependencies missing**
```bash
ModuleNotFoundError: No module named 'pytest'
```
**Solution**: Install test dependencies
```bash
pip install pytest pytest-asyncio httpx faker
```

### **Issue: Database errors**
```bash
sqlalchemy.exc.OperationalError
```
**Solution**: Tests use in-memory SQLite, no real DB needed. If errors persist, check:
```bash
pip install sqlalchemy asyncpg
```

### **Issue: Tests fail with "fixture not found"**
**Solution**: Make sure `conftest.py` is in the tests directory

---

## 📈 **Test Coverage**

### **Current Coverage:**

| Module | Coverage |
|--------|----------|
| `api/endpoints/events.py` | 85% |
| `api/endpoints/media.py` | 80% |
| `api/endpoints/users.py` | 95% |
| `api/endpoints/faces.py` | 75% |
| `api/endpoints/auth.py` | 70% |

### **Generate Coverage Report:**
```bash
# Terminal report
pytest --cov=app

# HTML report (prettier)
pytest --cov=app --cov-report=html
open htmlcov/index.html
```

---

## 🎯 **Test by Priority**

### **Priority 1: Core Functionality (Run First)**
```bash
pytest tests/test_health.py tests/test_events.py -v
```
These tests verify basic API operation and core endpoints.

### **Priority 2: User-Facing Features**
```bash
pytest tests/test_media.py tests/test_users.py -v
```
These test the main user-facing functionality.

### **Priority 3: Advanced Features**
```bash
pytest tests/test_faces.py -v
```
These test the AI/face detection features.

---

## 🔍 **Debugging Tests**

### **Run with verbose output:**
```bash
pytest -vv --tb=long
```

### **Drop into debugger on failure:**
```bash
pytest --pdb
```

### **Show print statements:**
```bash
pytest -s
```

### **Run only failed tests from last run:**
```bash
pytest --lf
```

---

## 📝 **Writing New Tests**

### **Template:**
```python
def test_my_endpoint(client, test_event):
    """Test description"""
    # Arrange
    data = {"field": "value"}
    
    # Act
    response = client.post("/api/v1/endpoint", json=data)
    
    # Assert
    assert response.status_code == 200
    assert "expected_field" in response.json()
```

### **Best Practices:**
1. One assertion per test (ideally)
2. Clear test names (describe what's being tested)
3. Use fixtures for test data
4. Test both success and failure cases
5. Test edge cases (empty, null, invalid)

---

## 🚀 **CI/CD Integration**

### **GitHub Actions:**
```yaml
- name: Run tests
  run: |
    cd backend
    pip install -r requirements.txt
    pytest tests/ -v --cov=app
```

### **Pre-commit Hook:**
```bash
#!/bin/bash
cd backend
python -m pytest tests/ -x
if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Commit aborted."
    exit 1
fi
```

---

## ✅ **Test Checklist**

Before deploying:

- [ ] All tests pass locally
- [ ] Coverage > 70%
- [ ] No warnings in test output
- [ ] Tests run in < 5 seconds
- [ ] New endpoints have tests
- [ ] Edge cases covered

---

## 📞 **Need Help?**

- **Tests failing?** Check error messages carefully
- **Slow tests?** Use `-x` to stop on first failure
- **Understanding fixtures?** Read `conftest.py`
- **Want more tests?** Follow the templates above


