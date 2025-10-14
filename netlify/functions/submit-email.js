const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    const { email } = JSON.parse(event.body);

    // Validate email
    if (!email || !email.includes('@')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Valid email is required' })
      };
    }

    const cleanEmail = email.toLowerCase().trim();

    // Insert email into Supabase
    const { data, error } = await supabase
      .from('riseright_waitlist')
      .insert([
        { 
          email: cleanEmail,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      // Handle duplicate email error
      if (error.code === '23505') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            message: 'Email already registered!',
            duplicate: true
          })
        };
      }
      
      throw error;
    }

    // Send thank you email
    try {
      const emailResult = await resend.emails.send({
        from: 'RiseRight <riseright@himanshugupta.dev>', // Update with your domain
        to: cleanEmail,
        subject: 'Welcome to RiseRight!',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to RiseRight</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                background-color: #0f0f23;
                margin: 0;
                padding: 0;
                min-height: 100vh;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 20px; 
              }
              .card { 
                background-color: #1a1a2e;
                border: 1px solid #2d2d44;
                border-radius: 10px; 
                padding: 30px; 
                text-align: center; 
                margin: 20px 0;
              }
              h1 { 
                color: #ffffff; 
                font-size: 24px; 
                margin-bottom: 20px; 
                font-weight: bold;
              }
              p { 
                color: #f1f5f9; 
                line-height: 1.5; 
                margin-bottom: 15px; 
                font-size: 16px;
              }
              .cta { 
                background-color: #4facfe;
                color: white; 
                padding: 12px 24px; 
                border-radius: 5px; 
                text-decoration: none; 
                display: inline-block; 
                margin-top: 20px;
                font-weight: bold;
              }
              .footer {
                text-align: center;
                color: #e2e8f0;
                font-size: 12px;
                margin-top: 30px;
              }
              ul {
                text-align: left;
                color: #f1f5f9;
                line-height: 1.6;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <h1>Welcome to RiseRight!</h1>
                <p>Thank you for joining our waitlist! You're now part of an exclusive group that will be the first to experience the future of smart sleep.</p>
                <p>We'll keep you updated on our progress and send you weekly insights about sleep optimization and our development journey.</p>
                <p><strong>What to expect:</strong></p>
                <ul>
                  <li>Weekly progress updates on RiseRight development</li>
                  <li>Sleep optimization tips and insights</li>
                  <li>Early access when we launch</li>
                  <li>Exclusive beta testing opportunities</li>
                </ul>
                <a href="https://riseright.com" class="cta">Learn More About RiseRight</a>
              </div>
              <div class="footer">
                <p>You're receiving this because you signed up for RiseRight updates.</p>
                <p>If you didn't sign up, you can safely ignore this email.</p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      console.log('Thank you email sent:', emailResult);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the whole request if email fails
    }

    console.log('Email saved to database:', cleanEmail);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Successfully added to waitlist!',
        email: cleanEmail
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
