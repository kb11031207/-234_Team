# API Testing Strategy

## 🎯 **Test Categories by Complexity**

### ✅ **Level 1: Simple Tests (No Dependencies)**
These work out of the box:
- `GET /health` - Just returns JSON
- `GET /` - Just returns JSON

**Can test:** ✅ Immediately
**Dependencies:** None

---

### ✅ **Level 2: Tests with DB (Mocked)**
These need database but we can mock it:
- `GET /api/v1/events/public` - List public events
- `GET /api/v1/events/{event_id}` - Get event by ID
- `POST /api/v1/events/validate-access` - Validate access code
- `GET /api/v1/media/events/{event_id}/media` - List media

**Can test:** ✅ With mocked database
**Dependencies:** SQLAlchemy (mock)

---

### ⚠️ **Level 3: Tests with Auth (Mocked)**
These need Firebase auth but we can mock:
- `POST /api/v1/events` - Create event (needs user)
- `GET /api/v1/events/me/events` - My events (needs user)
- `GET /api/v1/users/me` - Get profile (needs user)
- `PUT /api/v1/users/me` - Update profile (needs user)

**Can test:** ✅ With mocked auth
**Dependencies:** Firebase (mock)

---

### 🔧 **Level 4: Complex Integration Tests**
These need external services:
- Face detection (needs face_recognition library)
- Face clustering (needs actual images)
- Azure Blob upload (needs Azure)

**Can test:** ⚠️ With mocks OR real test data
**Dependencies:** Multiple

---

## 🧪 **Testing Approach**

### **Phase 1: Unit Tests (Fast, No External Deps)**
Test individual endpoints with mocked dependencies
- Run in < 1 second
- No database needed
- No Azure needed
- No Firebase needed

### **Phase 2: Integration Tests (With Real DB)**
Test with actual database (SQLite for testing)
- Slower but more realistic
- Verify DB queries work
- Test transactions

### **Phase 3: E2E Tests (Full Stack)**
Test entire workflows with real services
- Slow but comprehensive
- Use test database
- Mock external APIs (Azure, Firebase)

---

## 🎯 **What to Test First**

### **Priority 1: Core Endpoints (High Value, Easy)**
1. Health check
2. Public events listing
3. Event creation
4. Media listing
5. Access code validation

### **Priority 2: Auth Endpoints (Important)**
6. User profile
7. My events listing

### **Priority 3: Face Features (Complex)**
8. Face search
9. Face clustering
10. Cluster identification

---

## 📋 **Test Checklist**

### ✅ **What Each Test Should Verify:**

#### **For GET Endpoints:**
- [ ] Returns 200 OK
- [ ] Response matches schema
- [ ] Handles empty results
- [ ] Handles pagination
- [ ] Returns 404 for invalid IDs

#### **For POST Endpoints:**
- [ ] Returns 201 Created
- [ ] Validates required fields
- [ ] Returns 422 for invalid input
- [ ] Returns 401 if auth required
- [ ] Creates resource in DB

#### **For PUT Endpoints:**
- [ ] Returns 200 OK
- [ ] Updates only provided fields
- [ ] Returns 404 for invalid IDs
- [ ] Returns 401 if auth required

---

## 🛠️ **Testing Tools**

### **Required Packages:**
```bash
pytest>=7.4.0              # Test framework
pytest-asyncio>=0.21.0     # Async test support
httpx>=0.25.0              # Async HTTP client (for FastAPI)
pytest-cov>=4.1.0          # Coverage reporting
faker>=20.0.0              # Generate test data
```

### **Mocking Tools:**
```bash
pytest-mock>=3.12.0        # Mocking
unittest.mock              # Built-in Python mocking
```

---

## 📊 **Test Organization**

```
backend/tests/
├── __init__.py
├── conftest.py              # Shared fixtures
├── test_health.py           # Simple tests
├── test_events.py           # Event endpoints
├── test_media.py            # Media endpoints
├── test_faces.py            # Face endpoints
├── test_users.py            # User endpoints
├── integration/
│   ├── test_event_flow.py   # Full event creation flow
│   └── test_upload_flow.py  # Upload → detect → cluster
└── mocks/
    ├── mock_db.py           # Database mocks
    ├── mock_auth.py         # Firebase mocks
    └── mock_azure.py        # Azure service mocks
```

---

## 🎯 **Testing Strategy Summary**

1. **Start Simple** - Test health and root endpoints
2. **Mock Early** - Don't wait for real services
3. **Test What Matters** - Focus on business logic
4. **Fast Tests Win** - Unit tests should be < 1s
5. **Integration Later** - Once unit tests pass


