# Document Preview Feature

## Overview
Admins can now preview employee documents directly in the browser before downloading them. This feature allows for quick document review without cluttering the downloads folder.

## Features

### For Admins
- **Preview Button**: View documents in a new browser tab/window
- **Download Button**: Download documents to local storage (existing feature)
- **Review Dialog**: Both preview and download options available during document review

### Security
- Preview endpoint is admin-only (requires admin authentication)
- Documents are served with security headers:
  - `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
  - `X-Frame-Options: SAMEORIGIN` - Prevents clickjacking attacks
- Files are served inline (`Content-Disposition: inline`) for preview
- Files are served as attachment (`Content-Disposition: attachment`) for download

## How to Use

### Document Management Page
1. Navigate to **Document Management** page (admin only)
2. Find the document you want to review
3. Click the **Eye icon** (👁️) to preview the document in a new tab
4. Click the **Download icon** (⬇️) to download the document
5. Click the **Review icon** (📄) to open the review dialog

### Review Dialog
1. Click the **Preview** button to view the document in a new tab
2. Click the **Download** button to download the document
3. After reviewing, add notes and click **Approve** or **Reject**

## Supported File Types
The preview feature works best with browser-supported file types:
- **PDF files** (.pdf) - Opens directly in browser
- **Images** (.jpg, .jpeg, .png, .gif) - Displays in browser
- **Text files** (.txt) - Displays in browser
- **Other files** - Browser will attempt to display or prompt for download

## Technical Implementation

### Backend
- **New Endpoint**: `GET /api/documents/:id/preview`
- **Authentication**: Requires admin role
- **Response**: Streams file with `inline` content disposition

### Frontend
- **New Service Method**: `documentService.previewDocument(id)`
- **UI Updates**: Added preview button with Eye icon
- **Behavior**: Opens document in new tab using `window.open()`

## API Endpoint

### Preview Document
```
GET /api/documents/:id/preview
```

**Authentication**: Required (Admin only)

**Response Headers**:
- `Content-Disposition: inline; filename="[filename]"`
- `Content-Type: [mime-type]`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`

**Response**: File stream

## Benefits
1. **Faster Review**: No need to download files to review them
2. **Cleaner Downloads Folder**: Only download when necessary
3. **Better UX**: Quick preview for simple verification
4. **Secure**: Admin-only access with security headers
