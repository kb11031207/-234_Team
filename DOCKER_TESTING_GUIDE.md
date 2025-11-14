# Docker Testing Guide: Hybrid Face Search & Clustering

## 🚀 Quick Start

Since your `docker-compose.yml` uses volume mounts with `--reload`, the changes should **automatically reload** in the container. However, here's how to verify and test:

---

## Step 1: Verify Containers Are Running

```bash
# Check if containers are running
docker-compose ps

# Expected output:
# event-photos-backend    running
# event-photos-db         running
# event-photos-frontend   running
```

---

## Step 2: Restart Backend (If Needed)

If the backend didn't auto-reload, restart it:

```bash
# Restart just the backend container
docker-compose restart backend

# Or rebuild if you made dependency changes
docker-compose up -d --build backend
```

---

## Step 3: Check Backend Logs

Watch the logs to see if the new code is loaded:

```bash
# View backend logs
docker-compose logs -f backend

# Look for:
# - "FaceProcessingQueue initialized"
# - No import errors
# - Server started successfully
```

---

## Step 4: Verify Code Changes Are Loaded

### Option A: Check via API Health Endpoint

```bash
# Test if backend is responding
curl http://localhost:8000/health

# Or check API docs
open http://localhost:8000/docs
```

### Option B: Check Logs for New Functions

```bash
# In another terminal, trigger a search to see new logs
# The logs should show hybrid search messages
```

---

## Step 5: Test Phase 1 - Hybrid Search

### Test 1: Search with Existing Clusters

1. **Upload some photos** to an event (if you don't have any)
2. **Wait for clustering** (or trigger manually)
3. **Upload a selfie** and search
4. **Check logs** - should see:
   ```
   Searching X existing clusters
   Searching Y unclustered faces
   ```

### Test 2: Search with Unclustered Faces

1. **Upload new photos** (but don't wait for clustering)
2. **Immediately search** with selfie
3. **Should find** both clustered and unclustered faces
4. **Check logs** - should trigger background clustering

### Test via API:

```bash
# Search by selfie
curl -X POST "http://localhost:8000/api/faces/search-by-selfie?event_id=YOUR_EVENT_ID" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@your_selfie.jpg"
```

---

## Step 6: Test Phase 2 - Hybrid Clustering

### Test 1: Incremental Clustering (Small Batch)

1. **Have an event** with existing clusters (≥100 faces)
2. **Upload 5-10 new photos** (small batch)
3. **Wait for clustering** to trigger (or trigger manually)
4. **Check logs** - should see:
   ```
   Using INCREMENTAL clustering: X new faces, Y total faces
   ```

### Test 2: Full Rebuild (Large Batch)

1. **Upload 100+ new photos** at once
2. **Trigger clustering**
3. **Check logs** - should see:
   ```
   Using FULL REBUILD clustering: X total faces
   ```

### Test via API:

```bash
# Trigger clustering (will auto-decide)
curl -X POST "http://localhost:8000/api/faces/events/YOUR_EVENT_ID/trigger-clustering"

# Force full rebuild
curl -X POST "http://localhost:8000/api/faces/events/YOUR_EVENT_ID/trigger-clustering?force_full_rebuild=true"
```

---

## Step 7: Monitor Performance

### Check Response Times

```bash
# Time a search request
time curl -X POST "http://localhost:8000/api/faces/search-by-selfie?event_id=YOUR_EVENT_ID" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@your_selfie.jpg"
```

### Check Logs for Performance

Look for log messages showing:
- Number of clusters searched
- Number of unclustered faces searched
- Clustering method used (incremental vs full rebuild)
- Time taken

---

## Troubleshooting

### Issue: Changes Not Reflecting

**Solution 1: Restart Backend**
```bash
docker-compose restart backend
```

**Solution 2: Rebuild Container**
```bash
docker-compose up -d --build backend
```

**Solution 3: Check Volume Mounts**
```bash
# Verify volumes are mounted correctly
docker-compose exec backend ls -la /app/app/services/face_clustering.py
```

### Issue: Import Errors

**Check logs:**
```bash
docker-compose logs backend | grep -i error
```

**Common fixes:**
- Ensure all imports are correct
- Check Python syntax
- Verify file paths

### Issue: Database Connection

**Check database:**
```bash
# Check if DB is healthy
docker-compose ps db

# Check DB logs
docker-compose logs db
```

---

## Quick Test Script

Create a test script to verify everything works:

```python
# test_hybrid_search.py
import requests
import time

EVENT_ID = "your-event-id-here"
API_BASE = "http://localhost:8000/api/faces"

# Test 1: Search by selfie
print("Testing hybrid search...")
start = time.time()
response = requests.post(
    f"{API_BASE}/search-by-selfie",
    params={"event_id": EVENT_ID},
    files={"file": open("test_selfie.jpg", "rb")}
)
elapsed = time.time() - start
print(f"Search took {elapsed:.2f} seconds")
print(f"Found {response.json()['total']} photos")

# Test 2: Trigger clustering
print("\nTesting clustering...")
response = requests.post(
    f"{API_BASE}/events/{EVENT_ID}/trigger-clustering"
)
print(f"Clustering status: {response.json()['status']}")
```

---

## Expected Behavior

### Before (Old Code):
- Search: Compares against ALL faces (slow)
- Clustering: Always full rebuild (slow)

### After (New Code):
- Search: Compares against clusters + unclustered (fast!)
- Clustering: Auto-chooses incremental or full rebuild (smart!)

---

## Verification Checklist

- [ ] Backend container is running
- [ ] No import errors in logs
- [ ] Search endpoint responds
- [ ] Search uses hybrid approach (check logs)
- [ ] Clustering uses smart decision (check logs)
- [ ] Performance improved (faster searches)
- [ ] Results are correct (finds all photos)

---

## Next Steps

1. **Test with real data** - Upload photos and test searches
2. **Monitor logs** - Watch for performance improvements
3. **Compare times** - Before vs after performance
4. **Verify correctness** - Ensure all photos are found

---

## Useful Commands

```bash
# View all logs
docker-compose logs -f

# View only backend logs
docker-compose logs -f backend

# Restart all services
docker-compose restart

# Stop all services
docker-compose down

# Start fresh
docker-compose up -d

# Execute command in backend container
docker-compose exec backend python -c "from app.services.face_clustering import cluster_event_faces; print('Import OK')"
```

---

*Happy Testing! 🚀*

