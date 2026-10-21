/**
 * Cloudflare Pages Function: /gemini
 * Secure backend proxy for Google Generative Language (Gemini) API.
 * Keeps Google AI Studio API keys securely on the server side.
 * Supports multiple API keys (comma, semicolon, or newline-separated)
 * with automatic load distribution and seamless failover on rate-limits (429/quota).
 */

const ipRateMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 40;

function checkIpRateLimit(ip) {
  if (!ip) return true;
  const now = Date.now();
  const record = ipRateMap.get(ip);
  if (!record || now - record.start > RATE_LIMIT_WINDOW_MS) {
    ipRateMap.set(ip, { start: now, count: 1 });
    return true;
  }
  record.count++;
  return record.count <= MAX_REQUESTS_PER_WINDOW;
}

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

  // 1. Enforce payload size limit (Max 50 KB)
  const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
  if (contentLength > 51200) {
    return new Response(
      JSON.stringify({ error: { message: "Payload Too Large: Maximum request size is 50KB." } }),
      { status: 413, headers: corsHeaders }
    );
  }

  // 2. Server-side Rate Limiting per IP
  const clientIp = request.headers.get("cf-connecting-ip") || "unknown";
  if (!checkIpRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({
        error: {
          message: "Rate limit exceeded. Please wait a moment before sending more requests.",
        },
      }),
      { status: 429, headers: corsHeaders }
    );
  }

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

    // Determine custom key passed by user in header or body
    const customKey =
      request.headers.get("x-gemini-api-key") ||
      body.customApiKey ||
      body.apiKey;

    // Build the pool of available API keys:
    // Supports GEMINI_API_KEY, GEMINI_API_KEYS, GOOGLE_API_KEY, KEY, or KEYS
    // Also gracefully handles values with leading "KEY=", quotes, or whitespace
    const rawKeysString = [
      env.GEMINI_API_KEY,
      env.GEMINI_API_KEYS,
      env.GOOGLE_API_KEY,
      env.KEY,
      env.KEYS,
      customKey,
    ]
      .filter(Boolean)
      .join(",");

    const keyPool = Array.from(
      new Set(
        rawKeysString
          .split(/[,\n;]/)
          .map((k) =>
            k
              .trim()
              .replace(/^(?:key|api_key|gemini_api_key|google_api_key)\s*[:=]\s*/i, "")
              .replace(/^["']|["']$/g, "")
              .trim()
          )
          .filter(Boolean)
      )
    );

    if (keyPool.length === 0) {
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

    // Default model to gemini-3.8-flash (with auto-fallback to gemini-2.5-flash, gemini-flash-latest and gemini-flash-lite-latest)
    let requestedModel = (body.model || "gemini-3.8-flash").trim();
    if (requestedModel === "gemini-2.0-flash" || requestedModel === "gemini-1.5-flash") {
      requestedModel = "gemini-3.8-flash";
    }

    const candidateModels = Array.from(
      new Set([
        requestedModel,
        "gemini-3.8-flash",
        "gemini-2.5-flash",
        "gemini-flash-latest",
        "gemini-flash-lite-latest",
      ])
    );

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

    // Output token safety clamp (Max 600 tokens)
    if (googlePayload.generationConfig) {
      googlePayload.generationConfig.maxOutputTokens = Math.min(
        googlePayload.generationConfig.maxOutputTokens || 600,
        600
      );
    } else {
      googlePayload.generationConfig = { maxOutputTokens: 600 };
    }

    // Distribute initial key selection randomly across the pool to balance load
    const startIndex = Math.floor(Math.random() * keyPool.length);
    const candidateKeys = [
      ...keyPool.slice(startIndex),
      ...keyPool.slice(0, startIndex),
    ];

    let lastResponse = null;
    let lastData = null;
    const MAX_TOTAL_ATTEMPTS = 3;
    let attemptCount = 0;

    for (const apiKey of candidateKeys) {
      if (attemptCount >= MAX_TOTAL_ATTEMPTS) break;

      for (const model of candidateModels) {
        if (attemptCount >= MAX_TOTAL_ATTEMPTS) break;
        attemptCount++;

        const googleEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          model
        )}:generateContent?key=${encodeURIComponent(apiKey)}`;

        try {
          const googleResponse = await fetch(googleEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(googlePayload),
            signal: AbortSignal.timeout(9000),
          });

          const responseData = await googleResponse.json().catch(() => ({}));
          lastResponse = googleResponse;
          lastData = responseData;

          // If request succeeded (200), return immediately
          if (googleResponse.ok) {
            return new Response(JSON.stringify(responseData), {
              status: 200,
              headers: corsHeaders,
            });
          }

          // If rate-limited (429) or quota exceeded, try next key in the pool
          const isQuotaOrRateLimit =
            googleResponse.status === 429 ||
            responseData?.error?.code === 429 ||
            responseData?.error?.status === "RESOURCE_EXHAUSTED" ||
            JSON.stringify(responseData).toLowerCase().includes("quota") ||
            JSON.stringify(responseData).toLowerCase().includes("rate limit");

          if (isQuotaOrRateLimit && candidateKeys.length > 1) {
            console.warn("Gemini key hit quota/rate-limit, failing over to next key in pool");
            break; // Try next key in candidateKeys
          }

          // If model is retired (404) or temporarily congested (503), try next candidate model
          if (googleResponse.status === 404 || googleResponse.status === 503) {
            console.warn(`Model ${model} returned ${googleResponse.status}, failing over to next model`);
            continue;
          }

          // If it's a 400 Bad Request in user prompt, stop
          if (googleResponse.status === 400) {
            break;
          }
        } catch (networkErr) {
          lastData = { error: { message: networkErr.name === "TimeoutError" ? "Upstream AI service timed out." : networkErr.message } };
          continue;
        }
      }
    }

    // Return the last response received if all candidate keys were exhausted
    return new Response(
      JSON.stringify(
        lastData || { error: { message: "All Gemini API keys in pool failed." } }
      ),
      {
        status: lastResponse ? lastResponse.status : 502,
        headers: corsHeaders,
      }
    );
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
