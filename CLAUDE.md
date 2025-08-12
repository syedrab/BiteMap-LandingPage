# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BiteMap is an iOS application built with SwiftUI that helps food-lovers discover local dining experiences through community-driven content. The app combines location-based services with social features, allowing users to share video reviews and find authentic restaurant recommendations.

## Development Commands

### Building and Running
```bash
# Build the project
xcodebuild -project BiteMap.xcodeproj -scheme BiteMap -configuration Debug

# Run tests
xcodebuild test -project BiteMap.xcodeproj -scheme BiteMap -destination 'platform=iOS Simulator,name=iPhone 15 Pro'

# Run a specific test
xcodebuild test -project BiteMap.xcodeproj -scheme BiteMap -destination 'platform=iOS Simulator,name=iPhone 15 Pro' -only-testing:BiteMapTests/[TestClassName]/[testMethodName]

# Clean build folder
xcodebuild clean -project BiteMap.xcodeproj -scheme BiteMap
```

### Supabase Local Development
```bash
# Start Supabase locally
cd supabase && supabase start

# Run database migrations
cd supabase && supabase migration up

# Create new migration
cd supabase && supabase migration new [migration_name]

# Run edge functions locally
cd supabase && supabase functions serve
```

## Architecture Overview

### Core Structure
The app follows an MVVM architecture with the following key components:

1. **Entry Point**: `BiteMapApp.swift` manages app lifecycle and authentication flow
   - Shows SplashScreen → AuthView → MainView based on authentication state
   - Uses `AuthManager.shared` singleton for session management

2. **Main Navigation**: `MainView.swift` acts as the tab controller
   - Tab 0: VideoFeedView (TikTok-style video feed)
   - Tab 1: MapViewPage (Interactive map with restaurant pins)
   - Tab 2: ExploreView (Discovery content)
   - Tab 3: ProfileView (User profile and content)
   - Tab 4: SettingsView

3. **ViewModels** handle business logic and state management:
   - `VideoFeedViewModel`: Manages video playback and content loading
   - `MapViewModel`: Handles map interactions and location services
   - `ExploreViewModel`: Manages explore content and filtering
   - `ProfileViewModel`: User profile data and content management

### Data Layer Architecture

The app uses Supabase as the backend with the following schema:

1. **creator** table: Core identity for all content creators
   - Can be external (TikTok/Instagram) or internal (BiteMap users)
   - Links to auth.users via auth_user_id for registered users

2. **creator_profile**: Platform-specific profiles
   - One creator can have multiple profiles (TikTok, Instagram, BiteMap)
   - Stores platform-specific metrics (followers, views, etc.)

3. **videos**: All video content (external and internal)
   - References creator and place
   - Stores platform-specific engagement metrics

4. **places**: Restaurant/business locations
   - Stores location data, Google IDs, ratings

### Service Layer

Key services in `Core/Services/`:
- `AuthManager`: Singleton managing authentication state
- `SupabaseFunctionService`: Wrapper for Supabase edge functions
- `UserService`: Manages user data and interactions
- `StorageService`: Handles media uploads to Supabase Storage
- `UserHistoryService`: Tracks user viewing history

### Important Implementation Details

1. **Lazy Loading**: MapViewModel is lazy-loaded to improve app startup performance
2. **Video Player State**: VideoFeedView maintains its own AVPlayer instances and manages playback state
3. **Location Services**: Uses LocationManager helper for user location tracking
4. **Tab Switching**: Profile view is shown as an overlay, not a separate tab

### Code Style Requirements

Per Instructions.md:
- **DO NOT** make code changes unless explicitly requested
- **DO NOT** auto-refactor, clean up, or optimize code
- Only implement the specific change requested
- Keep surrounding code untouched
- Add comments only if something looks incorrect but wasn't requested to be changed

### Supabase Edge Functions

Located in `supabase/functions/`, key functions include:
- `get_videos_within_radius`: Fetches nearby video content
- `get_trending_creators`: Returns trending content creators
- `create-or-update-creator`: Manages creator records
- `user_saved` / `user_watched`: Track user interactions

### Environment Configuration

The app uses:
- `Constants.swift` for API keys and URLs
- `Environment.swift` for environment-specific settings
- Supabase configuration in `supabase/config.toml`