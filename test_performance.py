#!/usr/bin/env python3
"""
Performance testing script for face search

Usage:
    python test_performance.py <event_id> <selfie_path>

Example:
    python test_performance.py "7ea37c66-b238-4414-95de-9f6dc39f4a4a" "test_selfie.jpg"
"""

import requests
import time
import sys
import json

API_BASE = "http://localhost:8000/api/v1/faces"


def test_search_performance(event_id, selfie_path):
    """Test search performance and print detailed metrics"""
    
    print("=" * 70)
    print("PERFORMANCE TEST: Face Search")
    print("=" * 70)
    print(f"Event ID: {event_id}")
    print(f"Selfie: {selfie_path}")
    print()
    
    # Measure total request time (frontend + backend)
    request_start = time.time()
    
    try:
        with open(selfie_path, 'rb') as f:
            response = requests.post(
                f"{API_BASE}/search-by-selfie",
                params={"event_id": event_id},
                files={"file": f},
                timeout=30
            )
    except FileNotFoundError:
        print(f"❌ Error: File '{selfie_path}' not found")
        return
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: Request failed - {e}")
        return
    
    request_time = time.time() - request_start
    
    if response.status_code == 200:
        data = response.json()
        perf = data.get('performance', {})
        
        print(f"📊 RESULTS:")
        print(f"  ✅ Status: {response.status_code}")
        print(f"  📷 Found: {data['total']} photos")
        print(f"  👤 Faces matched: {data.get('faces_matched', 0)}")
        print(f"  💬 Message: {data.get('message', 'N/A')}")
        
        print(f"\n⏱️  TIMING BREAKDOWN:")
        print(f"  🌐 Total Request Time: {request_time:.3f}s (frontend + network + backend)")
        print(f"  🔧 Backend Processing: {perf.get('total_time_seconds', 0):.3f}s")
        if perf.get('total_time_seconds', 0) > 0:
            print(f"     ├─ Cluster Search: {perf.get('cluster_search_time_seconds', 0):.3f}s")
            print(f"     ├─ Unclustered Search: {perf.get('unclustered_search_time_seconds', 0):.3f}s")
            print(f"     └─ Database Queries: {perf.get('db_query_time_seconds', 0):.3f}s")
        
        print(f"\n🔢 COMPARISONS:")
        total_faces = perf.get('total_faces', 0)
        cluster_comps = perf.get('cluster_comparisons', 0)
        unclustered_comps = perf.get('unclustered_comparisons', 0)
        total_comps = perf.get('total_comparisons', 0)
        speedup = perf.get('speedup_ratio', 1)
        
        print(f"  📈 Total faces in event: {total_faces}")
        print(f"  🔍 Cluster comparisons: {cluster_comps}")
        print(f"  🔍 Unclustered comparisons: {unclustered_comps}")
        print(f"  🔍 Total comparisons: {total_comps}")
        print(f"  ⚡ Speedup: {speedup:.1f}x faster")
        
        print(f"\n💡 ANALYSIS:")
        frontend_time = request_time - perf.get('total_time_seconds', 0)
        
        if frontend_time > perf.get('total_time_seconds', 0) * 0.5:
            print(f"  ⚠️  Frontend/Network overhead: {frontend_time:.3f}s")
            print(f"     → This is upload/network time (not backend processing)")
            print(f"     → Consider: compress image, check network speed")
        else:
            print(f"  ✅ Backend is the main time consumer")
        
        if speedup > 10:
            print(f"  ✅ Excellent! Hybrid search is working great ({speedup:.1f}x speedup)")
        elif speedup > 1:
            print(f"  ⚠️  Some speedup ({speedup:.1f}x), but could be better")
            print(f"     → Check if clusters exist and are being used")
        else:
            print(f"  ❌ No speedup detected")
            print(f"     → Possible reasons:")
            print(f"        - No clusters exist yet (first search)")
            print(f"        - All faces are unclustered")
            print(f"        - Event is very small")
        
        if total_comps == total_faces and total_faces > 100:
            print(f"  ⚠️  Comparing against ALL faces (no clusters used)")
            print(f"     → Clustering may not have run yet")
            print(f"     → Try: POST /api/v1/faces/events/{event_id}/trigger-clustering")
        
        print(f"\n📋 Full Performance Data:")
        print(json.dumps(perf, indent=2))
            
    else:
        print(f"❌ Error: HTTP {response.status_code}")
        try:
            error_data = response.json()
            print(f"   Detail: {error_data.get('detail', 'Unknown error')}")
        except:
            print(f"   Response: {response.text[:200]}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python test_performance.py <event_id> <selfie_path>")
        print("\nExample:")
        print('  python test_performance.py "7ea37c66-b238-4414-95de-9f6dc39f4a4a" "test_selfie.jpg"')
        sys.exit(1)
    
    event_id = sys.argv[1]
    selfie_path = sys.argv[2]
    
    test_search_performance(event_id, selfie_path)

