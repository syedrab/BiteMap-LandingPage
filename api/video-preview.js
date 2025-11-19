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

    // Fetch video with related data
    const { data: video, error } = await supabase
      .from('Videos')
      .select('*')
      .eq('shareable_code', code)
      .single();

    console.log('Video fetch result:', { video, error });

    // Fetch related data separately
    if (video && !error) {
      if (video.creator_id) {
        const { data: creator } = await supabase
          .from('Creator')
          .select('id, name, image_url')
          .eq('id', video.creator_id)
          .single();
        video.creator = creator;
      }

      if (video.place_id) {
        const { data: place } = await supabase
          .from('Places')
          .select('id, name, address, city, latitude, longitude, rating, google_maps_url')
          .eq('id', video.place_id)
          .single();
        video.place = place;
      }
    }

    if (error || !video) {
      console.error('Supabase query error:', error);
      console.log('Query params:', { code });
      return res.status(404).send(renderNotFound());
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
  const creatorName = video.creator?.name || 'BiteMap Creator';
  const creatorPic = `https://lqslpgiibpcvknfehdlr.supabase.co/storage/v1/object/public/photos/profile/${creatorName}.jpeg`;
  const placeName = video.place?.name || 'Amazing Restaurant';
  const placeAddress = video.place?.address || '';
  const placeCity = video.place?.city || '';
  const likes = video.likes || 0;
  const saves = video.saves || 0;
  const views = video.views || 0;

  const title = `${creatorName} on BiteMap: ${placeName}`;
  const description = `Watch this delicious review of ${placeName}${placeCity ? ` in ${placeCity}` : ''}. See more food content on BiteMap!`;

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
    <link rel="icon" type="image/x-icon" href="/images/bitemap.jpeg">
    <link rel="apple-touch-icon" href="/images/bitemap.jpeg">

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

        .nav-download-btn {
            background: #FF006E;
            color: white;
            padding: 0.5rem 1.25rem;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.875rem;
            transition: all 0.3s ease;
        }

        .nav-download-btn:hover {
            background: #e6006a;
            transform: translateY(-2px);
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

        .place-section {
            margin-bottom: 2rem;
        }

        .section-label {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #FF006E;
            font-weight: 600;
            margin-bottom: 0.5rem;
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
            display: block;
            margin-bottom: 0.25rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.25rem;
        }

        .stat-label {
            font-size: 0.875rem;
            color: #999;
        }

        .cta-section {
            margin-bottom: 2rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .cta-text {
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 1rem;
            text-align: center;
        }

        .cta-subtext {
            font-size: 0.95rem;
            color: #999;
            text-align: center;
            margin-bottom: 1.5rem;
        }

        .download-button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            width: 100%;
            padding: 1.25rem 2rem;
            background: linear-gradient(135deg, #FF006E 0%, #FB5607 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 1.125rem;
            text-decoration: none;
            transition: all 0.3s ease;
            box-shadow: 0 10px 30px rgba(255, 0, 110, 0.3);
        }

        .download-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 40px rgba(255, 0, 110, 0.4);
        }

        .share-button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            width: 100%;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: white;
            font-weight: 600;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 1rem;
        }

        .share-button:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);
        }

        .delivery-links {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            margin: 1.5rem 0;
            padding: 1.5rem 0;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .delivery-link {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.625rem 1rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: white;
            text-decoration: none;
            font-size: 0.875rem;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .delivery-link:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
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
                padding: 1.5rem 1rem;
                padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));
            }

            .creator-header {
                margin-bottom: 1rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            }

            .place-name {
                font-size: 1.125rem;
            }

            .place-address {
                font-size: 0.85rem;
            }

            .stats-grid {
                padding: 1rem 0;
                margin: 1rem 0;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            }

            .delivery-links {
                padding: 1rem 0;
                margin: 1rem 0;
                border-top: none;
            }

            .cta-section {
                margin-bottom: 1rem;
                padding-bottom: 1rem;
            }

            .share-button {
                display: none;
            }
        }

        @media (max-width: 480px) {
            .navbar {
                display: none;
            }

            .info-section {
                padding: 1rem;
                padding-bottom: calc(1rem + env(safe-area-inset-bottom));
            }

            .creator-header {
                margin-bottom: 0.75rem;
                padding-bottom: 0.75rem;
            }

            .creator-avatar {
                width: 48px;
                height: 48px;
            }

            .creator-name {
                font-size: 1rem;
            }

            .section-label {
                font-size: 0.7rem;
            }

            .place-name {
                font-size: 1rem;
            }

            .place-address {
                font-size: 0.8rem;
            }

            .stats-grid {
                gap: 0.5rem;
                padding: 0.75rem 0;
                margin: 0.75rem 0;
            }

            .stat-value {
                font-size: 1rem;
            }

            .stat-label {
                font-size: 0.75rem;
            }

            .delivery-links {
                gap: 0.5rem;
                padding: 0.75rem 0;
                margin: 0.75rem 0;
            }

            .delivery-link {
                padding: 0.5rem 0.75rem;
                font-size: 0.8rem;
            }

            .cta-section {
                margin-bottom: 0.75rem;
                padding-bottom: 0.75rem;
            }

            .cta-text {
                font-size: 0.95rem;
            }

            .cta-subtext {
                font-size: 0.85rem;
            }

            .download-button {
                padding: 0.875rem 1.25rem;
                font-size: 0.95rem;
            }
        }
    </style>
</head>
<body>
    <!-- Navbar -->
    <nav class="navbar">
        <div class="nav-content">
            <a href="/" class="logo-link">
                <img src="/images/bitemap.jpeg" alt="BiteMap" class="logo-icon">
                <span class="logo-text">BiteMap</span>
            </a>
            <a href="${appStoreUrl}" class="nav-download-btn" target="_blank" rel="noopener">Download</a>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="main-container">
        <div class="content-wrapper">
            <!-- Video Player -->
            <div class="video-section">
                <div class="video-player-wrapper">
                    <video
                        id="video-player"
                        class="video-player"
                        controls
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
                </div>
            </div>

            <!-- Info Section -->
            <div class="info-section">
                <!-- CTA Section -->
                <div class="cta-section">
                    <div class="cta-text">Want to see more?</div>
                    <div class="cta-subtext">Download BiteMap to discover thousands of local food videos</div>
                    <a href="${appStoreUrl}" class="download-button" target="_blank" rel="noopener">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                            <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                        </svg>
                        Download BiteMap
                    </a>
                    <button class="share-button" onclick="shareVideo()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                        Share Video
                    </button>
                </div>

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
                        <div class="creator-label">Content Creator</div>
                    </div>
                </div>

                <!-- Restaurant Info -->
                <div class="place-section">
                    <div class="section-label">📍 Restaurant</div>
                    <h1 class="place-name">${placeName}</h1>
                    ${placeAddress || placeCity ? `<div class="place-address">${placeAddress ? placeAddress : ''}${placeAddress && placeCity ? ', ' : ''}${placeCity || ''}</div>` : ''}
                </div>

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
                ${placeName !== 'Amazing Restaurant' ? `
                <div class="delivery-links">
                    <a href="https://www.ubereats.com/search?q=${encodeURIComponent(placeName)}" target="_blank" rel="noopener" class="delivery-link">
                        🍔 Uber Eats
                    </a>
                    <a href="https://www.doordash.com/search/?query=${encodeURIComponent(placeName)}" target="_blank" rel="noopener" class="delivery-link">
                        🚗 DoorDash
                    </a>
                    <a href="https://www.skipthedishes.com/search?q=${encodeURIComponent(placeName)}" target="_blank" rel="noopener" class="delivery-link">
                        📦 SkipTheDishes
                    </a>
                    <a href="https://www.opentable.com/s?term=${encodeURIComponent(placeName)}" target="_blank" rel="noopener" class="delivery-link">
                        🍽️ OpenTable
                    </a>
                </div>
                ` : ''}
            </div>
        </div>
    </div>

    <script>
        // Initialize HLS.js video player
        const video = document.getElementById('video-player');
        const videoSrc = '${videoUrl}';

        if (videoSrc.includes('.m3u8')) {
            if (Hls.isSupported()) {
                const hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: false,
                });
                hls.loadSource(videoSrc);
                hls.attachMedia(video);

                hls.on(Hls.Events.MANIFEST_PARSED, function() {
                    console.log('Video ready to play');
                });

                hls.on(Hls.Events.ERROR, function(event, data) {
                    console.error('HLS error:', data);
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS support (Safari)
                video.src = videoSrc;
            }
        } else {
            // Regular MP4
            video.src = videoSrc;
        }

        // Deep link to app if installed (silent attempt via iframe)
        const deepLinkUrl = 'bitemap://video/${code}';
        setTimeout(() => {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = deepLinkUrl;
            document.body.appendChild(iframe);
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 500);

        // Share function
        function shareVideo() {
            if (navigator.share) {
                navigator.share({
                    title: '${title.replace(/'/g, "\\'")}',
                    text: '${description.replace(/'/g, "\\'")}',
                    url: '${pageUrl}'
                }).catch(err => console.log('Error sharing:', err));
            } else {
                // Fallback: copy to clipboard
                navigator.clipboard.writeText('${pageUrl}').then(() => {
                    alert('Link copied to clipboard!');
                });
            }
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
