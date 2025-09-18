// Vercel Serverless Function for email collection
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  // For now, just log the email
  // In production, you'd save to database (Supabase, MongoDB, etc.)
  console.log('New subscriber:', email);

  // You could add these emails to:
  // 1. Supabase database
  // 2. Mailchimp/SendGrid list
  // 3. Google Sheets via API
  // 4. Any email service provider

  return res.status(200).json({
    success: true,
    message: 'Thanks for subscribing! We\'ll notify you when we launch.'
  });
}