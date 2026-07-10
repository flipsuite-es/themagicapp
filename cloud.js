/* ==========================================================================
   Capa de nube (Supabase) — proyecto aislado "themagicapp".
   Auth (email + contraseña + código de confirmación), sincronización de la
   biblioteca y subida de vídeos a un bucket privado. La clave publishable es
   pública por diseño: la seguridad la da el RLS del proyecto.
   ========================================================================== */
window.Cloud = (function () {
  "use strict";
  var URL = "https://dculvupbfsjqunilkjyp.supabase.co";
  var KEY = "sb_publishable_qHuttKEqb16rFw8m9cW3_w_j_GutgZ_";

  var sb = null;
  try {
    if (window.supabase && window.supabase.createClient) {
      sb = window.supabase.createClient(URL, KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
      });
    }
  } catch (e) { sb = null; }

  function available() { return !!sb; }

  /* ------------------------------ auth ------------------------------ */
  function currentUser() {
    if (!sb) return Promise.resolve(null);
    return sb.auth.getSession().then(function (r) {
      var s = r && r.data && r.data.session;
      return s ? s.user : null;
    }).catch(function () { return null; });
  }
  function onChange(cb) { if (sb) sb.auth.onAuthStateChange(function (_e, s) { cb(s ? s.user : null); }); }
  function signUp(email, password) { return sb.auth.signUp({ email: email, password: password }); }
  function verifySignup(email, token) { return sb.auth.verifyOtp({ email: email, token: token, type: "signup" }); }
  function resend(email) { return sb.auth.resend({ type: "signup", email: email }); }
  function signIn(email, password) { return sb.auth.signInWithPassword({ email: email, password: password }); }
  function signOut() { return sb.auth.signOut(); }

  /* ------------------------------ datos ----------------------------- */
  function listTricks() {
    return sb.from("tricks").select("*").order("updated_at", { ascending: false })
      .then(function (r) { if (r.error) throw r.error; return r.data || []; });
  }
  function upsertTrick(row) {
    return sb.from("tricks").upsert(row).select().single()
      .then(function (r) { if (r.error) throw r.error; return r.data; });
  }
  function deleteTrick(id) {
    return sb.from("tricks").delete().eq("id", id)
      .then(function (r) { if (r.error) throw r.error; return true; });
  }

  /* ------------------------------ vídeos ---------------------------- */
  function uploadVideo(file) {
    return currentUser().then(function (u) {
      if (!u) throw new Error("sin sesión");
      var ext = (file.name.split(".").pop() || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "");
      var path = u.id + "/" + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "" + Math.random()) + "." + ext;
      return sb.storage.from("videos").upload(path, file, { contentType: file.type || undefined, upsert: false })
        .then(function (r) { if (r.error) throw r.error; return { path: path }; });
    });
  }
  function signedUrl(path) {
    return sb.storage.from("videos").createSignedUrl(path, 3600)
      .then(function (r) { return (r.data && r.data.signedUrl) || null; }).catch(function () { return null; });
  }
  function removeVideo(path) { return sb.storage.from("videos").remove([path]).catch(function () {}); }

  return {
    available: available, currentUser: currentUser, onChange: onChange,
    signUp: signUp, verifySignup: verifySignup, resend: resend, signIn: signIn, signOut: signOut,
    listTricks: listTricks, upsertTrick: upsertTrick, deleteTrick: deleteTrick,
    uploadVideo: uploadVideo, signedUrl: signedUrl, removeVideo: removeVideo
  };
})();
