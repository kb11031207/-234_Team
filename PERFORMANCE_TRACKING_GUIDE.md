# Performance Tracking Guide

## 🎯 How to Track Performance

Now that performance tracking is added, here's how to see the improvements:

---

## Method 1: Check Backend Logs (Easiest)

### Watch logs in real-time:

```bash
# Watch backend logs
docker-compose logs -f backend | grep -E "(SEARCH PERFORMANCE|Searching|clusters|total faces)"

# Or see all logs
docker-compose logs -f backend
```

### What to look for:

After a search, you'll see logs like:
```
⚡ SEARCH PERFORMANCE: Total=0.234s | Clusters=0.045s (50 comparisons) | Unclustered=0.012s (5 comparisons) | DB=0.177s | Total faces=1000 | Comparisons=55 | Speedup=18.2x | Found=15 photos
```

**Key metrics:**
- **Total**: Total search time
- **Clusters**: Time to search clusters
- **Unclustered**: Time to search unclustered faces
- **Total faces**: How many faces in event
- **Comparisons**: How many face comparisons were made
- **Speedup**: How much faster than comparing all faces

---

## Method 2: Check API Response (Frontend)

The API now returns performance data in the response:

```json
{
  "matches": [...],
  "total": 15,
  "performance": {
    "total_time_seconds": 0.234,
    "cluster_search_time_seconds": 0.045,
    "unclustered_search_time_seconds": 0.012,
    "db_query_time_seconds": 0.177,
    "total_faces": 1000,
    "cluster_comparisons": 50,
    "unclustered_comparisons": 5,
    "total_comparisons": 55,
    "speedup_ratio": 18.2
  }
}
```

### In Browser DevTools:

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Perform a search**
4. **Click on the search request**
5. **Check Response tab** - you'll see `performance` object
6. **Check Timing tab** - shows total request time

**Compare:**
- **Request time** (Network tab) = Frontend + Backend time
- **total_time_seconds** (Response) = Backend processing time only

**If Request time >> total_time_seconds:**
- Problem is likely **frontend** (image upload, rendering, etc.)

**If total_time_seconds is high:**
- Problem is **backend** (search is slow)

---

## Method 3: Test Script (Most Accurate)

Create a test script to measure performance:

```python
# test_performance.py
import requests
import time
import json

EVENT_ID = "your-event-id-here"
API_BASE = "http://localhost:8000/api/v1/faces"

def test_search_performance(selfie_path):
    """Test search performance and print detailed metrics"""
    
    print("=" * 60)
    print("PERFORMANCE TEST: Face Search")
    print("=" * 60)
    
    # Measure total request time (frontend + backend)
    request_start = time.time()
    
    with open(selfie_path, 'rb') as f:
        response = requests.post(
            f"{API_BASE}/search-by-selfie",
            params={"event_id": EVENT_ID},
            files={"file": f}
        )
    
    request_time = time.time() - request_start
    
    if response.status_code == 200:
        data = response.json()
        perf = data.get('performance', {})
        
        print(f"\n📊 RESULTS:")
        print(f"  Found: {data['total']} photos")
        print(f"  Faces matched: {data.get('faces_matched', 0)}")
        
        print(f"\n⏱️  TIMING BREAKDOWN:")
        print(f"  Total Request Time: {request_time:.3f}s (frontend + backend)")
        print(f"  Backend Processing: {perf.get('total_time_seconds', 0):.3f}s")
        print(f"    ├─ Cluster Search: {perf.get('cluster_search_time_seconds', 0):.3f}s")
        print(f"    ├─ Unclustered Search: {perf.get('unclustered_search_time_seconds', 0):.3f}s")
        print(f"    └─ Database Queries: {perf.get('db_query_time_seconds', 0):.3f}s")
        
        print(f"\n🔢 COMPARISONS:")
        print(f"  Total faces in event: {perf.get('total_faces', 0)}")
        print(f"  Cluster comparisons: {perf.get('cluster_comparisons', 0)}")
        print(f"  Unclustered comparisons: {perf.get('unclustered_comparisons', 0)}")
        print(f"  Total comparisons: {perf.get('total_comparisons', 0)}")
        print(f"  Speedup: {perf.get('speedup_ratio', 1):.1f}x faster")
        
        print(f"\n💡 ANALYSIS:")
        frontend_time = request_time - perf.get('total_time_seconds', 0)
        if frontend_time > perf.get('total_time_seconds', 0):
            print(f"  ⚠️  Frontend overhead: {frontend_time:.3f}s (upload/network)")
            print(f"  → Consider optimizing image upload or network")
        else:
            print(f"  ✅ Backend is the bottleneck")
            print(f"  → Optimizations are working!")
        
        if perf.get('speedup_ratio', 1) > 10:
            print(f"  ✅ Great speedup! Hybrid search is working")
        elif perf.get('speedup_ratio', 1) > 1:
            print(f"  ⚠️  Some speedup, but could be better")
        else:
            print(f"  ❌ No speedup - check if clusters exist")
            
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    test_search_performance("test_selfie.jpg")
```

---

## Method 4: Compare Before/After

### Before (Old Code):
- Would compare against ALL faces
- Example: 1000 faces = 1000 comparisons
- Time: ~3-5 seconds

### After (New Code):
- Compares against clusters + unclustered
- Example: 50 clusters + 5 unclustered = 55 comparisons
- Time: ~0.2-0.5 seconds
- **Speedup: 18x faster!**

---

## Quick Test Commands

### Test 1: Check if performance tracking is working

```bash
# Watch logs
docker-compose logs -f backend

# Then perform a search in the frontend
# You should see "⚡ SEARCH PERFORMANCE" log
```

### Test 2: Check response includes performance data

```bash
# Use curl to test
curl -X POST "http://localhost:8000/api/v1/faces/search-by-selfie?event_id=YOUR_EVENT_ID" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@your_selfie.jpg" | jq '.performance'
```

### Test 3: Compare with browser DevTools

1. Open browser DevTools (F12)
2. Go to Network tab
3. Perform search
4. Check:
   - **Request timing** (total time)
   - **Response** (contains `performance` object)
   - **Compare** request time vs `total_time_seconds`

---

## Troubleshooting

### Issue: No performance data in response

**Check:**
- Is the new code loaded? (restart backend if needed)
- Check logs for errors

### Issue: Speedup ratio is 1.0x (no improvement)

**Possible causes:**
- No clusters exist yet (first search)
- All faces are unclustered
- Event is very small (< 100 faces)

**Solution:**
- Upload more photos
- Wait for clustering to run
- Check if clusters exist: `GET /api/v1/faces/events/{event_id}/clusters`

### Issue: Request time is much higher than total_time_seconds

**This means frontend is slow:**
- Image upload is taking time
- Network latency
- Frontend processing

**Solution:**
- Check image size (compress if needed)
- Check network connection
- Profile frontend code

### Issue: total_time_seconds is still high

**This means backend is slow:**
- Too many comparisons
- Database queries are slow
- Face comparison is slow

**Check:**
- How many comparisons? (should be < total faces)
- Are clusters being used? (cluster_comparisons > 0)
- Database query time (db_query_time_seconds)

---

## Expected Performance

### Small Event (< 100 faces):
- **Before**: ~0.5-1 second
- **After**: ~0.3-0.5 second
- **Speedup**: 1.5-2x

### Medium Event (100-1000 faces):
- **Before**: ~2-5 seconds
- **After**: ~0.3-0.8 second
- **Speedup**: 5-15x

### Large Event (1000+ faces):
- **Before**: ~5-15 seconds
- **After**: ~0.5-2 seconds
- **Speedup**: 10-50x

---

## Next Steps

1. **Test with your data** - Upload photos and search
2. **Check logs** - Look for performance metrics
3. **Compare times** - Before vs after
4. **Identify bottlenecks** - Frontend vs backend
5. **Optimize further** - Based on findings

---

*Happy Performance Tracking! 🚀*

