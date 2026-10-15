// Supabase Edge Function: canteen-cue-ai
// Deploy using: supabase functions deploy canteen-cue-ai
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userQuery, sessionId, preferences } = await req.json();

    // 1. Initialize Supabase client inside Edge Function
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Fetch all available menu items across the 5 campus outlets
    const { data: menuItems, error: menuErr } = await supabase
      .from("menu_items")
      .select("id, shop, name, category, price, dietary, tags, estimated_prep_time, availability")
      .eq("availability", true);

    if (menuErr) {
      throw new Error(`Database error: ${menuErr.message}`);
    }

    // 3. Compact catalog grounding string
    const compactCatalog = (menuItems || [])
      .map((i: any) => `• ${i.name} (${i.shop}) — ₹${i.price} | ${i.dietary} | ~${i.estimated_prep_time}m prep`)
      .join("\n");

    // 4. Retrieve Gemini API Key from Supabase Secrets
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      throw new Error("GEMINI_API_KEY is not set in Supabase Secrets.");
    }

    // 5. Construct Grounded Prompt
    const systemPrompt = `You are CanteenCue, an AI college canteen food decision assistant.
Help students pick food across 5 campus outlets: Anna's Restaurant, Mughlai Affair's, HALKA PHULKA, MAGGIE POINT, and 4TH FLOOR.
Grounding Rule: ONLY recommend items from this catalog:
${compactCatalog}

Respond strictly in JSON matching the DecisionResponse schema.`;

    const userPromptText = preferences && Object.keys(preferences).length > 0
      ? `Preferences: ${JSON.stringify(preferences)}\n\nQuery: ${userQuery}`
      : userQuery;

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`;
    const geminiRes = await fetch(geminiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPromptText }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    });

    const geminiData = await geminiRes.json();
    const rawAiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    const decision = JSON.parse(rawAiText);

    // 6. Persist chat message directly into Supabase table
    if (sessionId) {
      await supabase.from("chat_messages").insert([
        {
          id: `msg_u_${Date.now()}`,
          session_id: sessionId,
          sender: "user",
          text: userQuery,
          timestamp: Date.now(),
        },
        {
          id: `msg_a_${Date.now()}`,
          session_id: sessionId,
          sender: "assistant",
          text: decision.summaryText || "",
          decision: decision,
          timestamp: Date.now(),
        },
      ]);
    }

    return new Response(JSON.stringify({ success: true, decision }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
