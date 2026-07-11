export const STUB = `
window.__created = null; window.__posted = null;
(function(){
  var L1 = { id:'l1', title:'Control Fantasma', description:'Un control invisible.', price:900, currency:'eur', cover:null, sales:4, status:'active', item_type:'digital', discipline:'cartomagia', stock:null, ship_cost:0, ships_from:null, condition:null, seller:'u2', handle:'merlin', name:'Merlín', avatar:null, owned:false, wished:false, rating:4.8, reviews:12 };
  var L2 = { id:'l2', title:'Baraja marcada artesanal', description:'Hecha a mano, tirada limitada.', price:2500, currency:'eur', cover:null, sales:1, status:'active', item_type:'physical', discipline:'cartomagia', stock:3, ship_cost:450, ships_from:'España', condition:'nuevo', seller:'u2', handle:'merlin', name:'Merlín', avatar:null, owned:false, wished:false, rating:0, reviews:0 };
  var L3 = { id:'l3', title:'Gimmick moneda plegable', description:'Usado en 50 bolos.', price:1800, currency:'eur', cover:null, sales:7, status:'active', item_type:'physical', discipline:'monedas', stock:0, ship_cost:0, ships_from:'México', condition:'usado', seller:'u2', handle:'merlin', name:'Merlín', avatar:null, owned:false, wished:false, rating:5, reviews:2 };
  var ALL = { l1:L1, l2:L2, l3:L3 };
  var base = {
    available: function(){ return true; },
    currentUser: function(){ return Promise.resolve({ id:'u1', email:'yo@test.es' }); },
    onChange: function(){},
    getMyProfile: function(){ return Promise.resolve({ user_id:'u1', handle:'yo', display_name:'Yo', social_enabled:true, onboarded:true, avatar_path:null }); },
    publicUrl: function(p){ return p; },
    pingStreak: function(){ return Promise.resolve(5); },
    getMarket: function(){ return Promise.resolve([L1, L2, L3]); },
    getListing: function(id){ return Promise.resolve(ALL[id] || null); },
    getReviews: function(){ return Promise.resolve([]); },
    getFeed: function(){ return Promise.resolve([]); },
    trendingTags: function(){ return Promise.resolve([]); },
    getStories: function(){ return Promise.resolve([]); },
    getLeaderboard: function(){ return Promise.resolve([]); },
    getActiveChallenge: function(){ return Promise.resolve(null); },
    getWeekRecap: function(){ return Promise.resolve(null); },
    notifCount: function(){ return Promise.resolve(0); },
    getNotifications: function(){ return Promise.resolve([]); },
    subscribeFeed: function(){ return { stub:true }; },
    subscribeRealtime: function(){ return { stub:true }; },
    unsubscribeRealtime: function(){},
    createListing: function(listing, content){ window.__created = { listing: listing, content: content }; return Promise.resolve({ id:'lNEW' }); },
    createPost: function(p){ window.__posted = p; return Promise.resolve({ id:'pNEW' }); }
  };
  window.Cloud = new Proxy(base, { get: function(t, k){ if (k in t) return t[k]; return function(){ return Promise.resolve(null); }; } });
})();
`;
