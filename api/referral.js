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
  const safeName = escapeHtml(creator.full_name || creator.name || 'Someone');
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

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Baloo+2:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html, body {
            height: 100%;
            overflow: hidden;
        }

        body {
            font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #ffffff;
            color: #1a1a1a;
            display: flex;
            flex-direction: column;
            user-select: none;
            -webkit-user-select: none;
        }

        /* Toronto Street Grid */
        .street-grid {
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 0;
        }

        .grid-line {
            position: absolute;
            background: transparent;
            opacity: 0.15;
        }

        .grid-line.vertical {
            width: 0;
            top: 0;
            bottom: 0;
            border-left: 1px dashed #666;
        }

        .grid-line.horizontal {
            height: 0;
            left: 0;
            right: 0;
            border-top: 1px dashed #666;
        }

        /* Street Signs */
        .street-signs {
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 1;
        }

        .street-sign {
            position: absolute;
            font-family: 'Space Grotesk', sans-serif;
            font-size: 11px;
            font-weight: 600;
            color: #000;
            opacity: 0.12;
            text-transform: uppercase;
            letter-spacing: 1px;
            white-space: nowrap;
        }

        .street-sign.vertical {
            writing-mode: vertical-rl;
            text-orientation: mixed;
        }

        /* Landmarks */
        .landmark-container {
            position: fixed;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            z-index: 1;
        }

        .landmark-label {
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            font-family: 'Space Grotesk', sans-serif;
            font-size: 10px;
            font-weight: 500;
            color: #000;
            opacity: 0.3;
            letter-spacing: 0.5px;
            white-space: nowrap;
            margin-top: 4px;
        }

        .cn-tower-container { bottom: 12%; left: 20%; }
        .cn-tower-img { width: min(33px, 2.6vw); height: auto; opacity: 0.18; }

        .casaloma-container { top: 15%; left: 8%; }
        .casaloma-img { width: min(80px, 6.4vw); height: auto; opacity: 0.18; }

        .stlawrence-container { bottom: 14%; left: 68%; }
        .stlawrence-img { width: min(108px, 8.4vw); height: auto; opacity: 0.18; }

        .donvalley-container { top: -5%; left: 85%; }
        .donvalley-img { width: min(203px, 15.6vw); height: auto; opacity: 0.18; }

        .toronto-container { top: 55%; left: 32%; }
        .toronto-img { width: min(180px, 14vw); height: auto; opacity: 0.22; }

        .rom-container { top: 28%; left: 26%; }
        .rom-img { width: min(90px, 7vw); height: auto; opacity: 0.18; }

        .dundassq-container { top: 42%; left: 50%; }
        .dundassq-img { width: min(50px, 4vw); height: auto; opacity: 0.18; }

        .bmofield-container { top: 94%; left: 3%; transform: translateY(-100%); }
        .bmofield-img { width: min(108px, 8.4vw); height: auto; opacity: 0.18; }

        .harbourfront-container { top: 94%; left: 44%; transform: translateY(-50%); }
        .harbourfront-img { width: min(100px, 8vw); height: auto; opacity: 0.18; }

        /* Don Valley River */
        .don-river {
            position: fixed;
            left: 92%;
            top: 0;
            bottom: 0;
            width: 30px;
            pointer-events: none;
            z-index: 0;
            opacity: 0.15;
        }

        .don-river svg { height: 100%; width: 100%; }
        .don-river path { fill: none; stroke: #3b82f6; stroke-width: 8; stroke-linecap: round; }

        /* Main Content */
        .main-content {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            position: relative;
            z-index: 10;
        }

        .referral-card {
            text-align: center;
            max-width: 480px;
            width: 100%;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            padding: 48px 40px;
            box-shadow: 0 8px 40px rgba(0, 0, 0, 0.08);
            border: 1px solid #f0f0f0;
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
            font-size: 44px;
            font-weight: 600;
            margin-bottom: 0.5rem;
            line-height: 1.1;
            letter-spacing: -1px;
        }

        .referral-subtitle {
            font-size: 18px;
            color: #666;
            line-height: 1.6;
            margin-bottom: 2rem;
        }

        .download-buttons {
            display: flex;
            align-items: center;
            gap: 20px;
            justify-content: center;
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
            height: 54px;
            width: auto;
        }

        .store-btn img.google-play-img {
            height: 80px;
        }

        /* Footer */
        footer {
            padding: 20px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
            color: #888;
            border-top: 1px solid #f0f0f0;
        }

        footer a {
            color: #888;
            text-decoration: none;
            transition: color 0.2s;
        }

        footer a:hover {
            color: #FF6B35;
        }

        .footer-links {
            display: flex;
            gap: 24px;
        }

        /* Mobile Menu */
        .mobile-menu-btn {
            display: none;
            position: fixed;
            top: 20px;
            right: 20px;
            width: 44px;
            height: 44px;
            background: #fff;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 5px;
        }

        .mobile-menu-btn span {
            display: block;
            width: 20px;
            height: 2px;
            background: #333;
            border-radius: 2px;
            transition: 0.3s;
        }

        .mobile-menu-btn.active span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
        .mobile-menu-btn.active span:nth-child(2) { opacity: 0; }
        .mobile-menu-btn.active span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

        .mobile-menu {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255,255,255,0.98);
            z-index: 999;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 24px;
        }

        .mobile-menu.active { display: flex; }

        .mobile-menu a {
            font-size: 24px;
            color: #333;
            text-decoration: none;
            font-weight: 500;
            padding: 12px 24px;
            border-radius: 12px;
            transition: background 0.2s;
        }

        .mobile-menu a:hover { background: #f5f5f5; }

        /* Medium screens */
        @media (max-height: 900px) {
            .referral-title { font-size: 38px; }
            .referral-subtitle { font-size: 16px; }
            .cn-tower-img { width: min(32px, 3.5vw); }
            .casaloma-img { width: min(70px, 6vw); }
            .toronto-img { width: min(140px, 11vw); }
            .donvalley-img { width: min(153px, 12.6vw); }
            .street-sign { font-size: 10px; }
            .landmark-label { font-size: 10px; }
            footer { padding: 15px 30px; font-size: 12px; }
        }

        /* Tablet & Mobile */
        @media (max-width: 1100px) {
            .toronto-container, .rom-container, .dundassq-container, .don-river { display: none; }
            .street-grid .grid-line { opacity: 0.06; }
            .street-sign { font-size: 8px; opacity: 0.08; }
            .landmark-label { display: none; }

            .cn-tower-container { display: flex; bottom: 5%; left: 5%; }
            .cn-tower-img { width: 18px; opacity: 0.1; }

            .casaloma-container { display: flex; top: 3%; left: 3%; }
            .casaloma-img { width: 40px; opacity: 0.1; }

            .donvalley-container { display: flex; top: 3%; right: 3%; left: auto; }
            .donvalley-img { width: 50px; opacity: 0.1; }

            .stlawrence-container { display: flex; bottom: 5%; right: 3%; left: auto; }
            .stlawrence-img { width: 40px; opacity: 0.1; }

            .bmofield-container, .harbourfront-container { display: none; }

            .referral-subtitle { display: none; }

            .main-content {
                padding: 15px;
            }

            .referral-title { font-size: 28px; }

            footer { display: none; }
        }

        @media (max-width: 768px) {
            .mobile-menu-btn { display: flex; }
        }

        /* Mobile */
        @media (max-width: 600px) {
            .referral-title { font-size: 24px; }
            .creator-avatar { width: 80px; height: 80px; }
            .avatar-placeholder { width: 80px; height: 80px; font-size: 2rem; }
            .store-btn img { height: 44px; }
            .store-btn img.google-play-img { height: 65px; }
            .download-buttons { gap: 12px; }
        }

        /* Extra small */
        @media (max-height: 750px) and (max-width: 600px) {
            .referral-title { font-size: 22px; }
            .creator-avatar { width: 64px; height: 64px; margin-bottom: 1rem; }
            .avatar-placeholder { width: 64px; height: 64px; font-size: 1.5rem; margin-bottom: 1rem; }
            .store-btn img { height: 40px; }
            .store-btn img.google-play-img { height: 60px; }
        }
    </style>
</head>
<body>
    <!-- Mobile Menu -->
    <button class="mobile-menu-btn" id="menuBtn">
        <span></span>
        <span></span>
        <span></span>
    </button>
    <div class="mobile-menu" id="mobileMenu">
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms & Services</a>
        <a href="/support">Support</a>
        <a href="${appStoreUrl}" target="_blank">Download App</a>
    </div>

    <!-- Landmarks -->
    <div class="landmark-container cn-tower-container">
        <img src="/images/cntower.jpg" alt="CN Tower" class="cn-tower-img">
        <span class="landmark-label">CN Tower</span>
    </div>
    <div class="landmark-container toronto-container">
        <img src="/images/toronto.jpg" alt="Toronto" class="toronto-img">
    </div>
    <div class="landmark-container casaloma-container">
        <img src="/images/casaloma.jpg" alt="Casa Loma" class="casaloma-img">
        <span class="landmark-label">Casa Loma</span>
    </div>
    <div class="landmark-container stlawrence-container">
        <img src="/images/stlawrence.jpg" alt="St. Lawrence Market" class="stlawrence-img">
        <span class="landmark-label">St. Lawrence Market</span>
    </div>
    <div class="landmark-container bmofield-container">
        <img src="/images/bmofield.jpg" alt="BMO Field" class="bmofield-img">
        <span class="landmark-label">BMO Field</span>
    </div>
    <div class="landmark-container rom-container">
        <img src="/images/ROM.jpg" alt="Royal Ontario Museum" class="rom-img">
        <span class="landmark-label">ROM</span>
    </div>
    <div class="landmark-container donvalley-container">
        <img src="/images/donvalley.jpg" alt="Don Valley" class="donvalley-img">
    </div>
    <div class="landmark-container harbourfront-container">
        <img src="/images/harbourfront.jpg" alt="Harbourfront" class="harbourfront-img">
    </div>
    <div class="landmark-container dundassq-container">
        <img src="/images/dundassq.jpg" alt="Dundas Square" class="dundassq-img">
    </div>

    <!-- Don Valley River -->
    <div class="don-river">
        <svg viewBox="0 0 30 1000" preserveAspectRatio="none">
            <path d="M15,0 Q25,50 15,100 Q5,150 15,200 Q25,250 15,300 Q5,350 15,400 Q25,450 15,500 Q5,550 15,600 Q25,650 15,700 Q5,750 15,800 Q25,850 15,900 Q5,950 15,1000"/>
        </svg>
    </div>

    <!-- Toronto Street Grid -->
    <div class="street-grid">
        <div class="grid-line vertical" style="left: 2%;"></div>
        <div class="grid-line vertical" style="left: 14%;"></div>
        <div class="grid-line vertical" style="left: 26%;"></div>
        <div class="grid-line vertical" style="left: 38%;"></div>
        <div class="grid-line vertical" style="left: 50%;"></div>
        <div class="grid-line vertical" style="left: 62%;"></div>
        <div class="grid-line vertical" style="left: 74%;"></div>
        <div class="grid-line vertical" style="left: 86%;"></div>
        <div class="grid-line vertical" style="left: 98%;"></div>
        <div class="grid-line horizontal" style="top: 2%;"></div>
        <div class="grid-line horizontal" style="top: 15%;"></div>
        <div class="grid-line horizontal" style="top: 28%;"></div>
        <div class="grid-line horizontal" style="top: 42%;"></div>
        <div class="grid-line horizontal" style="top: 55%;"></div>
        <div class="grid-line horizontal" style="top: 68%;"></div>
        <div class="grid-line horizontal" style="top: 81%;"></div>
        <div class="grid-line horizontal" style="top: 94%;"></div>
    </div>

    <!-- Street Signs -->
    <div class="street-signs">
        <div class="street-sign vertical" style="top: 44%; left: 2%;">Bathurst St</div>
        <div class="street-sign vertical" style="top: 44%; left: 14%;">Spadina Ave</div>
        <div class="street-sign vertical" style="top: 44%; left: 26%;">University Ave</div>
        <div class="street-sign vertical" style="top: 44%; left: 38%;">Bay St</div>
        <div class="street-sign vertical" style="top: 87%; left: 38%;">Bay St</div>
        <div class="street-sign vertical" style="top: 6%; left: 50%;">Yonge St</div>
        <div class="street-sign vertical" style="top: 84%; left: 50%;">Yonge St</div>
        <div class="street-sign vertical" style="top: 21%; left: 62%;">Church St</div>
        <div class="street-sign vertical" style="top: 74%; left: 62%;">Church St</div>
        <div class="street-sign vertical" style="top: 44%; left: 74%;">Jarvis St</div>
        <div class="street-sign vertical" style="top: 44%; left: 86%;">Parliament St</div>
        <div class="street-sign vertical" style="top: 44%; left: 98%;">Broadview Ave</div>

        <div class="street-sign" style="top: 2%; left: 5%;">Eglinton Ave</div>
        <div class="street-sign" style="top: 2%; left: 53%;">Eglinton Ave</div>
        <div class="street-sign" style="top: 2%; left: 95%;">Eglinton Ave</div>
        <div class="street-sign" style="top: 15%; left: 20%;">St Clair Ave</div>
        <div class="street-sign" style="top: 15%; left: 74%;">St Clair Ave</div>
        <div class="street-sign" style="top: 28%; left: 3%;">Bloor St</div>
        <div class="street-sign" style="top: 28%; left: 68%;">Bloor St</div>
        <div class="street-sign" style="top: 28%; left: 95%;">Danforth Ave</div>
        <div class="street-sign" style="top: 42%; left: 20%;">Dundas St</div>
        <div class="street-sign" style="top: 42%; left: 80%;">Dundas St</div>
        <div class="street-sign" style="top: 55%; left: 3%;">Queen St</div>
        <div class="street-sign" style="top: 55%; left: 95%;">Queen St</div>
        <div class="street-sign" style="top: 68%; left: 20%;">King St</div>
        <div class="street-sign" style="top: 68%; left: 80%;">King St</div>
        <div class="street-sign" style="top: 81%; left: 3%;">Front St</div>
        <div class="street-sign" style="top: 81%; left: 89%;">Front St</div>
        <div class="street-sign" style="top: 94%; left: 55%;">Lakeshore Blvd</div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
        <div class="referral-card">
            ${safeImageUrl
              ? `<img src="${safeImageUrl}" alt="${safeName}" class="creator-avatar">`
              : `<div class="avatar-placeholder">${escapeHtml((creator.name || 'B')[0].toUpperCase())}</div>`
            }
            <h1 class="referral-title">${safeName} invited you<br>to BiteMap</h1>
            <p class="referral-subtitle">Discover the best food spots near you</p>

            <div class="download-buttons">
                <a href="${appStoreUrl}" class="store-btn ios-btn" target="_blank" rel="noopener">
                    <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store">
                </a>
                <a href="${playStoreUrl}" class="store-btn android-store-btn" target="_blank" rel="noopener">
                    <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" class="google-play-img">
                </a>
            </div>
        </div>
    </div>

    <footer>
        <div class="company">BiteMap &copy; 2026</div>
        <div class="footer-links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms & Services</a>
            <a href="/support">Support</a>
        </div>
    </footer>

    <script>
        // Mobile menu toggle
        var menuBtn = document.getElementById('menuBtn');
        var mobileMenu = document.getElementById('mobileMenu');
        menuBtn.addEventListener('click', function() {
            menuBtn.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });
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
