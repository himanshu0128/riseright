const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // Parse the request body
    const { email } = JSON.parse(event.body);

    // Log the request
    console.log("📧 Email submission request:", {
      email: email,
      timestamp: new Date().toISOString(),
      userAgent: event.headers["user-agent"],
      ip: event.headers["x-forwarded-for"] || event.headers["client-ip"],
    });

    // Validate email
    if (!email || !email.includes("@")) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Valid email is required" }),
      };
    }

    const cleanEmail = email.toLowerCase().trim();

    // Insert email into Supabase
    const { data, error } = await supabase.from("riseright_waitlist").insert([
      {
        email: cleanEmail,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      // Handle duplicate email error
      if (error.code === "23505") {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: "Email already registered!",
            duplicate: true,
          }),
        };
      }

      throw error;
    }

    // Send thank you email
    try {
      const emailResult = await resend.emails.send({
        from: "RiseRight <riseright@himanshugupta.dev>",
        to: cleanEmail,
        subject: "Welcome to RiseRight!",
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
              }
              .container { 
                width: 600px; 
                margin: 0 auto; 
                padding: 40px 20px; 
              }
              .card { 
                background-color: white; 
                border-radius: 10px; 
                padding: 40px; 
                text-align: center; 
                margin: 20px 0;
              }
              .logo { 
                width: 80px; 
                height: 80px; 
                margin: 0 auto 20px; 
                border-radius: 50%;
                background-color: #4facfe;
                font-size: 32px;
                text-align: center;
                line-height: 80px;
              }
              h1 { 
                color: #1a1a2e; 
                font-size: 28px; 
                margin-bottom: 20px; 
                font-weight: bold;
              }
              p { 
                color: #666; 
                line-height: 1.6; 
                margin-bottom: 20px; 
                font-size: 16px;
              }
              .cta { 
                background-color: #4facfe; 
                color: white !important; 
                padding: 15px 30px; 
                border-radius: 10px; 
                text-decoration: none !important; 
                display: inline-block; 
                margin-top: 20px;
                font-weight: bold;
                border: none;
              }
              a.cta {
                color: white !important;
                text-decoration: none !important;
              }
              a.cta:link {
                color: white !important;
                text-decoration: none !important;
              }
              a.cta:visited {
                color: white !important;
                text-decoration: none !important;
              }
              a.cta:hover {
                color: white !important;
                text-decoration: none !important;
              }
              .footer {
                text-align: center;
                color: #999;
                font-size: 14px;
                margin-top: 30px;
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
                <ul style="text-align: left; color: #666; line-height: 1.8;">
                  <li>Weekly progress updates on RiseRight development</li>
                  <li>Sleep optimization tips and insights</li>
                  <li>Early access when we launch</li>
                  <li>Exclusive beta testing opportunities</li>
                </ul>
                <a href="https://riseright.netlify.app" class="cta">Learn More About RiseRight</a>
                <div class="footer">
                  <p>You're receiving this because you signed up for RiseRight updates.</p>
                  <p>If you didn't sign up, you can safely ignore this email.</p>
              </div>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (emailResult.error) {
        console.error("❌ Email sending failed:", {
          error: emailResult.error,
          email: cleanEmail,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.log("✅ Thank you email sent successfully:", {
          email: cleanEmail,
          messageId: emailResult.data?.id,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (emailError) {
      console.error("❌ Email sending failed with exception:", {
        error: emailError.message,
        email: cleanEmail,
        timestamp: new Date().toISOString(),
      });
      // Don't fail the whole request if email fails
    }

    console.log("✅ Email saved to database:", {
      email: cleanEmail,
      timestamp: new Date().toISOString(),
      success: true,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Successfully added to waitlist!",
        email: cleanEmail,
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
