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

  /* --------------------------- tiempo real -------------------------- */
  // Escucha cambios en las tablas del usuario y avisa a la app al instante.
  function subscribeRealtime(onEvent, onStatus) {
    if (!sb) return null;
    var ch = sb.channel("magic-db-" + Math.random().toString(36).slice(2));
    ["tricks", "routines", "gigs"].forEach(function (table) {
      ch.on("postgres_changes", { event: "*", schema: "public", table: table }, function (payload) {
        try { onEvent(table, payload.eventType, payload.new, payload.old); } catch (e) {}
      });
    });
    ch.subscribe(function (status) { if (onStatus) onStatus(status); });
    return ch;
  }
  function unsubscribeRealtime(ch) { try { if (ch) sb.removeChannel(ch); } catch (e) {} }

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

  /* ===================== comunidad / mercado ===================== */
  function publicUrl(path) { if (!path) return null; try { return sb.storage.from("social").getPublicUrl(path).data.publicUrl; } catch (e) { return null; } }
  function getMyProfile() {
    return currentUser().then(function (u) {
      if (!u) return null;
      return sb.from("profiles").select("*").eq("user_id", u.id).maybeSingle().then(function (r) { if (r.error) throw r.error; return r.data; });
    });
  }
  function upsertProfile(fields) {
    return currentUser().then(function (u) {
      if (!u) throw new Error("sin sesión");
      var row = Object.assign({ user_id: u.id, updated_at: new Date().toISOString() }, fields);
      return sb.from("profiles").upsert(row, { onConflict: "user_id" }).select().single().then(function (r) { if (r.error) throw r.error; return r.data; });
    });
  }
  function handleOwner(handle) {
    return sb.from("profiles").select("user_id").ilike("handle", handle).maybeSingle()
      .then(function (r) { return r.data ? r.data.user_id : null; }).catch(function () { return null; });
  }
  function uploadSocial(file) {
    return currentUser().then(function (u) {
      if (!u) throw new Error("sin sesión");
      var ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
      var path = u.id + "/" + uid() + "." + ext;
      return sb.storage.from("social").upload(path, file, { contentType: file.type || undefined, upsert: true })
        .then(function (r) { if (r.error) throw r.error; return { path: path, url: publicUrl(path) }; });
    });
  }
  function getFeed(who, mode, tag) { return sb.rpc("get_feed", { lim: 40, who: who || null, mode: mode || "discover", tag: tag || null }).then(function (r) { if (r.error) throw r.error; return r.data || []; }); }
  function bookmark(id) { return currentUser().then(function (u) { return sb.from("bookmarks").insert({ post_id: id, user_id: u.id }).then(function (r) { if (r.error) throw r.error; return true; }); }); }
  function unbookmark(id) { return currentUser().then(function (u) { return sb.from("bookmarks").delete().eq("post_id", id).eq("user_id", u.id).then(function (r) { if (r.error) throw r.error; return true; }); }); }
  function repost(origId, body) { return sb.from("posts").insert({ kind: "post", repost_of: origId, body: body || null, media: [] }).select().single().then(function (r) { if (r.error) throw r.error; return r.data; }); }
  function deleteComment(id) { return sb.from("comments").delete().eq("id", id).then(function (r) { if (r.error) throw r.error; return true; }); }
  function getNotifications() { return sb.rpc("get_notifications", { lim: 40 }).then(function (r) { if (r.error) throw r.error; return r.data || { unread: 0, items: [] }; }); }
  function markNotificationsRead() { return sb.rpc("mark_notifications_read").then(function (r) { if (r.error) throw r.error; return true; }); }
  function searchMagicians(q, spec) { return sb.rpc("search_magicians", { q: q || null, spec: spec || null, lim: 30 }).then(function (r) { if (r.error) throw r.error; return r.data || []; }); }
  function suggestMagicians() { return sb.rpc("suggest_magicians", { lim: 12 }).then(function (r) { if (r.error) throw r.error; return r.data || []; }); }
  function trendingTags() { return sb.rpc("get_trending_tags", { lim: 8 }).then(function (r) { if (r.error) throw r.error; return r.data || []; }); }
  function getFollowList(uid, which) { return sb.rpc("get_follow_list", { uid: uid, which: which, lim: 80 }).then(function (r) { if (r.error) throw r.error; return r.data || []; }); }
  function getComments(pid) { return sb.rpc("get_comments", { pid: pid }).then(function (r) { if (r.error) throw r.error; return r.data || []; }); }
  function getMarket() { return sb.rpc("get_market", { lim: 40 }).then(function (r) { if (r.error) throw r.error; return r.data || []; }); }
  function getProfileInfo(id) { return sb.rpc("get_profile", { uid: id }).then(function (r) { if (r.error) throw r.error; return r.data; }); }
  function createPost(row) { return sb.from("posts").insert(row).select().single().then(function (r) { if (r.error) throw r.error; return r.data; }); }
  function deletePost(id) { return sb.from("posts").delete().eq("id", id).then(function (r) { if (r.error) throw r.error; return true; }); }
  function likePost(id) { return currentUser().then(function (u) { return sb.from("post_likes").insert({ post_id: id, user_id: u.id }).then(function (r) { if (r.error) throw r.error; return true; }); }); }
  function unlikePost(id) { return currentUser().then(function (u) { return sb.from("post_likes").delete().eq("post_id", id).eq("user_id", u.id).then(function (r) { if (r.error) throw r.error; return true; }); }); }
  function addComment(pid, body) { return sb.from("comments").insert({ post_id: pid, body: body }).select().single().then(function (r) { if (r.error) throw r.error; return r.data; }); }
  function follow(id) { return sb.from("follows").insert({ following: id }).then(function (r) { if (r.error) throw r.error; return true; }); }
  function unfollow(id) { return currentUser().then(function (u) { return sb.from("follows").delete().eq("follower", u.id).eq("following", id).then(function (r) { if (r.error) throw r.error; return true; }); }); }
  function createListing(listing, content) {
    return sb.from("listings").insert(listing).select().single().then(function (r) {
      if (r.error) throw r.error; var l = r.data;
      return sb.from("listing_content").insert({ listing_id: l.id, payload: content }).then(function (r2) { if (r2.error) throw r2.error; return l; });
    });
  }
  function claimFree(id) { return sb.rpc("claim_free_listing", { l: id }).then(function (r) { if (r.error) throw r.error; return r.data; }); }
  function getListingContent(id) { return sb.from("listing_content").select("payload").eq("listing_id", id).maybeSingle().then(function (r) { if (r.error) throw r.error; return r.data ? r.data.payload : null; }); }
  function subscribeFeed(onEvent) {
    if (!sb) return null;
    var ch = sb.channel("feed-" + Math.random().toString(36).slice(2));
    ["posts", "comments", "post_likes"].forEach(function (t) {
      ch.on("postgres_changes", { event: "*", schema: "public", table: t }, function (pl) { try { onEvent(t, pl.eventType, pl.new, pl.old); } catch (e) {} });
    });
    ch.subscribe();
    return ch;
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
    getReminderPref: getReminderPref, saveReminderPref: saveReminderPref,
    subscribeRealtime: subscribeRealtime, unsubscribeRealtime: unsubscribeRealtime,
    publicUrl: publicUrl, getMyProfile: getMyProfile, upsertProfile: upsertProfile, handleOwner: handleOwner, uploadSocial: uploadSocial,
    getFeed: getFeed, getComments: getComments, getMarket: getMarket, getProfileInfo: getProfileInfo,
    createPost: createPost, deletePost: deletePost, likePost: likePost, unlikePost: unlikePost, addComment: addComment,
    follow: follow, unfollow: unfollow, createListing: createListing, claimFree: claimFree, getListingContent: getListingContent,
    subscribeFeed: subscribeFeed,
    bookmark: bookmark, unbookmark: unbookmark, repost: repost, deleteComment: deleteComment,
    getNotifications: getNotifications, markNotificationsRead: markNotificationsRead,
    searchMagicians: searchMagicians, suggestMagicians: suggestMagicians, trendingTags: trendingTags, getFollowList: getFollowList
  };
})();
