# Upload Feature Testing Guide 📸

## Upload Flow Complete! ✅

The upload feature is now fully integrated with the backend. Here's how to test it:

---

## 🎯 Features Implemented

### 1. **Drag & Drop Upload**
- Visual feedback when dragging files
- Supports multiple files at once
- Accepts: JPG, PNG, GIF, WebP

### 2. **File Previews**
- Thumbnail preview for each image
- File name and size display
- Real-time status updates

### 3. **Upload Progress**
- Visual progress bar for each file
- Status indicators (pending, uploading, success, error)
- Detailed error messages on failure

### 4. **Three-Step Process**
- **Step 1:** Get presigned URL from backend
- **Step 2:** Upload directly to Azure Blob Storage
- **Step 3:** Confirm upload to trigger face detection

### 5. **Post-Upload Actions**
- Success/failure summary
- "View Gallery" button to see uploaded photos
- "Upload More" button to continue uploading

---

## 🧪 How to Test

### Prerequisites
- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:5173`
- User logged in with Firebase
- At least one event created

### Step-by-Step Test

1. **Navigate to an Event**
   ```
   http://localhost:5173/events/{event_id}
   ```

2. **Click "Upload" Button**
   - Should redirect to `/events/{event_id}/upload`

3. **Add Photos**
   - **Option A:** Drag and drop image files into the dropzone
   - **Option B:** Click the dropzone to open file picker

4. **Verify File List**
   - Each file should show:
     - ✓ Thumbnail preview
     - ✓ File name
     - ✓ File size (in MB)
     - ✓ Pending status (⏳)

5. **Click "Upload" Button**
   - Progress bars should appear
   - Status should change: ⏳ → ⏫ → ✅
   - "Uploading..." button text during upload

6. **Verify Success State**
   - Success message: "Upload Complete! 🎉"
   - Count of successful/failed uploads
   - "Face detection is processing in the background..." message
   - "View Gallery" and "Upload More" buttons

7. **Click "View Gallery"**
   - Should navigate to event page
   - Newly uploaded photos should appear (may take a few seconds for Azure to confirm)

---

## 🐛 Common Issues & Solutions

### Issue: Upload button is disabled
**Solution:** Make sure you're logged in and on the correct event upload page

### Issue: Upload fails with 401 error
**Solution:** Your Firebase token may have expired. Refresh the page to re-authenticate

### Issue: Upload fails with 403 error
**Solution:** 
- Check Azure CORS settings
- Verify container permissions
- Check backend `.env` has correct Azure credentials

### Issue: Photos don't appear in gallery immediately
**Solution:** 
- Azure Blob Storage has eventual consistency
- Face detection runs in background
- Wait 5-10 seconds and refresh the gallery

### Issue: "Content-Type" header error
**Solution:** This is handled automatically by the `uploadToBlob` function

---

## 🔍 What to Check in Backend Logs

After upload, you should see:

```
INFO: POST /api/v1/media/upload-url - 200 OK
INFO: POST /api/v1/media/{media_id}/confirm - 200 OK
INFO: Starting face detection for media_id: xxx
```

---

## 📊 Database Verification

Check the `media` table:

```sql
SELECT 
    media_id, 
    filename, 
    face_detection_status, 
    face_count, 
    created_at 
FROM media 
WHERE event_id = '{your_event_id}' 
ORDER BY created_at DESC;
```

**Expected:**
- New row for each uploaded photo
- `face_detection_status` = 'pending' or 'processing'
- `blob_url` should contain Azure blob URL

---

## 🎨 Upload UX Features

1. **Drag & Drop Visual Feedback**
   - Border changes to green when dragging
   - Background changes to light blue

2. **File Validation**
   - Only image files accepted
   - Automatic MIME type detection

3. **Error Handling**
   - Individual file errors don't stop other uploads
   - Clear error messages displayed
   - Failed uploads can be retried

4. **Memory Management**
   - Preview URLs are revoked when clearing
   - Prevents memory leaks from blob URLs

5. **Multiple Upload Support**
   - Upload multiple files in one batch
   - Sequential processing (one at a time)
   - Overall progress tracking

---

## 🚀 Next Steps

### Currently Working:
- ✅ Upload UI with drag & drop
- ✅ Direct Azure Blob Storage upload
- ✅ Backend confirmation
- ✅ Face detection trigger

### Still TODO:
- Face search page
- Face clustering display
- Similar face search

---

## 🎉 Test Success Criteria

**Upload is successful if:**
1. Files upload without errors
2. Success message appears
3. Photos appear in gallery within 10 seconds
4. Backend logs show face detection starting
5. Database shows new media rows

**Bonus points if:**
- Multiple files upload without issues
- Error handling works gracefully
- UI remains responsive during upload
- Preview thumbnails look correct

---

Ready to test? Just navigate to any event and click the "Upload" button! 🎯

