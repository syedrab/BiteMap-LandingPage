export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, subject, message } = req.body;

  // Validate inputs
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  if (!subject || subject.trim().length === 0) {
    return res.status(400).json({ error: 'Subject is required' });
  }

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Dynamic import for Vercel
    const nodemailer = await import('nodemailer');

    // Check if SMTP credentials are configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('SMTP not configured. Contact form submission:', {
        email,
        subject,
        message,
        time: new Date().toISOString()
      });

      // Still return success to user, but log that SMTP isn't configured
      return res.status(200).json({
        success: true,
        message: 'Thanks for contacting us! We\'ll get back to you soon.',
        debug: 'Message logged but not sent (SMTP not configured)'
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
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    });

    // Email to admin with contact form details
    const adminMailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.EMAIL_TO || 'support@bitemap.fun',
      replyTo: email,
      subject: `📧 BiteMap Support: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FF006E 0%, #FB5607 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">New Support Message</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0; color: #666; font-size: 12px;">FROM</p>
              <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; color: #333;">${email}</p>
            </div>
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0; color: #666; font-size: 12px;">SUBJECT</p>
              <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; color: #333;">${subject}</p>
            </div>
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <p style="margin: 0; color: #666; font-size: 12px;">MESSAGE</p>
              <p style="margin: 15px 0 0 0; font-size: 14px; color: #333; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
          <div style="padding: 20px; background: #f0f0f0; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 12px;">
              Received: ${new Date().toLocaleString()}
            </p>
            <p style="margin: 10px 0 0 0; color: #999; font-size: 11px;">
              Reply directly to this email to respond to ${email}
            </p>
          </div>
        </div>
      `
    };

    // Auto-reply to user
    const userMailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: '✅ We received your message - BiteMap Support',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FF006E 0%, #FB5607 50%, #FFBE0B 100%); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">Thanks for Reaching Out! 🍔</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">
              Hi there! 👋
            </p>
            <p style="font-size: 16px; color: #333;">
              We've received your message and our team will get back to you within 24-48 hours during business days (Monday-Friday, 9am-5pm EST).
            </p>
            <div style="background: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #666; font-size: 12px;">YOUR MESSAGE</p>
              <p style="margin: 10px 0 5px 0; font-weight: bold; color: #333;">${subject}</p>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 14px; white-space: pre-wrap;">${message}</p>
            </div>
            <p style="font-size: 16px; color: #333;">
              In the meantime, you can:
            </p>
            <ul style="font-size: 14px; color: #333;">
              <li>Check out our <a href="https://bitemap.app/support.html" style="color: #FF006E;">FAQ section</a></li>
              <li>Read our <a href="https://bitemap.app/blog/" style="color: #FF006E;">blog</a> for updates</li>
              <li>Follow us on social media for the latest news</li>
            </ul>
            <p style="font-size: 16px; color: #333;">
              Best,<br>
              The BiteMap Team
            </p>
          </div>
          <div style="background: #f5f5f5; padding: 20px; text-align: center;">
            <p style="font-size: 12px; color: #999; margin: 0;">
              © 2024 BiteMap | <a href="https://bitemap.app" style="color: #FF006E;">bitemap.app</a>
            </p>
          </div>
        </div>
      `
    };

    // Send both emails
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(userMailOptions)
    ]);

    console.log('Contact form emails sent successfully from:', email);

    return res.status(200).json({
      success: true,
      message: 'Message sent! We\'ll get back to you soon.'
    });

  } catch (error) {
    console.error('Contact form email error:', error);

    // Log the submission even if email fails
    console.log('Contact form submission (failed to send):', {
      email,
      subject,
      message,
      time: new Date().toISOString(),
      error: error.message
    });

    return res.status(200).json({
      success: true,
      message: 'Thanks for contacting us! We\'ll get back to you soon.',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
