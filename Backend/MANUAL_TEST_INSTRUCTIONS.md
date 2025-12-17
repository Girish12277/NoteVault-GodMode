## MANUAL TEST INSTRUCTIONS

If you prefer to test manually in the browser instead of running the PowerShell script:

### Option 1: Browser Test (Recommended)

1. **Open Frontend** 
   - Navigate to: http://localhost:8080

2. **Login**
   - Use any test account that has purchased notes

3. **Go to Library**
   - Click "My Library" or navigate to `/library`

4. **Download a Note**
   - Click the "Download" button on any purchased note
   - Watch browser console (F12) for errors

5. **Expected Result:**
   - PDF downloads successfully OR opens in new tab
   - No errors in console
   - File is a valid PDF (not HTML error page)

### Option 2: API Test (Quick)

Open a new terminal and run:

```powershell
# 1. Login (replace email/password)
$login = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -Body (@{email="test@example.com"; password="password123"} | ConvertTo-Json) -ContentType "application/json"

# 2. Get token
$token = $login.data.token

# 3. Test download (replace NOTE_ID)
$headers = @{"Authorization" = "Bearer $token"}
$download = Invoke-RestMethod -Uri "http://localhost:5001/api/notes/YOUR_NOTE_ID/download" -Headers $headers

# 4. Check response
$download.data.downloadUrl
# Should output: https://res.cloudinary.com/.../s--SIGNATURE--/...pdf

# 5. Test URL
Invoke-WebRequest -Uri $download.data.downloadUrl -Method HEAD
# Should return: StatusCode 200, ContentType application/pdf
```

### Option 3: Database Check

If you need to find a valid note ID:

```powershell
# Open Prisma Studio
npx prisma studio

# Then:
# 1. Open "purchases" table
# 2. Find any row where is_active = true
# 3. Copy the note_id value
# 4. Use that in the test above
```

### Expected Success Indicators:

✅ **Backend Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://res.cloudinary.com/.../s--abc123--/...pdf",
    "noteId": "...",
    "title": "..."
  }
}
```

✅ **Signed URL Characteristics:**
- Contains `cloudinary.com` domain
- Contains signature: `s--XXXXX--`
- Contains `expires_at=` parameter
- HEAD request returns `200 OK`
- Content-Type is `application/pdf`

❌ **Failure Indicators:**
- `downloadUrl` is undefined or null
- URL returns 403 (Forbidden) - ACL issue
- URL returns 404 (Not Found) - public_id mismatch
- Content-Type is `text/html` - error page served instead
- CORS error in browser console
- "Failed to load PDF document" error

### Troubleshooting:

**If URL returns 403:**
- Asset was uploaded as "authenticated" type but we're requesting "upload" type
- Check uploadService.ts line 63: should be `type: 'upload'`

**If URL returns 404:**
- Public ID extraction failed
- Check noteController.ts line 442-444 for public ID parsing
- Verify note.file_url is actually a Cloudinary URL

**If no downloadUrl in response:**
- Backend endpoint not returning data
- Check backend logs for errors
- Verify noteController.ts lines 460-465
