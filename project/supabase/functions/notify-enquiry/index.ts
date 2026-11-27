import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "Easy Maths Tutoring <onboarding@resend.dev>";
const NOTIFY_EMAIL = Deno.env.get("NOTIFY_EMAIL") ?? "easymaths.au@gmail.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { enquiry_id } = body;

    if (!enquiry_id) {
      return new Response(JSON.stringify({ error: "Missing enquiry_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: enquiry, error: dbError } = await supabase
      .from("enquiries")
      .select("*")
      .eq("id", enquiry_id)
      .single();

    if (dbError || !enquiry) {
      return new Response(JSON.stringify({ error: "Enquiry not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #0f766e; font-size: 24px; margin-bottom: 24px;">New Tutoring Enquiry</h1>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; font-weight: bold; color: #374151; width: 160px;">Name:</td><td style="padding: 8px 0; color: #111827;">${enquiry.parent_name}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Year Level:</td><td style="padding: 8px 0; color: #111827;">${enquiry.student_year}</td></tr>
          ${enquiry.subject ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Subject:</td><td style="padding: 8px 0; color: #111827;">${enquiry.subject}</td></tr>` : ""}
          <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Preferred Format:</td><td style="padding: 8px 0; color: #111827;">${enquiry.lesson_format}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td><td style="padding: 8px 0; color: #111827;"><a href="mailto:${enquiry.email}" style="color: #0f766e;">${enquiry.email}</a></td></tr>
          ${enquiry.phone ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Phone:</td><td style="padding: 8px 0; color: #111827;">${enquiry.phone}</td></tr>` : ""}
        </table>
        ${enquiry.message ? `<h2 style="color: #374151; font-size: 16px; margin-top: 24px; margin-bottom: 8px;">Message:</h2><p style="color: #111827; line-height: 1.6; white-space: pre-wrap;">${enquiry.message}</p>` : ""}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #6b7280; font-size: 13px;">This enquiry was submitted via your website contact form.</p>
      </div>
    `;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: NOTIFY_EMAIL,
        subject: `New Enquiry: ${enquiry.parent_name} — ${enquiry.student_year}`,
        html: emailHtml,
        reply_to: enquiry.email,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      return new Response(JSON.stringify({ error: "Failed to send email", details: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
