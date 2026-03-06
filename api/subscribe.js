export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, source } = req.body;

  // Validate email
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  try {
    // Dynamic import for Vercel
    const nodemailer = await import('nodemailer');

    // Check if SMTP credentials are configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('SMTP not configured. Signup attempted:', email);
      return res.status(500).json({
        success: false,
        message: 'Email service not configured.',
        error: 'SMTP credentials missing'
      });
    }

    // Create transporter
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST || 'smtp-mail.outlook.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: true
      }
    });

    // Email options for notification to admin
    const adminMailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.EMAIL_TO || process.env.SMTP_USER,
      subject: source === 'android-beta' ? '🤖 New Android Beta Signup!' : '🎉 New BiteMap Subscriber!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF006E;">${source === 'android-beta' ? 'Android Beta Signup!' : 'New Subscriber Alert!'}</h2>
          <p>You have a new ${source === 'android-beta' ? 'Android beta signup' : 'subscriber'} for BiteMap:</p>
          <p style="font-size: 18px; font-weight: bold; color: #333;">${email}</p>
          <p style="color: #666;">Source: ${source || 'website'}</p>
          <p style="color: #666;">Time: ${new Date().toLocaleString()}</p>
          <hr style="border: 1px solid #eee;">
          <p style="font-size: 12px; color: #999;">
            This email was sent from your BiteMap landing page at bitemap.fun
          </p>
        </div>
      `
    };

    // Email options for welcome message to subscriber
    const subscriberMailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: '🍔 Welcome to BiteMap!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FF006E 0%, #FB5607 50%, #FFBE0B 100%); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to BiteMap! 🎉</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">
              Hey food lover! 👋
            </p>
            <p style="font-size: 16px; color: #333;">
              Thanks for signing up! You're now on the list to be among the first to try BiteMap on Android.
            </p>
            <p style="font-size: 16px; color: #333;">
              In the meantime, BiteMap is live on iOS! Check it out:
            </p>
            <ul style="font-size: 16px; color: #333;">
              <li>🎥 TikTok-style video reviews from real food lovers</li>
              <li>📍 Interactive maps to find the best spots near you</li>
              <li>🍕 Authentic reviews from trusted creators</li>
              <li>🚀 Direct ordering integration with your favorite platforms</li>
            </ul>
            <p style="font-size: 16px; color: #333;">
              We'll notify you as soon as BiteMap launches on Android!
            </p>
            <p style="font-size: 16px; color: #333;">
              Stay hungry,<br>
              The BiteMap Team
            </p>
          </div>
          <div style="background: #f5f5f5; padding: 20px; text-align: center;">
            <p style="font-size: 12px; color: #999; margin: 0;">
              © 2026 BiteMap | <a href="https://bitemap.fun" style="color: #FF006E;">bitemap.fun</a>
            </p>
          </div>
        </div>
      `
    };

    // Send both emails
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(subscriberMailOptions)
    ]);

    console.log('Emails sent successfully to:', email);

    return res.status(200).json({
      success: true,
      message: 'Thanks for subscribing! Check your email for confirmation.'
    });

  } catch (error) {
    console.error('Email error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.',
      error: error.message
    });
  }
}