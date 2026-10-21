/**
 * Cloudflare Pages Function: /gemini
 * Secure backend proxy for Google Generative Language (Gemini) API.
 * Keeps the Google AI Studio API key securely on the server side.
 */

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-gemini-api-key",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-gemini-api-key",
    "Content-Type": "application/json",
  };

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: { message: "Invalid JSON request body." },
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Determine API Key: prioritize Cloudflare Pages environment variable,
    // fallback to optional custom key passed by user in header or body
    const customKey =
      request.headers.get("x-gemini-api-key") ||
      body.customApiKey ||
      body.apiKey;

    const apiKey = (env.GEMINI_API_KEY || customKey || "").trim();

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: {
            message:
              "GEMINI_API_KEY environment variable is not configured in Cloudflare Pages dashboard. Please add it under Settings > Environment variables.",
          },
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Default model to gemini-2.5-flash as specified
    const model = (body.model || "gemini-2.5-flash").trim();

    // Construct the Google Generative Language API payload
    let googlePayload;
    if (body.contents) {
      googlePayload = {
        contents: body.contents,
        ...(body.system_instruction && { system_instruction: body.system_instruction }),
        ...(body.generationConfig && { generationConfig: body.generationConfig }),
        ...(body.safetySettings && { safetySettings: body.safetySettings }),
      };
    } else if (body.prompt) {
      googlePayload = {
        contents: [
          {
            parts: [{ text: String(body.prompt) }],
          },
        ],
        ...(body.generationConfig && { generationConfig: body.generationConfig }),
      };
    } else {
      googlePayload = body;
    }

    const googleEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const googleResponse = await fetch(googleEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(googlePayload),
    });

    const responseData = await googleResponse.json().catch(() => ({}));

    return new Response(JSON.stringify(responseData), {
      status: googleResponse.status,
      headers: corsHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: {
          message: err.message || "An unexpected server error occurred in Gemini proxy.",
        },
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
