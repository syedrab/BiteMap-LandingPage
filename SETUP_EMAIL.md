# Email Setup Instructions

## Setting up SMTP in Vercel

1. **Go to your Vercel Dashboard**
   - Visit: https://vercel.com/mohib-rs-projects/bitemap-landing
   - Click on "Settings" tab
   - Go to "Environment Variables"

2. **Add these environment variables:**

   | Key | Value |
   |-----|-------|
   | `SMTP_HOST` | `smtp-mail.outlook.com` |
   | `SMTP_PORT` | `587` |
   | `SMTP_USER` | `mohib.rab@bitemap.fun` |
   | `SMTP_PASS` | Your Microsoft 365 password (see below) |
   | `EMAIL_TO` | `mohib.rab@bitemap.fun` |

3. **Getting your SMTP password:**

   Since you have Microsoft 365 with bitemap.fun domain:

   **Option A: Use your regular Microsoft 365 password**
   - This is the password you use to login to outlook.com with mohib.rab@bitemap.fun

   **Option B: Create an App Password (more secure)**
   1. Go to https://account.microsoft.com/security
   2. Sign in with mohib.rab@bitemap.fun
   3. Click "Advanced security options"
   4. Under "App passwords", click "Create a new app password"
   5. Use this generated password for `SMTP_PASS`

4. **After adding all variables:**
   - Click "Save"
   - Your next deployment will use these variables

## Testing

After setting up and deploying:
1. Go to https://bitemap.fun
2. Enter an email address
3. Submit the form
4. You should receive:
   - A welcome email at the subscriber's address
   - A notification at mohib.rab@bitemap.fun

## Troubleshooting

If emails aren't sending:

1. **Check Vercel Function Logs:**
   ```bash
   vercel logs bitemap-landing --output json
   ```

2. **Common Issues:**
   - Wrong password: Double-check your Microsoft 365 password
   - 2FA enabled: You must use an App Password, not your regular password
   - Account locked: Too many failed attempts - wait or reset password

3. **Test locally first:**
   Create a `.env.local` file:
   ```
   SMTP_HOST=smtp-mail.outlook.com
   SMTP_PORT=587
   SMTP_USER=mohib.rab@bitemap.fun
   SMTP_PASS=your_password_here
   EMAIL_TO=mohib.rab@bitemap.fun
   ```
   Then run: `vercel dev`

## Alternative: Use a Service

If SMTP issues persist, consider:
- **SendGrid**: 100 emails/day free
- **Mailgun**: 5,000 emails/month free
- **Resend**: 100 emails/day free

These services are more reliable than direct SMTP and easier to set up.