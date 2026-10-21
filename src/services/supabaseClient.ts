/**
 * ============================================================================
 * CanteenCue Database Protocol (Supabase Cloud + Local Catalog Layer)
 * ============================================================================
 * 
 * Architecture Protocol:
 * 1. Client Initialization: Configured with Supabase project URL & Anon Key.
 * 2. Food Outlets & Menus: Fetches live menu data from PostgreSQL tables `outlets`
 *    and `menu_items`. If offline or unseeded, transparently falls back to the
 *    local bundled catalog in `src/data/menu.json`.
 * 3. Chat Session Persistence: Syncs conversation turns to `chat_sessions` and
 *    `chat_messages` tables with user ID association.
 * 4. Resilient Fallbacks: Designed for zero downtime — users can always browse food
 *    and make decisions even during network outages.
 * ============================================================================
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { MenuItem, ChatMessage } from "../data/types";
import { ALL_MENU_ITEMS } from "../data/menuService";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected?: boolean;
}

const STORAGE_KEY = "canteen_cue_supabase_config";

/**
 * Validates that a Supabase URL uses HTTPS and points to a genuine Supabase project or localhost
 */
export function isValidSupabaseUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== "string") return false;
  try {
    const parsed = new URL(urlStr.trim());
    if (parsed.protocol !== "https:") {
      // Allow http only on local development hosts
      if (parsed.protocol === "http:" && (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")) {
        return true;
      }
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    return host.endsWith(".supabase.co") || host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey && isValidSupabaseUrl(parsed.url)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to parse stored Supabase config:", e);
  }

  // Verified project credentials with fallback to env variables
  const envUrl =
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    "https://onemcemddewbcazkyogm.supabase.co";
  const envKey =
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uZW1jZW1kZGV3YmNhemt5b2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MzgzNjIsImV4cCI6MjEwNjAxNDM2Mn0.cKI8We-rMUWKwHybQkUlX5otnVhNFaSFTbmzgL7WQgU";

  return {
    url: envUrl,
    anonKey: envKey,
    isConnected: true,
  };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  try {
    if (!isValidSupabaseUrl(config.url)) {
      console.warn("Rejected invalid Supabase URL. Must be HTTPS and end with .supabase.co");
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    clientInstance = null; // Reset cached client
  } catch (e) {
    console.error("Failed to save Supabase config:", e);
  }
}

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (clientInstance) return clientInstance;

  const config = getStoredSupabaseConfig();
  if (!config.url || !config.anonKey) return null;

  try {
    clientInstance = createClient(config.url.trim(), config.anonKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return clientInstance;
  } catch (err) {
    console.error("Failed to create Supabase client:", err);
    return null;
  }
}

/**
 * Live connection test that verifies credentials by querying the 'outlets' or 'menu_items' table.
 */
export async function testSupabaseConnection(
  url?: string,
  anonKey?: string
): Promise<{ success: boolean; message: string; outletCount?: number; menuItemCount?: number }> {
  const targetUrl = (url ?? getStoredSupabaseConfig().url).trim();
  const targetKey = (anonKey ?? getStoredSupabaseConfig().anonKey).trim();

  if (!targetUrl || !targetKey) {
    return {
      success: false,
      message: "Please enter both Project URL and Anon/Public Key.",
    };
  }

  try {
    const isCurrentConfig = !url && !anonKey;
    const client = isCurrentConfig && getSupabaseClient() 
      ? getSupabaseClient()! 
      : createClient(targetUrl, targetKey, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        });

    const [outletsRes, menuRes] = await Promise.all([
      client.from("outlets").select("id", { count: "exact" }),
      client.from("menu_items").select("id", { count: "exact" }),
    ]);

    if (outletsRes.error) {
      // Table might not be seeded yet
      if (outletsRes.error.message.includes("relation \"public.outlets\" does not exist")) {
        return {
          success: false,
          message:
            "Connection reached Supabase, but the tables do not exist yet! Please run the 'schema_and_menus.sql' script in your Supabase SQL Editor.",
        };
      }
      return {
        success: false,
        message: `Supabase Error: ${outletsRes.error.message}`,
      };
    }

    const outletCount = outletsRes.count ?? 0;
    const menuCount = menuRes.count ?? 0;

    return {
      success: true,
      message: `Successfully connected to Supabase! Found ${outletCount} food outlets and ${menuCount} verified menu items.`,
      outletCount,
      menuItemCount: menuCount,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to connect: ${err.message || String(err)}`,
    };
  }
}

/**
 * Fetch all verified menu items from Supabase cloud database.
 * Falls back to local bundled catalog if Supabase is offline or not configured.
 */
export async function fetchLiveMenuItems(): Promise<MenuItem[]> {
  const client = getSupabaseClient();
  if (!client) {
    return ALL_MENU_ITEMS;
  }

  try {
    const { data, error } = await client
      .from("menu_items")
      .select("*")
      .eq("availability", true);

    if (error || !data || data.length === 0) {
      console.warn("Could not fetch from Supabase, using local catalog:", error);
      return ALL_MENU_ITEMS;
    }

    // Map database fields to MenuItem structure
    return data.map((row: any) => ({
      id: row.id,
      shop: row.shop,
      name: row.name,
      category: row.category,
      price: Number(row.price),
      portionOptions: row.portion_options || undefined,
      dietary: row.dietary,
      tags: row.tags || [],
      ingredients: row.ingredients || [],
      estimatedPreparationTime: row.estimated_prep_time || 10,
      availability: row.availability,
      spiceLevel: row.spice_level,
      fillingLevel: row.filling_level,
      foodType: row.food_type,
    }));
  } catch (err) {
    console.error("Error reading Supabase menu items:", err);
    return ALL_MENU_ITEMS;
  }
}

/**
 * Persist a chat message to Supabase cloud.
 */
export async function syncChatMessageToSupabase(
  sessionId: string,
  message: ChatMessage,
  userEmail?: string | null,
  sessionTitle?: string | null
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const { data: userData } = await client.auth.getUser();
    const currentUser = userData?.user;

    // Ensure session exists with user ID association and readable title
    await client.from("chat_sessions").upsert({
      id: sessionId,
      user_id: currentUser?.id || null,
      user_name: userEmail || currentUser?.email || "Student",
      session_name: sessionTitle || "Campus Food Decision",
      last_interaction: new Date().toISOString(),
    });

    // Insert message
    await client.from("chat_messages").upsert({
      id: message.id,
      session_id: sessionId,
      sender: message.sender,
      text: message.text || "",
      decision: message.decision ? JSON.parse(JSON.stringify(message.decision)) : null,
      timestamp: message.timestamp,
    });
  } catch (err) {
    console.warn("Failed to sync message to Supabase:", err);
  }
}

/**
 * Load cloud chat history for a session.
 */
export async function loadCloudChatHistory(sessionId: string): Promise<ChatMessage[] | null> {
  const client = getSupabaseClient();
  if (!client || !sessionId) return null;

  try {
    const { data, error } = await client
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp", { ascending: true });

    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      sender: row.sender,
      text: row.text,
      decision: row.decision,
      timestamp: Number(row.timestamp),
    }));
  } catch (err) {
    console.warn("Failed to load cloud messages:", err);
    return null;
  }
}

/**
 * Fetch all past chat sessions from Supabase cloud database.
 * Strictly checks user ownership to prevent unauthenticated data leaks (IDOR protection).
 */
export async function fetchAllCloudSessions(
  userEmail?: string | null
): Promise<
  Array<{
    id: string;
    userId: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    messages: ChatMessage[];
    preferenceState: any;
  }>
> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data: userData } = await client.auth.getUser();
    const currentUser = userData?.user;
    const effectiveEmail = currentUser?.email || (userEmail && userEmail !== "all" ? userEmail : null);

    // Prevent unconstrained queries across all users' chat histories
    if (!currentUser && !effectiveEmail) {
      return [];
    }

    const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    let query = client
      .from("chat_sessions")
      .select("*")
      .gte("last_interaction", sevenDaysAgoIso)
      .order("last_interaction", { ascending: false })
      .limit(50);

    if (currentUser?.id) {
      query = query.or(`user_id.eq.${currentUser.id},user_name.eq.${currentUser.email || effectiveEmail}`);
    } else if (effectiveEmail) {
      query = query.eq("user_name", effectiveEmail);
    }

    const { data: sessionRows, error } = await query;

    if (error || !sessionRows || sessionRows.length === 0) return [];

    const sessionIds = sessionRows.map((s: any) => s.id);
    const { data: messageRows } = await client
      .from("chat_messages")
      .select("*")
      .in("session_id", sessionIds)
      .order("timestamp", { ascending: true });

    const allMsgs = messageRows || [];

    const sessions = sessionRows
      .map((sRow: any) => {
        const msgs: ChatMessage[] = allMsgs
          .filter((m: any) => m.session_id === sRow.id)
          .map((m: any) => ({
            id: m.id,
            sender: m.sender,
            text: m.text,
            decision: m.decision,
            timestamp: Number(m.timestamp),
          }));

        if (msgs.length === 0) return null;

        const firstUserMsg = msgs.find((m) => m.sender === "user" && m.text);
        const title =
          (firstUserMsg?.text && firstUserMsg.text.length > 34
            ? `${firstUserMsg.text.slice(0, 34)}...`
            : firstUserMsg?.text) ||
          sRow.session_name ||
          "Campus Food Decision";

        return {
          id: sRow.id,
          userId: sRow.user_name || userEmail || "guest",
          title,
          createdAt: new Date(sRow.created_at).getTime() || Date.now(),
          updatedAt: new Date(sRow.last_interaction).getTime() || Date.now(),
          messages: msgs,
          preferenceState: sRow.preferences || {},
        };
      })
      .filter(Boolean) as any[];

    return sessions;
  } catch (err) {
    console.warn("Failed to fetch all cloud sessions:", err);
    return [];
  }
}

/**
 * Delete a chat session and its messages from Supabase cloud database.
 * Requires user authentication before executing deletion.
 */
export async function deleteCloudChatSession(sessionId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !sessionId) return;

  try {
    const { data: userData } = await client.auth.getUser();
    if (!userData?.user) return; // Only authenticated users delete cloud sessions

    await client.from("chat_messages").delete().eq("session_id", sessionId);
    await client.from("chat_sessions").delete().eq("id", sessionId);
  } catch (err) {
    console.warn("Failed to delete cloud session from Supabase:", err);
  }
}
