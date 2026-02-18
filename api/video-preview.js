/**
 * Video Preview API
 * Generates server-side rendered HTML with Open Graph meta tags
 * Route: /v/:code
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqslpgiibpcvknfehdlr.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Missing video code');
  }

  if (!supabaseAnonKey) {
    console.error('Missing SUPABASE_ANON_KEY environment variable');
    return res.status(500).send('Server configuration error');
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Try to find video by shareable_code first, then by bunny_video_id
    let { data: video, error } = await supabase
      .from('Videos')
      .select('*')
      .eq('shareable_code', code)
      .single();

    // If not found by shareable_code, try bunny_video_id
    if (error || !video) {
      const { data: videoByBunny, error: bunnyError } = await supabase
        .from('Videos')
        .select('*')
        .eq('bunny_video_id', code)
        .order('place_id', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      video = videoByBunny;
      error = bunnyError;
    }

    // If still not found, try by video id
    if (error || !video) {
      const { data: videoById, error: idError } = await supabase
        .from('Videos')
        .select('*')
        .eq('id', code)
        .single();

      video = videoById;
      error = idError;
    }

    if (error || !video) {
      return res.status(404).send(renderNotFound());
    }

    // Fetch creator data
    if (video.creator_id) {
      const { data: creator } = await supabase
        .from('Creator')
        .select('id, name, full_name, image_url')
        .eq('id', video.creator_id)
        .single();
      video.creator = creator;
    }

    // Fetch place data
    if (video.place_id) {
      const { data: place, error: placeError } = await supabase
        .from('Places')
        .select('*')
        .eq('id', video.place_id)
        .single();
      video.place = place;
    }

    // Render HTML with meta tags
    const html = renderVideoPreview(video, code);
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);

  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).send('Error loading video');
  }
}

function renderVideoPreview(video, code) {
  const pageUrl = `https://bitemap.fun/v/${code}`;
  const appStoreUrl = 'https://apps.apple.com/us/app/bitemap/id6746139076';

  // Extract data
  // Build Bunny CDN URL if we have bunny_video_id
  let videoUrl = video.bunny_cdn_url || video.video_url || video.external_video_url;
  if (!videoUrl && video.bunny_video_id) {
    videoUrl = `https://vz-9c9477c9-fd2.b-cdn.net/${video.bunny_video_id}/playlist.m3u8`;
  }

  // Build thumbnail URL from bunny_video_id
  let thumbnailUrl = video.thumbnail_url;
  if (!thumbnailUrl && video.bunny_video_id) {
    thumbnailUrl = `https://vz-9c9477c9-fd2.b-cdn.net/${video.bunny_video_id}/thumbnail.jpg`;
  }
  if (!thumbnailUrl) {
    thumbnailUrl = 'https://bitemap.fun/images/og-image.jpg';
  }
  // Data from Videos table with nested creator/place
  const creatorName = video.creator?.name || 'BiteMap Creator';
  const creatorFullName = video.creator?.full_name || '';
  const creatorPic = `https://lqslpgiibpcvknfehdlr.supabase.co/storage/v1/object/public/photos/profile/${creatorName}.jpeg`;
  const placeName = video.place?.name || 'Amazing Restaurant';
  const placeAddress = video.place?.address || '';
  const placeCity = video.place?.city || '';
  const caption = video.caption || '';
  const likes = video.likes || 0;
  const saves = video.saves || 0;
  const views = video.views || 0;

  const titlePlace = video.place ? `: ${placeName}` : '';
  const title = `${creatorName} on BiteMap${titlePlace} | ${formatNumber(views)} views, ${formatNumber(likes)} likes`;
  const truncatedCaption = caption.length > 150 ? caption.substring(0, 150) + '...' : caption;
  const description = truncatedCaption || (video.place ? `Check out ${placeName}${placeCity ? ` in ${placeCity}` : ''} on BiteMap!` : `Watch this video on BiteMap!`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>

    <!-- Open Graph Meta Tags -->
    <meta property="og:type" content="video.other">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${thumbnailUrl}">
    <meta property="og:video" content="${videoUrl}">
    <meta property="og:site_name" content="BiteMap">

    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="player">
    <meta name="twitter:url" content="${pageUrl}">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${thumbnailUrl}">
    <meta name="twitter:player" content="${videoUrl}">
    <meta name="twitter:player:width" content="1080">
    <meta name="twitter:player:height" content="1920">

    <!-- App Store Smart Banner -->
    <meta name="apple-itunes-app" content="app-id=6746139076">

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/images/bitemap-logo.png">
    <link rel="apple-touch-icon" href="/images/bitemap-logo.png">

    <!-- HLS.js for video playback -->
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>

    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #0A0A0A;
            color: #fff;
            min-height: 100vh;
        }

        /* Navbar */
        .navbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            background: rgba(10, 10, 10, 0.95);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding: 1rem 1.5rem;
        }

        .nav-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo-link {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            text-decoration: none;
            color: #fff;
        }

        .logo-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
        }

        .logo-text {
            font-size: 1.25rem;
            font-weight: 700;
        }

        .nav-buttons {
            display: flex;
            gap: 0.5rem;
            align-items: center;
        }

        .nav-download-btn {
            background: #FF006E;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.8rem;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
        }

        .nav-download-btn:hover {
            background: #e6006a;
            transform: translateY(-2px);
        }

        .nav-android-btn {
            background: transparent;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 50px;
            border: 1.5px solid rgba(255, 255, 255, 0.3);
            font-weight: 600;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: inherit;
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
        }

        .nav-android-btn:hover {
            border-color: #3DDC84;
            color: #3DDC84;
            transform: translateY(-2px);
        }

        .android-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
            z-index: 9999;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            animation: fadeIn 0.3s ease;
        }

        .android-modal-overlay.show {
            display: flex;
        }

        .android-modal {
            background: white;
            border-radius: 16px;
            max-width: 360px;
            width: 100%;
            position: relative;
            animation: slideUp 0.3s ease;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 2rem 1.5rem;
            text-align: center;
        }

        .android-modal h2 {
            font-size: 1.25rem;
            font-weight: 700;
            color: #1A1A1A;
            margin-bottom: 0.5rem;
        }

        .android-modal p {
            font-size: 0.85rem;
            color: #666;
            margin-bottom: 1.25rem;
            line-height: 1.5;
        }

        .android-form {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .android-form input {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1.5px solid #e5e5e5;
            border-radius: 10px;
            font-size: 0.9rem;
            font-family: inherit;
            outline: none;
            transition: border-color 0.2s ease;
        }

        .android-form input:focus {
            border-color: #3DDC84;
        }

        .android-form button {
            width: 100%;
            padding: 0.75rem;
            background: #3DDC84;
            color: #1A1A1A;
            border: none;
            border-radius: 10px;
            font-size: 0.9rem;
            font-weight: 700;
            cursor: pointer;
            font-family: inherit;
            transition: all 0.3s ease;
        }

        .android-form button:hover {
            background: #32c976;
            transform: translateY(-2px);
        }

        .android-close {
            position: absolute;
            top: 0.75rem;
            right: 0.75rem;
            background: transparent;
            border: none;
            color: #666;
            cursor: pointer;
            padding: 0.4rem;
            display: flex;
            border-radius: 50%;
            transition: all 0.2s ease;
        }

        .android-close:hover {
            background: rgba(0, 0, 0, 0.05);
        }

        .android-success {
            display: none;
            color: #3DDC84;
            font-weight: 600;
            font-size: 0.9rem;
        }

        .android-form button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        /* Main Container */
        .main-container {
            padding-top: 4rem;
            min-height: 100vh;
            background: linear-gradient(135deg, rgba(255, 0, 110, 0.1) 0%, rgba(251, 86, 7, 0.1) 50%, rgba(255, 190, 11, 0.1) 100%);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .content-wrapper {
            max-width: 1100px;
            width: 100%;
            margin: 0 auto;
            padding: 2rem 1.5rem;
            display: grid;
            grid-template-columns: 430px 1fr;
            gap: 2.5rem;
            align-items: start;
        }

        /* Video Player */
        .video-section {
            width: 100%;
            position: relative;
        }

        /* Mobile Logo */
        .mobile-logo {
            position: absolute;
            top: 1rem;
            left: 1rem;
            z-index: 20;
            display: none;
        }

        .mobile-logo img {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;
        }

        .mobile-logo:hover img {
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        /* Top Banner */
        .top-banner {
            position: absolute;
            top: 1rem;
            left: 50%;
            transform: translateX(-50%);
            z-index: 20;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 0.5rem 1.25rem;
            border-radius: 50px;
            font-size: 0.875rem;
            font-weight: 600;
            color: #FF006E;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
        }

        .top-banner:hover {
            background: rgba(255, 255, 255, 1);
            transform: translateX(-50%) scale(1.05);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }

        .video-player-wrapper {
            position: relative;
            width: 100%;
            padding-top: 177.78%; /* 9:16 aspect ratio */
            background: #000;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .video-player {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            border: none;
        }

        /* Info Section */
        .info-section {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 2rem;
        }

        .creator-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .creator-avatar {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, #FF006E 0%, #FB5607 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            font-weight: 700;
            color: white;
            flex-shrink: 0;
            overflow: hidden;
            position: relative;
        }

        .creator-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            position: absolute;
            top: 0;
            left: 0;
        }

        .creator-details {
            flex: 1;
        }

        .creator-name {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 0.25rem;
        }

        .creator-label {
            font-size: 0.875rem;
            color: #999;
        }

        .creator-fullname {
            font-size: 0.875rem;
            color: #ccc;
        }

        .caption-section {
            font-size: 0.9rem;
            color: #ddd;
            line-height: 1.5;
            margin-bottom: 1rem;
            padding: 0.75rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            max-height: 80px;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            cursor: pointer;
            transition: max-height 0.3s ease;
        }

        .caption-section.expanded {
            max-height: 500px;
            display: block;
            -webkit-line-clamp: unset;
        }

        .place-section {
            margin-bottom: 1.5rem;
        }

        .place-name {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }

        .place-address {
            font-size: 0.95rem;
            color: #999;
            line-height: 1.5;
        }

        .place-address-link {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            text-decoration: none;
            color: #999;
            transition: color 0.2s ease;
        }

        .place-address-link:hover {
            color: #FF006E;
        }

        .map-icon {
            flex-shrink: 0;
            color: #FF006E;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            margin: 2rem 0;
            padding: 1.5rem 0;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-item {
            text-align: center;
        }

        .stat-value {
            font-size: 1.25rem;
            font-weight: 700;
            color: #FF006E;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.25rem;
            margin-bottom: 0.1rem;
            line-height: 1;
        }

        .stat-label {
            font-size: 0.875rem;
            color: #999;
        }

        .delivery-links {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            margin: 1.5rem 0;
            padding: 1.5rem 0;
            border-top: none;
        }

        .delivery-link {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
            padding: 0.5rem;
            background: none;
            border: none;
            color: white;
            text-decoration: none;
            transition: all 0.3s ease;
            flex: 1;
        }

        .delivery-link:hover {
            transform: translateY(-2px);
        }

        .delivery-logo {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            object-fit: cover;
        }

        .delivery-label {
            font-size: 0.5rem;
            color: #999;
            font-weight: 500;
        }

        .pause-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.4);
            display: none;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 5;
            transition: opacity 0.2s ease;
        }

        .pause-overlay.show {
            display: flex;
        }

        /* App Modal */
        .app-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
            z-index: 9999;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            animation: fadeIn 0.3s ease;
        }

        .app-modal-overlay.show {
            display: flex;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }

        @keyframes slideUp {
            from {
                transform: translateY(30px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .app-modal {
            background: white;
            border-radius: 16px;
            max-width: 320px;
            width: 100%;
            position: relative;
            animation: slideUp 0.3s ease;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modal-close {
            position: absolute;
            top: 0.75rem;
            right: 0.75rem;
            background: transparent;
            border: none;
            color: #666;
            cursor: pointer;
            padding: 0.4rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s ease;
        }

        .modal-close:hover {
            background: rgba(0, 0, 0, 0.05);
            color: #333;
        }

        .modal-close svg {
            width: 20px;
            height: 20px;
        }

        .modal-content {
            padding: 2.5rem 1.5rem 1.5rem;
            text-align: center;
        }

        .modal-logo {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            margin: 0 auto 1.25rem;
            display: block;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }

        .modal-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #1A1A1A;
            margin-bottom: 0.5rem;
        }

        .modal-text {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 1.5rem;
            line-height: 1.5;
        }

        .modal-buttons {
            display: flex;
            flex-direction: column;
            gap: 0.625rem;
        }

        .modal-btn {
            width: 100%;
            padding: 0.875rem 1.5rem;
            border-radius: 10px;
            font-weight: 700;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            border: none;
        }

        .modal-btn-primary {
            background: #FF006E;
            color: white;
        }

        .modal-btn-primary:hover {
            background: #e6006a;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(255, 0, 110, 0.3);
        }

        .modal-btn-secondary {
            background: transparent;
            color: #666;
            border: 2px solid #e5e5e5;
        }

        .modal-btn-secondary:hover {
            background: rgba(0, 0, 0, 0.03);
            border-color: #ccc;
        }

        @media (max-width: 968px) {
            .main-container {
                padding-top: 0;
                align-items: flex-start;
            }

            .content-wrapper {
                grid-template-columns: 1fr;
                gap: 0;
                padding: 0;
                position: relative;
                min-height: 100vh;
            }

            .video-section {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 1;
            }

            .video-player-wrapper {
                border-radius: 0;
                padding-top: 0;
                height: 100vh;
            }

            .video-player {
                position: relative;
                height: 100%;
            }

            .info-section {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                z-index: 10;
                background: linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.8) 50%, transparent 100%);
                border: none;
                border-radius: 0;
                padding: 1rem 1rem;
                padding-bottom: calc(1rem + env(safe-area-inset-bottom));
                padding-top: 3rem;
            }

            .creator-header {
                margin-bottom: 0.5rem;
                padding-bottom: 0.5rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            }

            .caption-section {
                margin-bottom: 0.5rem;
                padding: 0.5rem;
                max-height: 60px;
                -webkit-line-clamp: 2;
            }

            .place-section {
                margin-bottom: 0.5rem;
            }

            .place-name {
                font-size: 1rem;
            }

            .place-address {
                font-size: 0.8rem;
            }

            .stats-grid {
                padding: 0.5rem 0;
                margin: 0.5rem 0;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            }

            .delivery-links {
                padding: 0.5rem 0;
                margin: 0.5rem 0;
                border-top: none;
            }

            .top-banner {
                top: 1.5rem;
            }

            .mobile-logo {
                display: block;
            }
        }

        @media (max-width: 480px) {
            .navbar {
                display: none;
            }

            .mobile-logo img {
                width: 36px;
                height: 36px;
            }

            .info-section {
                padding: 0.75rem;
                padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
            }

            .creator-header {
                margin-bottom: 0.4rem;
                padding-bottom: 0.4rem;
            }

            .creator-avatar {
                width: 40px;
                height: 40px;
            }

            .creator-name {
                font-size: 0.9rem;
            }

            .creator-fullname {
                font-size: 0.75rem;
            }

            .caption-section {
                font-size: 0.8rem;
                margin-bottom: 0.4rem;
                padding: 0.4rem;
                max-height: 50px;
            }

            .place-section {
                margin-bottom: 0.4rem;
            }

            .place-name {
                font-size: 0.9rem;
            }

            .place-address {
                font-size: 0.75rem;
            }

            .stats-grid {
                gap: 0.25rem;
                padding: 0.2rem 0;
                margin: 0.2rem 0;
            }

            .stat-value {
                font-size: 0.8rem;
                gap: 0.15rem;
            }

            .stat-label {
                font-size: 0.65rem;
            }

            .delivery-links {
                gap: 0.3rem;
                padding: 0.3rem 0;
                margin: 0.3rem 0;
            }

            .delivery-link {
                padding: 0.4rem 0.6rem;
                font-size: 0.75rem;
            }

            .delivery-logo {
                width: 36px;
                height: 36px;
                border-radius: 8px;
            }

            .delivery-label {
                font-size: 0.45rem;
            }

            .top-banner {
                font-size: 0.8rem;
                padding: 0.4rem 1rem;
            }
        }

        /* iPhone SE and small screens */
        @media (max-width: 480px) and (max-height: 700px) {
            .info-section {
                padding: 0.5rem 0.75rem;
                padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
                padding-top: 2rem;
            }

            .creator-header {
                margin-bottom: 0.25rem;
                padding-bottom: 0.25rem;
                gap: 0.5rem;
            }

            .creator-avatar {
                width: 32px;
                height: 32px;
            }

            .creator-name {
                font-size: 0.8rem;
            }

            .creator-fullname {
                font-size: 0.7rem;
            }

            .caption-section {
                font-size: 0.75rem;
                margin-bottom: 0.2rem;
                padding: 0.3rem;
                max-height: 28px;
                -webkit-line-clamp: 1;
            }

            .caption-section.expanded {
                max-height: 300px;
            }

            .place-section {
                margin-bottom: 0.25rem;
            }

            .place-name {
                font-size: 0.8rem;
                margin-bottom: 0.15rem;
            }

            .place-address {
                font-size: 0.7rem;
            }

            .stats-grid {
                gap: 0.15rem;
                padding: 0.15rem 0;
                margin: 0.15rem 0;
            }

            .stat-value {
                font-size: 0.7rem;
                gap: 0.1rem;
            }

            .stat-label {
                font-size: 0.55rem;
            }

            .delivery-links {
                gap: 0.25rem;
                padding: 0.2rem 0;
                margin: 0.15rem 0;
            }

            .delivery-link {
                padding: 0.3rem 0.5rem;
                font-size: 0.7rem;
            }

            .delivery-logo {
                width: 30px;
                height: 30px;
                border-radius: 6px;
            }
        }
    </style>
</head>
<body>
    <!-- Navbar -->
    <nav class="navbar">
        <div class="nav-content">
            <a href="/" class="logo-link">
                <img src="/images/bitemap-logo.png" alt="BiteMap" class="logo-icon">
                <span class="logo-text">BiteMap</span>
            </a>
            <div class="nav-buttons">
                <a href="${appStoreUrl}" class="nav-download-btn" target="_blank" rel="noopener">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/></svg>
                    App Store
                </a>
                <button class="nav-android-btn" onclick="showAndroidModal()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-2.86-1.21-6.08-1.21-8.94 0L5.65 5.67c-.19-.29-.58-.38-.87-.2-.28.18-.37.54-.22.83L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"/></svg>
                    Join Android Beta
                </button>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="main-container">
        <div class="content-wrapper">
            <!-- Video Player -->
            <div class="video-section">
                <!-- Logo in top left (mobile only) -->
                <a href="/" class="mobile-logo">
                    <img src="/images/bitemap-logo.png" alt="BiteMap">
                </a>

                <!-- Subtle top banner -->
                <div class="top-banner" onclick="showAppModal()">
                    <span>Open BiteMap</span>
                </div>

                <div class="video-player-wrapper">
                    <video
                        id="video-player"
                        class="video-player"
                        playsinline
                        autoplay
                        muted
                        loop
                        poster="${thumbnailUrl}"
                        preload="metadata"
                    >
                        <source src="${videoUrl}" type="application/x-mpegURL">
                        Your browser does not support video playback.
                    </video>
                    <div class="pause-overlay" id="pauseOverlay">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="white">
                            <rect x="6" y="4" width="4" height="16" rx="1"/>
                            <rect x="14" y="4" width="4" height="16" rx="1"/>
                        </svg>
                    </div>
                </div>
            </div>

            <!-- App Modal Popup -->
            <div class="app-modal-overlay" id="appModal">
                <div class="app-modal">
                    <button class="modal-close" onclick="closeAppModal()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>

                    <div class="modal-content">
                        <img src="/images/bitemap-logo.png" alt="BiteMap" class="modal-logo">
                        <h2 class="modal-title">Get the full app experience</h2>
                        <p class="modal-text">Enjoy more videos and great features on the app</p>

                        <div class="modal-buttons">
                            <a href="${appStoreUrl}" class="modal-btn modal-btn-primary" target="_blank" rel="noopener">
                                Open BiteMap
                            </a>
                            <button class="modal-btn modal-btn-secondary" onclick="closeAppModal()">
                                Not now
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Android Beta Modal -->
            <div class="android-modal-overlay" id="androidModal">
                <div class="android-modal">
                    <button class="android-close" onclick="closeAndroidModal()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="#3DDC84" style="margin-bottom: 1rem;"><path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-2.86-1.21-6.08-1.21-8.94 0L5.65 5.67c-.19-.29-.58-.38-.87-.2-.28.18-.37.54-.22.83L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"/></svg>
                    <h2>Join the Android Beta</h2>
                    <p>Be the first to try BiteMap on Android. Drop your email and we'll notify you when it's ready.</p>
                    <form class="android-form" id="androidForm" onsubmit="submitAndroidBeta(event)">
                        <input type="email" id="androidEmail" placeholder="your@email.com" required>
                        <button type="submit">Join Waitlist</button>
                    </form>
                    <div class="android-success" id="androidSuccess">You're on the list! We'll be in touch.</div>
                </div>
            </div>

            <!-- Info Section -->
            <div class="info-section">
                <!-- Creator Info -->
                <div class="creator-header">
                    <div class="creator-avatar">
                    <img src="${creatorPic}" alt="${creatorName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                    <div style="display:none; width:100%; height:100%; align-items:center; justify-content:center; font-size:1.5rem; font-weight:700;">
                        ${creatorName.charAt(0).toUpperCase()}
                    </div>
                </div>
                    <div class="creator-details">
                        <div class="creator-name">@${creatorName}</div>
                        ${creatorFullName ? `<div class="creator-fullname">${creatorFullName}</div>` : ''}
                    </div>
                </div>

                <!-- Caption -->
                ${caption ? `<div class="caption-section">${caption}</div>` : ''}

                <!-- Restaurant Info -->
                ${video.place ? `
                <div class="place-section">
                    <h1 class="place-name">📍 ${placeName}</h1>
                    ${placeAddress || placeCity ? `
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(placeAddress || placeName)}" target="_blank" rel="noopener" class="place-address-link">
                        <span class="place-address">${placeAddress ? placeAddress : ''}${placeAddress && placeCity ? ', ' : ''}${placeCity || ''}</span>
                        <svg class="map-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                        </svg>
                    </a>` : ''}
                </div>
                ` : ''}

                <!-- Stats -->
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-value">👁️ ${formatNumber(views)}</span>
                        <span class="stat-label">Views</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">❤️ ${formatNumber(likes)}</span>
                        <span class="stat-label">Likes</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">📌 ${formatNumber(saves)}</span>
                        <span class="stat-label">Saves</span>
                    </div>
                </div>

                <!-- Delivery Links -->
                ${video.place ? `
                <div class="delivery-links">
                    <a href="https://www.ubereats.com/search?q=${encodeURIComponent(placeName)}" target="_blank" rel="noopener" class="delivery-link">
                        <img src="/images/ubereats.png" alt="Uber Eats" class="delivery-logo">
                        <span class="delivery-label">Uber Eats</span>
                    </a>
                    <a href="https://www.doordash.com/search/?query=${encodeURIComponent(placeName)}" target="_blank" rel="noopener" class="delivery-link">
                        <img src="/images/doordash.png" alt="DoorDash" class="delivery-logo">
                        <span class="delivery-label">DoorDash</span>
                    </a>
                    <a href="https://www.skipthedishes.com/search?q=${encodeURIComponent(placeName)}" target="_blank" rel="noopener" class="delivery-link">
                        <img src="/images/skipthedishes.png" alt="SkipTheDishes" class="delivery-logo">
                        <span class="delivery-label">Skip</span>
                    </a>
                    <a href="https://www.opentable.com/s?term=${encodeURIComponent(placeName)}" target="_blank" rel="noopener" class="delivery-link">
                        <img src="/images/opentable.png" alt="OpenTable" class="delivery-logo">
                        <span class="delivery-label">OpenTable</span>
                    </a>
                </div>
                ` : ''}
            </div>
        </div>
    </div>

    <script>
        // Click to play/pause
        const video = document.getElementById('video-player');
        const pauseOverlay = document.getElementById('pauseOverlay');

        function togglePlay() {
            if (video.paused) {
                video.play();
                pauseOverlay.classList.remove('show');
            } else {
                video.pause();
                pauseOverlay.classList.add('show');
            }
        }

        video.addEventListener('click', togglePlay);
        pauseOverlay.addEventListener('click', togglePlay);

        // Click caption to expand/collapse
        const captionEl = document.querySelector('.caption-section');
        if (captionEl) {
            captionEl.addEventListener('click', function() {
                this.classList.toggle('expanded');
            });
        }

        // Initialize HLS.js video player
        const videoSrc = '${videoUrl}';

        if (video && videoSrc && videoSrc.includes('.m3u8')) {
            if (Hls.isSupported()) {
                const hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: false,
                });
                hls.loadSource(videoSrc);
                hls.attachMedia(video);

                hls.on(Hls.Events.MANIFEST_PARSED, function() {
                    // Video ready
                });

                hls.on(Hls.Events.ERROR, function(event, data) {
                    // HLS error
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS support (Safari)
                video.src = videoSrc;
            }
        } else if (video && videoSrc) {
            // Regular MP4
            video.src = videoSrc;
        }

        // Deep link to app if installed (silent attempt via iframe)
        const deepLinkUrl = 'bitemap://video/${code}';
        setTimeout(() => {
            try {
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = deepLinkUrl;
                document.body.appendChild(iframe);
                setTimeout(() => {
                    try {
                        document.body.removeChild(iframe);
                    } catch (e) {
                        // Silently ignore if already removed
                    }
                }, 1000);
            } catch (e) {
                // Silently ignore deep link errors (expected when app not installed)
            }
        }, 500);

        // Modal functions
        function showAppModal() {
            const modal = document.getElementById('appModal');
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }

        function closeAppModal() {
            const modal = document.getElementById('appModal');
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }

        // Close modal when clicking outside
        document.getElementById('appModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeAppModal();
            }
        });

        // Android modal functions
        function showAndroidModal() {
            document.getElementById('androidModal').classList.add('show');
            document.body.style.overflow = 'hidden';
        }

        function closeAndroidModal() {
            document.getElementById('androidModal').classList.remove('show');
            document.body.style.overflow = 'auto';
        }

        document.getElementById('androidModal').addEventListener('click', function(e) {
            if (e.target === this) closeAndroidModal();
        });

        async function submitAndroidBeta(e) {
            e.preventDefault();
            const email = document.getElementById('androidEmail').value;
            const btn = document.querySelector('#androidForm button');
            const input = document.getElementById('androidEmail');
            btn.disabled = true;
            btn.textContent = 'Joining...';
            input.disabled = true;
            try {
                const res = await fetch('/api/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, source: 'android-beta' })
                });
                if (!res.ok) throw new Error('Failed');
                document.getElementById('androidForm').style.display = 'none';
                document.getElementById('androidSuccess').style.display = 'block';
            } catch (err) {
                btn.disabled = false;
                btn.textContent = 'Join Waitlist';
                input.disabled = false;
                alert('Something went wrong. Please try again.');
            }
        }

        // Auto-show modal after 2 seconds (only on mobile)
        if (window.innerWidth <= 968) {
            setTimeout(() => {
                showAppModal();
            }, 2000);
        }
    </script>
</body>
</html>`;
}

function renderNotFound() {
  const appStoreUrl = 'https://apps.apple.com/us/app/bitemap/id6746139076';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Oops! Video Not Found - BiteMap</title>
    <link rel="stylesheet" href="/css/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #FF006E 0%, #FB5607 50%, #FFBE0B 100%);
            text-align: center;
            padding: 2rem;
            margin: 0;
        }
        .not-found-container {
            max-width: 500px;
            background: rgba(255, 255, 255, 0.98);
            border-radius: 24px;
            padding: 3rem 2rem;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            color: #1A1A1A;
        }
        .emoji {
            font-size: 5rem;
            margin-bottom: 1rem;
            animation: bounce 2s ease infinite;
        }
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }
        .not-found-container h1 {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: #1A1A1A;
        }
        .not-found-container p {
            font-size: 1.125rem;
            margin-bottom: 0.5rem;
            color: #666;
            line-height: 1.6;
        }
        .reason {
            font-size: 0.95rem;
            color: #999;
            margin-bottom: 2rem;
            font-style: italic;
        }
        .buttons {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-top: 2rem;
        }
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 1rem 2rem;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 1.125rem;
            transition: all 0.3s ease;
        }
        .btn-primary {
            background: #FF006E;
            color: white;
        }
        .btn-primary:hover {
            background: #e6006a;
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(255, 0, 110, 0.3);
        }
        .btn-secondary {
            background: white;
            color: #FF006E;
            border: 2px solid #FF006E;
        }
        .btn-secondary:hover {
            background: #FF006E;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(255, 0, 110, 0.2);
        }
        @media (max-width: 480px) {
            .not-found-container {
                padding: 2rem 1.5rem;
            }
            .not-found-container h1 {
                font-size: 1.5rem;
            }
            .emoji {
                font-size: 4rem;
            }
        }
    </style>
</head>
<body>
    <div class="not-found-container">
        <div class="emoji">🤔</div>
        <h1>Oops! Wrong Link</h1>
        <p>This video doesn't exist or may have been removed.</p>
        <p class="reason">The link might be broken or outdated.</p>

        <div class="buttons">
            <a href="${appStoreUrl}" class="btn btn-primary" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                </svg>
                Download BiteMap
            </a>
            <a href="/" class="btn btn-secondary">Browse Landing Page</a>
        </div>
    </div>
</body>
</html>`;
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
