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
  function listRoutines() {
    return sb.from("routines").select("*").order("updated_at", { ascending: false })
      .then(function (r) { if (r.error) throw r.error; return r.data || []; });
  }
  function upsertRoutine(row) {
    return sb.from("routines").upsert(row).select().single()
      .then(function (r) { if (r.error) throw r.error; return r.data; });
  }
  function deleteRoutine(id) {
    return sb.from("routines").delete().eq("id", id)
      .then(function (r) { if (r.error) throw r.error; return true; });
  }
  function listGigs() {
    return sb.from("gigs").select("*").order("date", { ascending: false })
      .then(function (r) { if (r.error) throw r.error; return r.data || []; });
  }
  function upsertGig(row) {
    return sb.from("gigs").upsert(row).select().single()
      .then(function (r) { if (r.error) throw r.error; return r.data; });
  }
  function deleteGig(id) {
    return sb.from("gigs").delete().eq("id", id)
      .then(function (r) { if (r.error) throw r.error; return true; });
  }

  /* ------------------------------ vídeos ---------------------------- */
  function uid() { return (crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now() + "" + Math.floor(Math.random() * 1e9); }

  // Subida reanudable (TUS) por trozos de 6 MB, con progreso. Aguanta vídeos
  // largos y se reanuda si se corta la conexión.
  function uploadVideo(file, onProgress) {
    return Promise.all([currentUser(), sb.auth.getSession()]).then(function (res) {
      var u = res[0], sess = res[1] && res[1].data && res[1].data.session;
      if (!u || !sess) throw new Error("sin sesión");
      var ext = (file.name.split(".").pop() || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "mp4";
      var objectName = u.id + "/" + uid() + "." + ext;

      // Si no está la librería TUS o el archivo es pequeño, subida simple
      if (!window.tus || file.size < 6 * 1024 * 1024) {
        return sb.storage.from("videos").upload(objectName, file, { contentType: file.type || undefined, upsert: true })
          .then(function (r) { if (r.error) throw r.error; if (onProgress) onProgress(100); return { path: objectName }; });
      }

      return new Promise(function (resolve, reject) {
        var upload = new window.tus.Upload(file, {
          endpoint: URL + "/storage/v1/upload/resumable",
          retryDelays: [0, 3000, 5000, 10000, 20000, 30000],
          headers: { authorization: "Bearer " + sess.access_token, apikey: KEY, "x-upsert": "true" },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          metadata: { bucketName: "videos", objectName: objectName, contentType: file.type || "video/mp4", cacheControl: "3600" },
          chunkSize: 6 * 1024 * 1024,
          onError: function (err) { reject(err); },
          onProgress: function (sent, total) { if (onProgress && total) onProgress(Math.round((sent / total) * 100)); },
          onSuccess: function () { resolve({ path: objectName }); }
        });
        upload.findPreviousUploads().then(function (prev) {
          if (prev && prev.length) upload.resumeFromPreviousUpload(prev[0]);
          upload.start();
        }).catch(function () { upload.start(); });
      });
    });
  }
  function signedUrl(path, bucket) {
    return sb.storage.from(bucket || "videos").createSignedUrl(path, 3600)
      .then(function (r) { return (r.data && r.data.signedUrl) || null; }).catch(function () { return null; });
  }
  function uploadPhoto(file) {
    return currentUser().then(function (u) {
      if (!u) throw new Error("sin sesión");
      var ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
      var path = u.id + "/" + uid() + "." + ext;
      return sb.storage.from("photos").upload(path, file, { contentType: file.type || undefined, upsert: true })
        .then(function (r) { if (r.error) throw r.error; return { path: path }; });
    });
  }
  function removeVideo(path) { return sb.storage.from("videos").remove([path]).catch(function () {}); }

  /* --------------------------- compartir ---------------------------- */
  // Crea un enlace público de solo lectura. Devuelve el token (id).
  function createShare(kind, title, payload) {
    return currentUser().then(function (u) {
      if (!u) throw new Error("sin sesión");
      return sb.from("shares").insert({ owner: u.id, kind: kind, title: title, payload: payload }).select("id").single()
        .then(function (r) { if (r.error) throw r.error; return r.data.id; });
    });
  }
  // Lee un enlace por su token (accesible sin sesión gracias a la función RPC).
  function getShare(id) {
    return sb.rpc("get_share", { share_id: id })
      .then(function (r) { if (r.error) throw r.error; return r.data || null; });
  }
  function listShares() {
    return sb.from("shares").select("id, kind, title, created_at").order("created_at", { ascending: false })
      .then(function (r) { if (r.error) throw r.error; return r.data || []; });
  }
  function deleteShare(id) {
    return sb.from("shares").delete().eq("id", id)
      .then(function (r) { if (r.error) throw r.error; return true; });
  }
  // Firma un vídeo propio con caducidad larga (para incrustarlo en un enlace).
  function signedUrlLong(path, bucket, seconds) {
    return sb.storage.from(bucket || "videos").createSignedUrl(path, seconds || 2592000)
      .then(function (r) { return (r.data && r.data.signedUrl) || null; }).catch(function () { return null; });
  }

  /* ------------------------ notificaciones -------------------------- */
  // Clave pública VAPID (segura de publicar; la privada vive solo en el servidor).
  var VAPID_PUBLIC = "BJc-7eYOjc_72UOdIKE20Q2fj7Xp0K410Kom2tfdnhtCTHrT1475p1O-VPcLwqDlNhMpam_bBFCvU7I3_HCkbYs";
  function pushKey() { return VAPID_PUBLIC; }
  function savePushSub(sub) {
    return sb.from("push_subscriptions").upsert(sub, { onConflict: "endpoint" }).select("id").single()
      .then(function (r) { if (r.error) throw r.error; return r.data; });
  }
  function deletePushSub(endpoint) {
    return sb.from("push_subscriptions").delete().eq("endpoint", endpoint)
      .then(function (r) { if (r.error) throw r.error; return true; });
  }
  function getReminderPref() {
    return sb.from("reminder_prefs").select("hour, tz").maybeSingle()
      .then(function (r) { if (r.error) throw r.error; return r.data || null; }).catch(function () { return null; });
  }
  function saveReminderPref(hour, tz) {
    return currentUser().then(function (u) {
      if (!u) throw new Error("sin sesión");
      return sb.from("reminder_prefs").upsert({ user_id: u.id, hour: hour, tz: tz, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).select("hour").single()
        .then(function (r) { if (r.error) throw r.error; return r.data; });
    });
  }
  // Extracción de contenido didáctico desde una URL (Edge Function)
  function extract(url) {
    return sb.functions.invoke("extract", { body: { url: url } })
      .then(function (r) { return r.error ? null : r.data; }).catch(function () { return null; });
  }

  return {
    available: available, currentUser: currentUser, onChange: onChange,
    signUp: signUp, verifySignup: verifySignup, resend: resend, signIn: signIn, signOut: signOut,
    listTricks: listTricks, upsertTrick: upsertTrick, deleteTrick: deleteTrick,
    listRoutines: listRoutines, upsertRoutine: upsertRoutine, deleteRoutine: deleteRoutine,
    listGigs: listGigs, upsertGig: upsertGig, deleteGig: deleteGig,
    uploadVideo: uploadVideo, uploadPhoto: uploadPhoto, signedUrl: signedUrl, signedUrlLong: signedUrlLong, removeVideo: removeVideo, extract: extract,
    createShare: createShare, getShare: getShare, listShares: listShares, deleteShare: deleteShare,
    pushKey: pushKey, savePushSub: savePushSub, deletePushSub: deletePushSub,
    getReminderPref: getReminderPref, saveReminderPref: saveReminderPref
  };
})();
