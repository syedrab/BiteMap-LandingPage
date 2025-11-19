# Video Sharing Setup Guide

This guide explains how to set up the video sharing feature for BiteMap.

## Overview

Users can now share videos from the iOS app, and they'll open as rich previews on the website with:
- Video player (HLS support for Bunny.net streams)
- Restaurant info
- Creator profile
- Engagement stats (likes, saves, views)
- Download app button
- Deep linking (opens app if installed)

## Setup Steps

### 1. Database Migration

Run the migration to add `shareable_code` column to your videos table:

**Option A: Using Supabase SQL Editor**
```sql
-- Copy and paste from: migration_add_shareable_code.sql
```

**Option B: Using Supabase CLI** (if you have it set up)
```bash
cd /path/to/your/ios-app
supabase migration new add_shareable_code
# Then paste contents of migration_add_shareable_code.sql
supabase db push
```

### 2. Backfill Existing Videos

Generate shareable codes for all existing videos:

**Option A: SQL Script** (easiest)
```sql
-- Run backfill_shareable_codes.sql in Supabase SQL Editor
```

**Option B: Node.js Script** (more control)
```bash
# Install dependencies
npm install

# Set environment variables
export SUPABASE_URL="https://lqslpgiibpcvknfehdlr.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"

# Run backfill
node backfill_shareable_codes.js
```

### 3. Configure Vercel Environment Variables

Add to Vercel Dashboard (Settings → Environment Variables):

```
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc2xwZ2lpYnBjdmtuZmVoZGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzNTU0MzQsImV4cCI6MjA0ODkzMTQzNH0.CCRU2iaDIxfpIIdCHledSdYQeG5JyrB7tJyTV6jCKqI
```

### 4. Deploy to Vercel

```bash
git add .
git commit -m "Add video sharing feature and App Store download buttons"
git push
```

Vercel will automatically deploy.

### 5. Update iOS App

In your iOS app's share functionality, generate shareable links:

**Swift Example:**
```swift
func shareVideo(videoId: UUID) async {
    // Fetch video to get shareable_code
    let video = try await supabase
        .from("videos")
        .select("shareable_code")
        .eq("id", videoId)
        .single()
        .execute()

    guard let code = video.shareable_code else {
        // Generate code if missing
        let newCode = generateShareableCode() // 7-char nanoid

        try await supabase
            .from("videos")
            .update(["shareable_code": newCode])
            .eq("id", videoId)
            .execute()

        shareUrl = "https://bitemap.fun/v/\(newCode)"
    } else {
        shareUrl = "https://bitemap.fun/v/\(code)"
    }

    // Show native share sheet
    let activityVC = UIActivityViewController(
        activityItems: [shareUrl],
        applicationActivities: nil
    )
    present(activityVC, animated: true)
}

func generateShareableCode() -> String {
    let chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    return String((0..<7).map { _ in chars.randomElement()! })
}
```

## Testing

### Test URL Format
```
https://bitemap.fun/v/DRM4nUd
```

### Test in Different Contexts

1. **Direct browser visit**
   - Should show video player with all metadata
   - Deep link should attempt to open app

2. **iMessage preview**
   - Should show rich preview with thumbnail
   - Title: "Creator on BiteMap: Restaurant Name"

3. **Twitter/X share**
   - Should show video card
   - Inline video player

4. **Facebook/Instagram share**
   - Should show thumbnail + title + description

## Supabase RLS Policies

Make sure your videos table has public read access:

```sql
-- Allow public to read published videos
CREATE POLICY "Public videos are viewable by everyone"
ON videos FOR SELECT
USING (status = 'published' OR status = 'public');

-- Same for related tables
CREATE POLICY "Public read creators"
ON creator FOR SELECT
USING (true);

CREATE POLICY "Public read creator_profile"
ON creator_profile FOR SELECT
USING (true);

CREATE POLICY "Public read places"
ON place FOR SELECT
USING (true);
```

## Troubleshooting

### Video not loading
- Check Supabase RLS policies
- Verify `shareable_code` exists in database
- Check browser console for errors

### Preview not showing on social media
- Meta tags are server-side rendered (check view-source)
- Use [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- Use [Twitter Card Validator](https://cards-dev.twitter.com/validator)

### Deep linking not working
- Verify Universal Links in iOS app
- Check `.well-known/apple-app-site-association` file
- Ensure app URL scheme is `bitemap://`

## URL Structure

```
Landing page:     https://bitemap.fun/
Video share:      https://bitemap.fun/v/[code]
Deep link:        bitemap://video/[code]
```

## What Changed

### Landing Page Updates
- ✅ Replaced email signup forms with App Store download buttons
- ✅ Updated navbar CTA to link to App Store
- ✅ New visual design for App Store buttons

### New Features
- ✅ `/v/[code]` route for video previews
- ✅ Server-side rendering with Open Graph meta tags
- ✅ HLS video player for Bunny.net streams
- ✅ Deep linking to open app if installed
- ✅ Responsive mobile-first design

### Database Changes
- ✅ New column: `videos.shareable_code` (TEXT, UNIQUE, indexed)

## Next Steps

1. Run the migration
2. Backfill existing videos
3. Add env var to Vercel
4. Deploy
5. Update iOS app sharing code
6. Test!
