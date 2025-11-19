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
  const thumbnailUrl = video.thumbnail_url || 'https://bitemap.fun/images/og-image.jpg';
  const creatorName = video.creator?.name || 'BiteMap Creator';
  const creatorPic = ''; // TODO: Build from creator.image_url
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

    <!-- HLS.js for video playback -->
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>

    <link rel="stylesheet" href="/css/styles.css">
    <style>
        .video-preview-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #FF006E 0%, #FB5607 50%, #FFBE0B 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }

        .video-preview-card {
            max-width: 500px;
            width: 100%;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .video-player-wrapper {
            position: relative;
            width: 100%;
            padding-top: 177.78%; /* 9:16 aspect ratio */
            background: #000;
        }

        .video-player {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .video-info {
            padding: 1.5rem;
            color: #1A1A1A;
        }

        .creator-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
        }

        .creator-avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #FF006E;
        }

        .creator-name {
            font-weight: 700;
            font-size: 1.125rem;
            margin: 0;
        }

        .place-info {
            margin: 1rem 0;
        }

        .place-name {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 0.25rem;
            color: #1A1A1A;
        }

        .place-address {
            font-size: 0.875rem;
            color: #666;
        }

        .video-stats {
            display: flex;
            gap: 1.5rem;
            margin: 1rem 0;
            font-size: 0.875rem;
            color: #666;
        }

        .stat {
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }

        .download-app-button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            width: 100%;
            padding: 1rem 1.5rem;
            background: #FF006E;
            color: white;
            border: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 1.125rem;
            text-decoration: none;
            transition: all 0.3s ease;
            margin-top: 1rem;
        }

        .download-app-button:hover {
            background: #e6006a;
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(255, 0, 110, 0.3);
        }

        @media (max-width: 768px) {
            .video-preview-container {
                padding: 0;
            }

            .video-preview-card {
                max-width: 100%;
                border-radius: 0;
                min-height: 100vh;
            }
        }
    </style>
</head>
<body>
    <div class="video-preview-container">
        <div class="video-preview-card">
            <div class="video-player-wrapper">
                <video
                    id="video-player"
                    class="video-player"
                    controls
                    playsinline
                    poster="${thumbnailUrl}"
                    preload="metadata"
                >
                    <source src="${videoUrl}" type="application/x-mpegURL">
                    Your browser does not support video playback.
                </video>
            </div>

            <div class="video-info">
                ${creatorPic ? `
                <div class="creator-info">
                    <img src="${creatorPic}" alt="${creatorName}" class="creator-avatar">
                    <h2 class="creator-name">${creatorName}</h2>
                </div>
                ` : `
                <div class="creator-info">
                    <h2 class="creator-name">${creatorName}</h2>
                </div>
                `}

                <div class="place-info">
                    <h3 class="place-name">${placeName}</h3>
                    ${placeAddress ? `<p class="place-address">${placeAddress}${placeCity ? `, ${placeCity}` : ''}</p>` : ''}
                </div>

                <div class="video-stats">
                    <div class="stat">❤️ ${formatNumber(likes)}</div>
                    <div class="stat">📌 ${formatNumber(saves)}</div>
                    <div class="stat">👁️ ${formatNumber(views)}</div>
                </div>

                <a href="${appStoreUrl}" class="download-app-button" target="_blank" rel="noopener">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                        <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                    </svg>
                    Download BiteMap
                </a>
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

        // Deep link to app if installed
        const deepLinkUrl = 'bitemap://video/${code}';
        const timeout = setTimeout(() => {
            // App not installed, do nothing (already showing download button)
        }, 1000);

        // Try to open app
        window.location.href = deepLinkUrl;

        // If user returns, clear timeout
        window.addEventListener('blur', () => {
            clearTimeout(timeout);
        });
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
