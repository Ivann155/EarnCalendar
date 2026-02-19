// Supabase configuration (single source of truth)
// Do not hardcode keys inside HTML.

(function () {
  const SUPABASE_URL = "https://zbusogniujonxdnnqjcx.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpidXNvZ25pdWpvbnhkbm5xamN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMjQ5NTIsImV4cCI6MjA4NjkwMDk1Mn0.R6yCFah5s3u6WEVwQkU_AtrcCnZgA0fhTVhYD550ysU";

  window.APP_CONFIG = {
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
    // For OAuth (Google), file:// redirects cannot work. Use Live Server (http://localhost).
    oauthRedirectTo:
      window.location.protocol === "file:"
        ? null
        : `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, "")}/dashboard.html`,
  };

  if (!window.supabase) {
    console.error(
      "Supabase library not loaded. Ensure the CDN script is included before config.js."
    );
    return;
  }

  // Creates a singleton client; Supabase handles session persistence internally.
  window.supabaseClient = window.supabase.createClient(
    window.APP_CONFIG.supabaseUrl,
    window.APP_CONFIG.supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
})();

