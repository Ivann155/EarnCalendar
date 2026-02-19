// Authentication helpers (Supabase Auth)
// Exposes window.Auth with production-safe defaults for this simple static site.

(function () {
  if (!window.supabaseClient) {
    console.error("supabaseClient missing. Ensure config.js is loaded first.");
    return;
  }

  const client = window.supabaseClient;

  function assertEmail(email) {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      const err = new Error("Please enter a valid email address.");
      err.code = "invalid_email";
      throw err;
    }
  }

  async function getSession() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session || null;
  }

  async function requireSessionOrRedirect() {
    const session = await getSession();
    if (!session) {
      window.location.replace("./login.html");
      return null;
    }
    return session;
  }

  async function signUpWithEmail(email, password) {
    assertEmail(email);
    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    const { data, error } = await client.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async function signInWithEmail(email, password) {
    assertEmail(email);
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async function signInWithGoogle() {
    const redirectTo = window.APP_CONFIG?.oauthRedirectTo || undefined;

    const { data, error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: redirectTo ? { redirectTo } : undefined,
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }

  function onAuthStateChange(cb) {
    return client.auth.onAuthStateChange((_event, session) => cb(session || null));
  }

  window.Auth = {
    client,
    getSession,
    requireSessionOrRedirect,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    onAuthStateChange,
  };
})();

