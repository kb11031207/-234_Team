# 🧪 Testing Frontend-Backend Integration

**Status:** Frontend connected to backend! Ready for testing.

---

## ✅ **What's Been Integrated**

### **1. HomePage** (`/`)
- ✅ Fetches real public events from backend
- ✅ Displays events on map
- ✅ Shows nearby events
- **Test**: Visit http://localhost:5173 and check map view

### **2. EventPage** (`/events/:eventId`)
- ✅ Fetches real event details
- ✅ Fetches and displays actual media from Azure Storage
- ✅ Shows face count on photos
- ✅ Photo grid with thumbnails
- **Test**: Create an event, then visit its page

### **3. MyEventsPage** (`/my-events`)
- ✅ Fetches user's actual events from backend
- ✅ Displays event cards with real data
- ✅ Shows stats (total, public, private)
- **Test**: Sign in and visit http://localhost:5173/my-events

### **4. CreateEventPage** (`/create`)
- ✅ Creates real events via backend API
- ✅ Redirects to event page on success
- ✅ Shows loading and error states
- **Test**: Sign in, create an event, should redirect to event page

---

## 🚀 **Quick Test Flow**

### **Test 1: Create an Event**
```
1. Go to http://localhost:5173
2. Sign in (if Firebase is configured)
3. Click "Create Event"
4. Fill in:
   - Title: "Test Event"
   - Description: "Testing backend integration"
   - Check "Public Event"
5. Click "Create Event"
6. Should redirect to event page showing access code
```

**Expected Result:**
- Event created in database
- Access code generated
- Redirected to event page

**Verify in Backend:**
```bash
# Check backend logs
docker logs event-photos-backend --tail 50

# Should show:
# INFO: POST /api/v1/events - 201
```

---

### **Test 2: View Public Events on Map**
```
1. Go to http://localhost:5173
2. Click "Show Nearby Events" (map icon)
3. Allow location access
4. Should see events on map (if any public events exist with coordinates)
```

**Expected Result:**
- Map loads
- Public events marked on map
- Click marker shows event details

---

### **Test 3: View Event Gallery**
```
1. Create an event (or use existing event ID)
2. Go to http://localhost:5173/events/{event_id}
3. Should see:
   - Event details
   - Access code
   - "Upload Photos" and "Find My Photos" buttons
   - Gallery section (empty if no photos)
```

**Expected Result:**
- Event details load from backend
- Gallery shows "No photos yet" (or existing photos)

---

### **Test 4: View My Events**
```
1. Sign in
2. Go to http://localhost:5173/my-events
3. Should see all events you created
```

**Expected Result:**
- List of your events
- Event cards with access codes
- Stats showing total events

---

## 🔧 **Debugging Tips**

### **Check Backend is Running**
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","version":"0.1.0"}
```

### **Check Backend Logs**
```bash
docker logs event-photos-backend -f
# Watch logs in real-time
```

### **Check Frontend Console**
Open browser DevTools (F12) → Console tab
- Should show API calls
- Any errors will appear here

### **Check Network Tab**
Open browser DevTools (F12) → Network tab
- See all API requests
- Check status codes (200 = success, 401 = auth error, 404 = not found)

---

## ⚠️ **Known Limitations (Not Yet Integrated)**

### **Upload Page** - NOT CONNECTED YET
`/events/:eventId/upload`
- Currently uses mock upload
- **Next**: Connect to real Azure Blob upload flow

### **Search Face Page** - NOT CONNECTED YET
`/events/:eventId/search`
- Currently uses mock face search
- **Next**: Connect to real Azure Face API

### **Firebase Auth** - PARTIALLY CONFIGURED
- Auth context exists
- Backend accepts Firebase tokens
- **Needs**: Firebase config in `frontend/.env`

---

## 📊 **Integration Progress**

- ✅ **HomePage**: Connected
- ✅ **EventPage**: Connected  
- ✅ **MyEventsPage**: Connected
- ✅ **CreateEventPage**: Connected
- 🟡 **UploadPage**: In Progress
- 🟡 **SearchFacePage**: In Progress
- 🟡 **GalleryPage**: In Progress

**Overall: 4/7 pages connected (57%)**

---

## 🎯 **Next Steps**

1. **Test Current Integration**
   - Try creating an event
   - Verify it appears in "My Events"
   - Check event page loads correctly

2. **Configure Firebase** (for auth to work)
   - Get Firebase config from console
   - Add to `frontend/.env`
   - Test sign-in flow

3. **Connect Upload Flow** (most complex)
   - 3-step process:
     1. Get presigned URL
     2. Upload to Azure
     3. Confirm upload
   - Trigger face detection

4. **Connect Face Search**
   - Upload selfie
   - Search for similar faces
   - Display results

---

## 🐛 **Common Issues & Solutions**

### **Issue: "Network Error" in console**
**Solution**: 
- Check backend is running: `docker ps`
- Check backend health: `curl http://localhost:8000/health`
- Restart: `docker-compose restart backend`

### **Issue: "401 Unauthorized" errors**
**Solution**: 
- Firebase auth not configured yet
- For now, some endpoints work without auth (public events, event details)
- My Events requires auth - configure Firebase or test with public events

### **Issue: No events showing on map**
**Solution**:
- Create a public event with location coordinates
- Make sure `is_public` is true
- Add latitude/longitude when creating event

### **Issue: CORS errors**
**Solution**:
- Check `CORS_ORIGINS` in root `.env` includes `http://localhost:5173`
- Restart backend: `docker-compose restart backend`

---

## 📝 **Test Checklist**

Run through this checklist:

- [ ] Backend health endpoint responds
- [ ] Can create an event
- [ ] Event appears on homepage (if public)
- [ ] Event appears in "My Events"
- [ ] Can view event details page
- [ ] Gallery shows "No photos yet"
- [ ] Map loads on homepage
- [ ] Public events show on map (if any exist)

---

## 🎉 **Success Criteria**

You'll know integration is working when:

1. ✅ You can create an event and it gets a real access code
2. ✅ The event appears in your "My Events" list
3. ✅ You can view the event page with real data
4. ✅ Backend logs show successful API calls
5. ✅ No console errors in browser (except auth-related if Firebase not configured)

---

**Ready to test? Start with Test 1!** 🚀

