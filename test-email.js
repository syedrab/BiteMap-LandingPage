import nodemailer from 'nodemailer';

// Test email configuration
const testEmail = async () => {
  console.log('Testing email configuration...\n');

  const config = {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: 'mohib.rab@bitemap.fun',
      pass: 'YOUR_PASSWORD_HERE' // Replace with your actual password
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    },
    debug: true,
    logger: true
  };

  console.log('Config (without password):', { ...config, auth: { ...config.auth, pass: '***' } });

  try {
    // Create transporter
    const transporter = nodemailer.createTransporter(config);

    // Verify connection
    console.log('\nVerifying connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Send test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: 'mohib.rab@bitemap.fun',
      to: 'mohib.rab@bitemap.fun',
      subject: 'Test Email from BiteMap',
      text: 'If you receive this, SMTP is working!',
      html: '<h1>Success!</h1><p>Your SMTP configuration is working correctly.</p>'
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.message.includes('auth')) {
      console.log('\n🔐 Authentication issue. Try these solutions:');
      console.log('1. Use an App Password instead of your regular password:');
      console.log('   - Go to https://account.microsoft.com/security');
      console.log('   - Sign in with mohib.rab@bitemap.fun');
      console.log('   - Create an app password');
      console.log('2. Check if 2FA is enabled (requires app password)');
      console.log('3. Ensure "SMTP AUTH" is enabled for your account');
    }

    if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
      console.log('\n🌐 Connection issue. Try:');
      console.log('1. Check if outbound SMTP (port 587) is blocked');
      console.log('2. Try port 25 instead of 587');
      console.log('3. Check firewall settings');
    }
  }
};

testEmail();