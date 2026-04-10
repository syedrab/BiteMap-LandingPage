/**
 * Referral Landing Page API
 * Shows a personalized referral page for creators
 * Route: /r/:code
 */

const supabaseUrl = 'https://lqslpgiibpcvknfehdlr.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  const { code: rawCode } = req.query;

  // Validate code is alphanumeric 8-char share code
  const code = (typeof rawCode === 'string' && /^[A-Za-z0-9]{8}$/.test(rawCode)) ? rawCode : null;

  if (!code) {
    return res.redirect(302, '/');
  }

  if (!supabaseAnonKey) {
    console.error('Missing SUPABASE_ANON_KEY environment variable');
    return res.status(500).send('Server configuration error');
  }

  try {
    // Fetch creator info
    const creatorRes = await fetch(`${supabaseUrl}/functions/v1/get-creator-by-share-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({ shareCode: code })
    });

    if (!creatorRes.ok) {
      // Invalid code — redirect to homepage
      return res.redirect(302, '/');
    }

    const creator = await creatorRes.json();
    const html = renderReferralPage(creator, code);
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);

  } catch (error) {
    console.error('Error loading referral page:', error);
    return res.redirect(302, '/');
  }
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderReferralPage(creator, code) {
  const safeName = escapeHtml(creator.name || 'Someone');
  const safeImageUrl = escapeHtml(creator.imageUrl || '');
  const appStoreUrl = 'https://apps.apple.com/us/app/bitemap/id6746139076';
  const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.bitemap.app&hl=en_CA';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeName} invited you to BiteMap</title>

    <meta property="og:type" content="website">
    <meta property="og:url" content="https://bitemap.fun/r/${escapeHtml(code)}">
    <meta property="og:title" content="${safeName} invited you to BiteMap">
    <meta property="og:description" content="Discover the best food spots near you">
    <meta property="og:image" content="${safeImageUrl || '/images/og-image.jpg'}">
    <meta property="og:site_name" content="BiteMap">

    <meta name="apple-itunes-app" content="app-id=6746139076">

    <link rel="icon" type="image/png" href="/images/bitemap-logo.png">
    <link rel="apple-touch-icon" href="/images/bitemap-logo.png">

    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Baloo+2:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #ffffff;
            color: #1a1a1a;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .navbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid #f0f0f0;
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
            color: #1a1a1a;
        }

        .logo-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
        }

        .logo-text {
            font-family: 'Baloo 2', sans-serif;
            font-size: 1.25rem;
            font-weight: 700;
        }

        .main-content {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 6rem 1.5rem 3rem;
        }

        .referral-card {
            text-align: center;
            max-width: 420px;
            width: 100%;
        }

        .creator-avatar {
            width: 96px;
            height: 96px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid #f0f0f0;
            margin-bottom: 1.5rem;
        }

        .avatar-placeholder {
            width: 96px;
            height: 96px;
            border-radius: 50%;
            background: linear-gradient(135deg, #FF6B35, #FF8F5E);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            color: white;
            font-weight: 700;
            margin-bottom: 1.5rem;
        }

        .referral-title {
            font-family: 'Baloo 2', sans-serif;
            font-size: 1.75rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            line-height: 1.3;
        }

        .referral-subtitle {
            font-size: 1.1rem;
            color: #666;
            margin-bottom: 2rem;
        }

        .download-buttons {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            align-items: center;
        }

        .store-btn {
            display: inline-block;
            transition: transform 0.2s, opacity 0.2s;
        }

        .store-btn:hover {
            transform: scale(1.05);
            opacity: 0.9;
        }

        .store-btn img {
            height: 48px;
        }

        .android-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border: 2px solid #3DDC84;
            border-radius: 12px;
            background: transparent;
            color: #1a1a1a;
            font-family: 'Space Grotesk', sans-serif;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s, transform 0.2s;
            text-decoration: none;
        }

        .android-btn:hover {
            background: rgba(61, 220, 132, 0.1);
            transform: scale(1.05);
        }

        .footer {
            text-align: center;
            padding: 1.5rem;
            font-size: 0.85rem;
            color: #999;
            border-top: 1px solid #f0f0f0;
        }

        .footer a {
            color: #666;
            text-decoration: none;
            margin: 0 0.5rem;
        }

        .footer a:hover {
            color: #1a1a1a;
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="nav-content">
            <a href="/" class="logo-link">
                <img src="/images/bitemap-logo.png" alt="BiteMap" class="logo-icon">
                <span class="logo-text">BiTEMaP</span>
            </a>
        </div>
    </nav>

    <div class="main-content">
        <div class="referral-card">
            ${safeImageUrl
              ? `<img src="${safeImageUrl}" alt="${safeName}" class="creator-avatar">`
              : `<div class="avatar-placeholder">${escapeHtml((creator.name || 'B')[0].toUpperCase())}</div>`
            }
            <h1 class="referral-title">${safeName} invited you to BiteMap</h1>
            <p class="referral-subtitle">Discover the best food spots near you</p>

            <div class="download-buttons">
                <a href="${appStoreUrl}" class="store-btn ios-btn" target="_blank" rel="noopener">
                    <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store">
                </a>
                <a href="${playStoreUrl}" class="store-btn android-store-btn" target="_blank" rel="noopener">
                    <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" style="height: 70px; margin: -11px 0;">
                </a>
            </div>
        </div>
    </div>

    <footer class="footer">
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms & Services</a>
        <a href="/support">Support</a>
    </footer>

    <script>
        // Referral share tracking
        (function() {
            var code = ${JSON.stringify(code)};
            var trackingUrl = '${supabaseUrl}/functions/v1/track-share-click';
            var headers = {
                'Content-Type': 'application/json',
                'apikey': ${JSON.stringify(supabaseAnonKey)},
                'Authorization': 'Bearer ' + ${JSON.stringify(supabaseAnonKey)}
            };

            // Fire page_view on load (fire-and-forget)
            fetch(trackingUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ shareCode: code, videoId: 'referral', eventType: 'page_view' })
            }).catch(function() {});

            // Track download clicks
            function trackDownload(platform) {
                fetch(trackingUrl, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({ shareCode: code, videoId: 'referral', eventType: 'download_click', platform: platform })
                }).catch(function() {});
            }

            document.querySelectorAll('.ios-btn').forEach(function(el) {
                el.addEventListener('click', function() { trackDownload('ios'); });
            });

            document.querySelectorAll('.android-store-btn').forEach(function(el) {
                el.addEventListener('click', function() { trackDownload('android'); });
            });
        })();
    </script>
</body>
</html>`;
}
