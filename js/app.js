// ── Firebase ──
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCN2CD_zIC7FedAfRm6ZnVh7jIqhZD6NWs",
  authDomain: "japan-map-500903.firebaseapp.com",
  projectId: "japan-map-500903",
  storageBucket: "japan-map-500903.firebasestorage.app",
  messagingSenderId: "447815719019",
  appId: "1:447815719019:web:16c9a59eef4e71fe3c392e"
};

const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
const db = getFirestore(fbApp);
const googleProvider = new GoogleAuthProvider();

// ── Constants ──
const TRANSPORT = {
  drive: { label: '開車 / 公車', color: '#378ADD', dash: [8, 4] },
  walk:  { label: '走路',        color: '#EF9F27', dash: [4, 4] },
  train: { label: '電車',        color: '#D85A30', dash: [12, 3] },
};
const TAG_STYLE = {
  '美食': { bg: '#FAEEDA', text: '#633806' },
  '神社': { bg: '#E1F5EE', text: '#085041' },
  '自然': { bg: '#EAF3DE', text: '#27500A' },
  '文化': { bg: '#EEEDFE', text: '#3C3489' },
  '購物': { bg: '#FAECE7', text: '#712B13' },
  '住宿': { bg: '#E8F0FE', text: '#1A3A7A' },
  '交通': { bg: '#FCE8E6', text: '#8C2D1E' },
};

// Icon catalog — keys map to SVG symbol ids in index.html (pin-*).
// Each entry has a label and the inner SVG path markup (used to build map marker data-URIs).
const ICON_CATALOG = {
  pin:      { label: '圖釘' },
  food:     { label: '美食' },
  cafe:     { label: '咖啡' },
  shrine:   { label: '神社' },
  castle:   { label: '城堡' },
  nature:   { label: '自然' },
  shopping: { label: '購物' },
  lodging:  { label: '住宿' },
  station:  { label: '車站' },
  camera:   { label: '景點' },
  heart:    { label: '愛心' },
  star:     { label: '星星' },
};

// Default icon per category
const TAG_DEFAULT_ICON = {
  '美食': 'food', '神社': 'shrine', '自然': 'nature', '文化': 'castle',
  '購物': 'shopping', '住宿': 'lodging', '交通': 'station',
};
// Default color per category
const TAG_DEFAULT_COLOR = {
  '美食': '#E8833A', '神社': '#0E8A6E', '自然': '#4C9A2A', '文化': '#6C5CE7',
  '購物': '#D6336C', '住宿': '#2B7DE9', '交通': '#C0392B',
};

// Color palette for the picker (8-10 common colors)
const COLOR_PALETTE = ['#E0392B', '#E8833A', '#F1B807', '#4C9A2A', '#0E8A6E', '#2B7DE9', '#6C5CE7', '#D6336C', '#7A5C3E', '#566573'];

// Raw SVG inner markup for each icon, used to render map markers as data-URIs.
// (Kept minimal — white stroke on a colored circle.)
const ICON_SVG_PATHS = {
  pin:      '<path d="M12 21c-3.5-3.5-7-6.93-7-11a7 7 0 0 1 14 0c0 4.07-3.5 7.5-7 11Z" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.5" fill="none" stroke="#fff" stroke-width="1.8"/>',
  food:     '<path d="M6 3v7a2 2 0 0 0 2 2v9M6 3v5M9 3v5M16 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4v9" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  cafe:     '<path d="M5 8h12v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V8ZM17 9h2a2 2 0 0 1 0 4h-2M7 3v2M10 3v2M13 3v2" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  shrine:   '<path d="M3 7h18M4 7l1-2.5h14L20 7M6 7v13M18 7v13M5 11h14" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  castle:   '<path d="M4 21V8l2 1V6l2 1V5l2 1V4h4v2l2-1v2l2-1v3l2-1v13M4 21h16M9 21v-4a3 3 0 0 1 6 0v4" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  nature:   '<path d="M12 3 5 13h4l-3 5h12l-3-5h4L12 3ZM12 18v3" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  shopping: '<path d="M6 8h12l-1 12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 8ZM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  lodging:  '<path d="M3 18v-6a2 2 0 0 1 2-2h10a4 4 0 0 1 4 4v4M3 14h16M3 18v2M21 14v6M7 10V7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  station:  '<rect x="5" y="3" width="14" height="13" rx="3" fill="none" stroke="#fff" stroke-width="1.7"/><line x1="5" y1="10" x2="19" y2="10" stroke="#fff" stroke-width="1.7"/><circle cx="9" cy="13.2" r="1" fill="#fff"/><circle cx="15" cy="13.2" r="1" fill="#fff"/><line x1="8.5" y1="16" x2="7" y2="20" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/><line x1="15.5" y1="16" x2="17" y2="20" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>',
  camera:   '<path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="12.5" r="3.2" fill="none" stroke="#fff" stroke-width="1.6"/>',
  heart:    '<path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10Z" fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/>',
  star:     '<path d="m12 3 2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.8 6.7 19.6l1.1-6L3.4 9.4l6-.8L12 3Z" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>',
};

// Resolve a place's effective icon and color (custom overrides, else category default, else fallback)
function placeIcon(p) { return p.icon || TAG_DEFAULT_ICON[p.tag] || 'pin'; }
function placeColor(p) { return p.color || TAG_DEFAULT_COLOR[p.tag] || '#566573'; }

// Build a Google Maps marker icon (data-URI SVG): colored teardrop pin with white glyph inside.
function buildMarkerIcon(iconKey, color, scale) {
  const glyph = ICON_SVG_PATHS[iconKey] || ICON_SVG_PATHS.pin;
  const size = Math.round(scale * 4.2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <g transform="translate(2.6 2.6) scale(0.78)">${glyph}</g>
  </svg>`;
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };
}
// Marker base scale at zoom 14; scales down/up with zoom level
const MARKER_BASE_ZOOM = 14;
const MARKER_BASE_SCALE = 8;
const MARKER_MIN_SCALE = 3;
const MARKER_MAX_SCALE = 11;

// ── State ──
let map, directionsService, directionsRenderer, autocompleteService, placesService;
let currentUser, unsubscribePlaces, unsubscribeRoutes;
let places = [], routes = [];
let markers = {}, polylines = {};
let mode = 'view', activeTab = 'places', currentFilter = '全部';
let selectedPlaceId = null, selectedRouteId = null;
let editingPlaceId = null, pendingLatLng = null;
let pendingIcon = 'food', pendingColor = '#E8833A';  // for the icon/color picker in add/edit modal
let drawingRoute = null, drawPolyline = null, drawPath = [];
let pendingTransport = 'drive';   // for manual draw modal
let topTransport = 'drive';       // for top search bar route mode
let pendingImport = null;
let sidebarOpen = true;
let deleteSelected = new Set();
let searchMode = 'place'; // 'place' | 'route'

// ── Auth ──
window._auth = {
  async login() {
    const email = document.getElementById('l-email').value.trim();
    const pass  = document.getElementById('l-password').value;
    const err   = document.getElementById('login-error');
    err.classList.add('hidden');
    try { await signInWithEmailAndPassword(auth, email, pass); }
    catch(e) { err.textContent = friendlyError(e.code); err.classList.remove('hidden'); }
  },
  async loginGoogle() {
    try { await signInWithPopup(auth, googleProvider); }
    catch(e) { console.error(e); }
  },
  async signup() {
    const email = document.getElementById('s-email').value.trim();
    const pass  = document.getElementById('s-password').value;
    const err   = document.getElementById('signup-error');
    err.classList.add('hidden');
    try { await createUserWithEmailAndPassword(auth, email, pass); }
    catch(e) { err.textContent = friendlyError(e.code); err.classList.remove('hidden'); }
  },
  async logout() { await signOut(auth); },
  showSignup() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('signup-screen').classList.remove('hidden');
  },
  showLogin() {
    document.getElementById('signup-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
  }
};

function friendlyError(code) {
  const m = {
    'auth/invalid-email': '電子郵件格式不正確',
    'auth/user-not-found': '找不到此帳號',
    'auth/wrong-password': '密碼錯誤',
    'auth/email-already-in-use': '此電子郵件已被使用',
    'auth/weak-password': '密碼至少需要 6 個字元',
    'auth/invalid-credential': '電子郵件或密碼錯誤',
  };
  return m[code] || '發生錯誤，請再試一次';
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('signup-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('settings-user-email').textContent = user.email || user.displayName || '';
    initMapWhenReady();
    subscribeData();
  } else {
    currentUser = null;
    document.getElementById('app').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    if (unsubscribePlaces) unsubscribePlaces();
    if (unsubscribeRoutes) unsubscribeRoutes();
    clearMap();
  }
});

// ── Map ──
function initMapWhenReady() {
  if (window._mapReady && !map) initGoogleMap();
  else if (!map) window._onMapReady = initGoogleMap;
}

function initGoogleMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 36.2, lng: 138.5 },
    zoom: 5,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControl: false,
    gestureHandling: 'greedy',
    clickableIcons: true,  // keep Google's POI icons clickable
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: true, preserveViewport: true });
  autocompleteService = new google.maps.places.AutocompleteService();
  placesService = new google.maps.places.PlacesService(map);

  map.addListener('click', (e) => {
    // If a built-in POI was clicked, e.placeId is set — show our own info card instead of Google's
    if (e.placeId) {
      e.stop();  // prevent Google's default POI info window
      if (mode === 'pin') {
        // In pin mode, clicking a POI directly adds it (with its real name)
        handlePoiClick(e.placeId, e.latLng, true);
      } else {
        handlePoiClick(e.placeId, e.latLng, false);
      }
      return;
    }
    if (mode === 'pin') {
      pendingLatLng = e.latLng;
      editingPlaceId = null;
      openAddModal();
    } else if (mode === 'draw' && drawingRoute) {
      addDrawPoint(e.latLng);
    }
  });

  map.addListener('dblclick', () => {
    if (mode === 'draw' && drawingRoute) finishDrawing();
  });

  // Rescale markers as zoom changes
  map.addListener('zoom_changed', () => { syncPlaceMarkers(); });

  setupTopSearch();
}

// Handle clicking a built-in Google POI icon: fetch details, show info card with "新增至地圖"
function handlePoiClick(placeId, latLng, addImmediately) {
  placesService.getDetails(
    { placeId, fields: ['name', 'geometry', 'formatted_address', 'rating', 'user_ratings_total'] },
    (place, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !place) return;
      const loc = place.geometry?.location || latLng;
      if (addImmediately) {
        pendingLatLng = loc;
        editingPlaceId = null;
        openAddModal(place.name);
        return;
      }
      showPoiCard(place, loc);
    }
  );
}

let poiCardData = null;
function showPoiCard(place, loc) {
  poiCardData = { name: place.name, loc };
  document.getElementById('poi-card-name').textContent = place.name || '未命名地點';
  const addr = place.formatted_address || '';
  let metaHtml = addr ? `<div class="poi-card-addr">${esc(addr)}</div>` : '';
  if (place.rating) {
    metaHtml += `<div class="poi-card-rating">★ ${place.rating} <span style="color:#aaa;">(${place.user_ratings_total || 0})</span></div>`;
  }
  document.getElementById('poi-card-meta').innerHTML = metaHtml;
  const card = document.getElementById('poi-card');
  card.classList.remove('hidden');
  map.panTo(loc);
}

window.closePoiCard = function() {
  document.getElementById('poi-card').classList.add('hidden');
  poiCardData = null;
};

window.addPoiToMap = function() {
  if (!poiCardData) return;
  pendingLatLng = poiCardData.loc;
  editingPlaceId = null;
  openAddModal(poiCardData.name);
  closePoiCard();
};

function markerScaleForZoom() {
  const zoom = map.getZoom() || MARKER_BASE_ZOOM;
  const diff = zoom - MARKER_BASE_ZOOM;
  const scale = MARKER_BASE_SCALE + diff * 1.1;
  return Math.max(MARKER_MIN_SCALE, Math.min(MARKER_MAX_SCALE, scale));
}

// ══════════════════════════════════════
// TOP SEARCH BAR (Google Maps style)
// ══════════════════════════════════════
function setupTopSearch() {
  setupAutocompleteInput('top-search', 'top-search-results', (place) => {
    // Place mode: selecting a result immediately opens add-place flow with prefilled data
    pendingLatLng = place.geometry.location;
    editingPlaceId = null;
    map.panTo(pendingLatLng);
    map.setZoom(16);
    openAddModal(place.name);
    document.getElementById('top-search').value = '';
    document.getElementById('top-search-results').classList.add('hidden');
  });

  setupAutocompleteInput('top-r-origin', 'top-origin-results', null, true);
  setupAutocompleteInput('top-r-dest', 'top-dest-results', null, true);
}

// Generic autocomplete wiring.
// onPlaceSelected(place): if provided, fetches full place details on selection (place search mode)
// textOnly: if true, just fills the input text value (route origin/destination mode)
function setupAutocompleteInput(inputId, resultsId, onPlaceSelected, textOnly) {
  const input = document.getElementById(inputId);
  const results = document.getElementById(resultsId);
  if (!input || !results) return;
  let t;
  input.addEventListener('input', () => {
    clearTimeout(t);
    const val = input.value.trim();
    if (!val) { results.classList.add('hidden'); return; }
    t = setTimeout(() => {
      // Bias toward Japan using country restriction (locationBias circle max is 50km,
      // far too small to cover all of Japan, so componentRestrictions is the correct tool here).
      // This still matches Chinese, English, or Japanese keywords (e.g. "精靈寶可夢中心",
      // "pokemon center", "ポケモンセンター") as long as a matching place exists in Japan.
      const request = {
        input: val,
        language: 'zh-TW',
        componentRestrictions: { country: 'jp' },
      };
      autocompleteService.getPlacePredictions(request, (predictions, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions || predictions.length === 0) {
          if (status !== google.maps.places.PlacesServiceStatus.OK && status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            console.warn('Places Autocomplete error:', status);
          }
          results.innerHTML = '<div class="search-result-empty">找不到符合的地點</div>';
          results.classList.remove('hidden');
          return;
        }
        results.innerHTML = predictions.slice(0, 6).map((p, i) =>
          `<div class="search-result-item" data-idx="${i}">
            <div class="sr-name">${esc(p.structured_formatting.main_text)}</div>
            <div class="sr-addr">${esc(p.structured_formatting.secondary_text || '')}</div>
          </div>`
        ).join('');
        results.classList.remove('hidden');
        results.querySelectorAll('.search-result-item').forEach((el, i) => {
          el.onclick = () => {
            const pred = predictions[i];
            if (textOnly) {
              input.value = pred.description;
              results.classList.add('hidden');
            } else if (onPlaceSelected) {
              placesService.getDetails(
                { placeId: pred.place_id, fields: ['name', 'geometry', 'address_components', 'formatted_address'] },
                (place, st) => {
                  if (st !== google.maps.places.PlacesServiceStatus.OK) {
                    console.warn('Place Details error:', st);
                    return;
                  }
                  onPlaceSelected(place);
                }
              );
            }
          };
        });
      });
    }, 280);
  });
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !results.contains(e.target)) results.classList.add('hidden');
  });
}

window.setSearchMode = function(m) {
  searchMode = m;
  document.getElementById('smode-place').classList.toggle('active', m === 'place');
  document.getElementById('smode-route').classList.toggle('active', m === 'route');
  document.getElementById('search-place-row').classList.toggle('hidden', m !== 'place');
  document.getElementById('search-route-row').classList.toggle('hidden', m !== 'route');
};

window.selectTopTransport = function(t) {
  topTransport = t;
  ['drive', 'walk', 'train'].forEach(x => document.getElementById('rt-' + x).classList.toggle('active', x === t));
};

window.topSearchRoute = function() {
  const origin = document.getElementById('top-r-origin').value.trim();
  const dest   = document.getElementById('top-r-dest').value.trim();
  if (!origin || !dest) { alert('請輸入起點和終點'); return; }
  const name = `${origin} → ${dest}`;
  searchAndSaveRoute(origin, dest, name, topTransport, 'top-route-go');
};

// ══════════════════════════════════════
// Firestore
// ══════════════════════════════════════
function subscribeData() {
  const uid = currentUser.uid;
  const pq = query(collection(db, 'places'), where('uid', '==', uid));
  unsubscribePlaces = onSnapshot(pq, (snap) => {
    places = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    syncPlaceMarkers();
    renderList();
  });
  const rq = query(collection(db, 'routes'), where('uid', '==', uid));
  unsubscribeRoutes = onSnapshot(rq, (snap) => {
    routes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    syncRoutePolylines();
    renderList();
  });
}

async function addPlace(data) { await addDoc(collection(db, 'places'), { ...data, uid: currentUser.uid, createdAt: Date.now() }); }
async function updatePlace(id, data) { await updateDoc(doc(db, 'places', id), data); }
async function deletePlace(id) { await deleteDoc(doc(db, 'places', id)); }
async function addRoute(data) { await addDoc(collection(db, 'routes'), { ...data, uid: currentUser.uid, createdAt: Date.now() }); }
async function deleteRoute(id) { await deleteDoc(doc(db, 'routes', id)); }

// ══════════════════════════════════════
// Markers & Polylines
// ══════════════════════════════════════
function syncPlaceMarkers() {
  const ids = new Set(places.map(p => p.id));
  Object.keys(markers).forEach(id => { if (!ids.has(id)) { markers[id].setMap(null); delete markers[id]; } });
  const scale = markerScaleForZoom();
  places.forEach(p => {
    const sel = selectedPlaceId === p.id;
    const iconKey = placeIcon(p);
    const color = placeColor(p);
    const icon = buildMarkerIcon(iconKey, color, sel ? scale * 1.35 : scale);
    if (markers[p.id]) { markers[p.id].setIcon(icon); markers[p.id].setZIndex(sel ? 999 : 1); return; }
    const marker = new google.maps.Marker({ position: { lat: p.lat, lng: p.lng }, map, title: p.name, icon, zIndex: sel ? 999 : 1 });
    marker.addListener('click', () => selectPlace(p.id));
    markers[p.id] = marker;
  });
}

function syncRoutePolylines() {
  const ids = new Set(routes.map(r => r.id));
  Object.keys(polylines).forEach(id => { if (!ids.has(id)) { polylines[id].setMap(null); delete polylines[id]; } });
  routes.forEach(r => {
    const t = TRANSPORT[r.transport] || TRANSPORT.drive;
    const sel = selectedRouteId === r.id;
    if (polylines[r.id]) {
      polylines[r.id].setOptions({ strokeWeight: sel ? 5 : 3, strokeOpacity: sel ? 1 : 0.75 });
      return;
    }
    const path = (r.points || []).map(p => ({ lat: p.lat, lng: p.lng }));
    const poly = new google.maps.Polyline({
      path, map,
      strokeColor: t.color, strokeWeight: 3, strokeOpacity: 0.75,
      icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 }, offset: '0', repeat: `${t.dash[0] + t.dash[1]}px` }]
    });
    poly.addListener('click', () => selectRoute(r.id));
    polylines[r.id] = poly;
  });
}

function clearMap() {
  Object.values(markers).forEach(m => m.setMap(null));
  Object.values(polylines).forEach(p => p.setMap(null));
  markers = {}; polylines = {}; places = []; routes = [];
}

// ══════════════════════════════════════
// Selection
// ══════════════════════════════════════
function selectPlace(id) {
  if (mode === 'delete') { toggleDeleteItem('place', id); return; }
  selectedPlaceId = id; selectedRouteId = null;
  const p = places.find(x => x.id === id);
  if (!p) return;
  const color = placeColor(p);
  document.getElementById('info-name').textContent = p.name;
  document.getElementById('info-meta').innerHTML =
    `<span style="display:inline-block;padding:1px 8px;border-radius:999px;font-size:11px;background:${color}22;color:${color};margin-right:6px;">${p.tag}</span>${p.date || ''}`;
  document.getElementById('info-note').textContent = p.note || '（尚無筆記）';
  document.getElementById('info-panel').classList.remove('hidden');
  syncPlaceMarkers(); renderList();
  map.panTo({ lat: p.lat, lng: p.lng });
}

function selectRoute(id) {
  if (mode === 'delete') { toggleDeleteItem('route', id); return; }
  selectedRouteId = id; selectedPlaceId = null;
  document.getElementById('info-panel').classList.add('hidden');
  syncRoutePolylines(); renderList();
}

window.closeInfoPanel = function() {
  selectedPlaceId = null; selectedRouteId = null;
  document.getElementById('info-panel').classList.add('hidden');
  syncPlaceMarkers(); renderList();
};

window.editSelectedPlace = function() {
  const p = places.find(x => x.id === selectedPlaceId);
  if (!p) return;
  editingPlaceId = p.id;
  document.getElementById('modal-title').textContent = '編輯地點';
  document.getElementById('f-name').value = p.name;
  document.getElementById('f-tag').value = p.tag || '美食';
  document.getElementById('f-date').value = p.date || '';
  document.getElementById('f-note').value = p.note || '';
  // Populate pickers with this place's effective icon/color
  pendingIcon = placeIcon(p);
  pendingColor = placeColor(p);
  renderIconPicker();
  renderColorPicker();
  document.getElementById('add-modal').classList.remove('hidden');
};

window.deleteSelectedPlace = async function() {
  if (!selectedPlaceId || !confirm('確定要刪除這個地點嗎？')) return;
  if (markers[selectedPlaceId]) { markers[selectedPlaceId].setMap(null); delete markers[selectedPlaceId]; }
  await deletePlace(selectedPlaceId);
  selectedPlaceId = null;
  document.getElementById('info-panel').classList.add('hidden');
};

// ══════════════════════════════════════
// Delete Mode
// ══════════════════════════════════════
function toggleDeleteItem(type, id) {
  const key = `${type}:${id}`;
  if (deleteSelected.has(key)) deleteSelected.delete(key);
  else deleteSelected.add(key);
  document.getElementById('delete-count').textContent = `已選 ${deleteSelected.size} 項`;
  renderList();
}

window.confirmDelete = async function() {
  if (deleteSelected.size === 0) return;
  if (!confirm(`確定要刪除 ${deleteSelected.size} 個項目嗎？此動作無法復原。`)) return;
  for (const key of deleteSelected) {
    const [type, id] = key.split(':');
    if (type === 'place') {
      if (markers[id]) { markers[id].setMap(null); delete markers[id]; }
      await deletePlace(id);
    } else if (type === 'route') {
      if (polylines[id]) { polylines[id].setMap(null); delete polylines[id]; }
      await deleteRoute(id);
    }
  }
  deleteSelected.clear();
  setMode('view');
};

// ══════════════════════════════════════
// Mode
// ══════════════════════════════════════
window.setMode = function(m) {
  mode = m;
  deleteSelected.clear();
  ['view', 'pin'].forEach(x => {
    const b = document.getElementById('btn-' + x);
    if (b) b.classList.toggle('active', x === m);
  });
  document.getElementById('btn-route').classList.toggle('active', m === 'draw');
  const delBtn = document.getElementById('btn-delete');
  if (delBtn) delBtn.classList.toggle('delete-mode', m === 'delete');
  const delBar = document.getElementById('delete-bar');
  delBar.classList.toggle('hidden', m !== 'delete');
  document.getElementById('delete-count').textContent = '已選 0 項';
  const ind = document.getElementById('mode-indicator');
  if (m === 'pin') { ind.textContent = '點擊地圖新增地點'; ind.classList.remove('hidden'); }
  else if (m === 'draw') { ind.textContent = '點擊畫點 — 雙擊完成'; ind.classList.remove('hidden'); }
  else if (m === 'delete') { ind.textContent = '點擊地點或路線來選取'; ind.classList.remove('hidden'); }
  else { ind.classList.add('hidden'); }
  if (map) map.setOptions({ draggableCursor: (m === 'pin' || m === 'draw') ? 'crosshair' : '' });
  renderList();
};

// ══════════════════════════════════════
// Sidebar / Tabs / Filter
// ══════════════════════════════════════
window.toggleSidebar = function() {
  sidebarOpen = !sidebarOpen;
  document.getElementById('sidebar').classList.toggle('collapsed', !sidebarOpen);
  document.getElementById('reopen-btn').classList.toggle('hidden', sidebarOpen);
};

window.switchTab = function(tab) {
  activeTab = tab;
  document.getElementById('tab-places').classList.toggle('active', tab === 'places');
  document.getElementById('tab-routes').classList.toggle('active', tab === 'routes');
  document.getElementById('filter-bar').style.display = tab === 'places' ? 'flex' : 'none';
  renderList();
};

window.filterTag = function(el, tag) {
  currentFilter = tag;
  document.querySelectorAll('.tag-filter').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderList();
};

// ══════════════════════════════════════
// Render List
// ══════════════════════════════════════
function renderList() {
  const list = document.getElementById('content-list');
  if (activeTab === 'places') {
    const f = currentFilter === '全部' ? places : places.filter(p => p.tag === currentFilter);
    if (f.length === 0) {
      list.innerHTML = '<div class="list-empty">尚無地點記錄<br>用上方搜尋列或「新增」按鈕加入地點</div>';
    } else {
      list.innerHTML = f.map(p => {
        const sel = selectedPlaceId === p.id;
        const delSel = deleteSelected.has(`place:${p.id}`);
        const color = placeColor(p);
        const iconKey = placeIcon(p);
        return `<div class="place-item${sel ? ' selected' : ''}${delSel ? ' delete-selected' : ''}" onclick="selectPlace('${p.id}')">
          ${mode === 'delete' ? `<div class="delete-checkbox${delSel ? ' checked' : ''}"></div>` : ''}
          <div class="place-icon" style="background:${color};"><svg class="icon" style="color:#fff;"><use href="#pin-${iconKey}"/></svg></div>
          <div class="place-info">
            <div class="place-name">${esc(p.name)}</div>
            <div class="place-meta">${p.date || ''}</div>
            <span class="place-tag" style="background:${color}1f;color:${color};">${p.tag}</span>
          </div>
        </div>`;
      }).join('');
    }
  } else {
    if (routes.length === 0) {
      list.innerHTML = '<div class="list-empty">尚無路線記錄<br>用上方搜尋列規劃路線，或手動畫路線</div>';
    } else {
      list.innerHTML = routes.map(r => {
        const t = TRANSPORT[r.transport] || TRANSPORT.drive;
        const sel = selectedRouteId === r.id;
        const delSel = deleteSelected.has(`route:${r.id}`);
        return `<div class="route-item${sel ? ' selected' : ''}${delSel ? ' delete-selected' : ''}" onclick="selectRoute('${r.id}')">
          ${mode === 'delete' ? `<div class="delete-checkbox${delSel ? ' checked' : ''}"></div>` : ''}
          <div class="route-swatch" style="background:${t.color};"></div>
          <div class="route-info">
            <div class="route-name">${esc(r.name)}</div>
            <div class="route-meta">${(r.points || []).length} 個節點</div>
            <span class="transport-badge" style="background:${t.color}22;color:${t.color};">${t.label}</span>
          </div>
        </div>`;
      }).join('');
    }
  }
  renderStats();
}

function renderStats() {
  document.getElementById('st-places').textContent = places.length;
  document.getElementById('st-routes').textContent = routes.length;
}

// ══════════════════════════════════════
// Add / Edit Place
// ══════════════════════════════════════
function openAddModal(prefillName) {
  document.getElementById('modal-title').textContent = '新增地點';
  document.getElementById('f-name').value = prefillName || '';
  document.getElementById('f-note').value = '';
  document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('f-tag').value = '美食';
  // New place starts with the default icon/color for the default category
  pendingIcon = TAG_DEFAULT_ICON['美食'];
  pendingColor = TAG_DEFAULT_COLOR['美食'];
  renderIconPicker();
  renderColorPicker();
  document.getElementById('add-modal').classList.remove('hidden');
  if (!prefillName) setTimeout(() => document.getElementById('f-name').focus(), 50);
}

// Icon / color picker state and rendering
function renderIconPicker() {
  const wrap = document.getElementById('icon-picker');
  wrap.innerHTML = Object.keys(ICON_CATALOG).map(key =>
    `<div class="icon-choice${pendingIcon === key ? ' selected' : ''}" title="${ICON_CATALOG[key].label}" onclick="pickIcon('${key}')">
      <svg class="icon"><use href="#pin-${key}"/></svg>
    </div>`
  ).join('');
}
function renderColorPicker() {
  const wrap = document.getElementById('color-picker');
  wrap.innerHTML = COLOR_PALETTE.map(c =>
    `<div class="color-choice${pendingColor === c ? ' selected' : ''}" style="background:${c};color:${c};" onclick="pickColor('${c}')"></div>`
  ).join('');
}
window.pickIcon = function(key) { pendingIcon = key; renderIconPicker(); };
window.pickColor = function(c) { pendingColor = c; renderColorPicker(); };

// When category changes, update icon/color to that category's defaults
// (only if the user hasn't been manually overriding — simplest: always snap to new category default)
window.onTagChange = function() {
  const tag = document.getElementById('f-tag').value;
  pendingIcon = TAG_DEFAULT_ICON[tag] || 'pin';
  pendingColor = TAG_DEFAULT_COLOR[tag] || '#566573';
  renderIconPicker();
  renderColorPicker();
};

window.savePlace = async function() {
  const name = document.getElementById('f-name').value.trim();
  if (!name) { document.getElementById('f-name').focus(); return; }
  const data = {
    name,
    tag:   document.getElementById('f-tag').value,
    date:  document.getElementById('f-date').value,
    note:  document.getElementById('f-note').value.trim(),
    icon:  pendingIcon,
    color: pendingColor,
  };
  if (editingPlaceId) {
    await updatePlace(editingPlaceId, data);
    selectedPlaceId = editingPlaceId;
    editingPlaceId = null;
  } else if (pendingLatLng) {
    data.lat = typeof pendingLatLng.lat === 'function' ? pendingLatLng.lat() : pendingLatLng.lat;
    data.lng = typeof pendingLatLng.lng === 'function' ? pendingLatLng.lng() : pendingLatLng.lng;
    await addPlace(data);
    pendingLatLng = null;
  }
  closeModal();
};

window.closeModal = function() {
  document.getElementById('add-modal').classList.add('hidden');
  pendingLatLng = null; editingPlaceId = null;
};

// ══════════════════════════════════════
// Settings Modal
// ══════════════════════════════════════
window.openSettings = function() { document.getElementById('settings-overlay').classList.remove('hidden'); };
window.closeSettings = function() { document.getElementById('settings-overlay').classList.add('hidden'); };

// ══════════════════════════════════════
// Manual Route Drawing Modal
// ══════════════════════════════════════
window.openRouteModal = function() {
  pendingTransport = 'drive';
  document.querySelectorAll('.transport-option').forEach(el => el.classList.remove('selected'));
  document.getElementById('t-drive').classList.add('selected');
  document.getElementById('r-name').value = '';
  document.getElementById('route-modal').classList.remove('hidden');
};

window.selectTransport = function(t) {
  pendingTransport = t;
  document.querySelectorAll('.transport-option').forEach(el => el.classList.remove('selected'));
  document.getElementById('t-' + t).classList.add('selected');
};

window.closeRouteModal = function() { document.getElementById('route-modal').classList.add('hidden'); };

function startDrawing() {
  const name = document.getElementById('r-name').value.trim() || '未命名路線';
  drawingRoute = { name, transport: pendingTransport };
  drawPath = [];
  if (drawPolyline) { drawPolyline.setMap(null); drawPolyline = null; }
  closeRouteModal();
  setMode('draw');
  const t = TRANSPORT[pendingTransport];
  drawPolyline = new google.maps.Polyline({
    path: [], map,
    strokeColor: t.color, strokeWeight: 3, strokeOpacity: 0.6,
    icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 }, offset: '0', repeat: `${t.dash[0] + t.dash[1]}px` }]
  });
}

function addDrawPoint(latLng) {
  drawPath.push({ lat: latLng.lat(), lng: latLng.lng() });
  drawPolyline.setPath(drawPath.map(p => ({ lat: p.lat, lng: p.lng })));
}

async function finishDrawing() {
  if (drawPath.length >= 2 && drawingRoute) {
    await addRoute({ name: drawingRoute.name, transport: drawingRoute.transport, points: drawPath });
  }
  if (drawPolyline) { drawPolyline.setMap(null); drawPolyline = null; }
  drawPath = []; drawingRoute = null;
  setMode('view');
  if (activeTab !== 'routes') switchTab('routes');
}

// ══════════════════════════════════════
// Auto Route (Directions API) — used by top search bar
// ══════════════════════════════════════
function searchAndSaveRoute(origin, dest, name, transport, triggerBtnId) {
  const travelMode = {
    drive: google.maps.TravelMode.DRIVING,
    walk:  google.maps.TravelMode.WALKING,
    train: google.maps.TravelMode.TRANSIT,
  }[transport];

  const request = { origin, destination: dest, travelMode, region: 'jp' };
  if (transport === 'train') request.transitOptions = { departureTime: new Date() };

  const btn = triggerBtnId ? document.getElementById(triggerBtnId) : null;
  const origText = btn ? btn.textContent : '';
  if (btn) { btn.textContent = '搜尋中...'; btn.disabled = true; }

  directionsService.route(request, async (result, status) => {
    if (btn) { btn.textContent = origText; btn.disabled = false; }

    if (status !== google.maps.DirectionsStatus.OK) {
      if (transport === 'train') {
        const retry = confirm('找不到電車路線（部分地區大眾運輸資料不完整）。\n要改用開車路線替代嗎？');
        if (retry) {
          directionsService.route(
            { origin, destination: dest, travelMode: google.maps.TravelMode.DRIVING, region: 'jp' },
            async (result2, status2) => {
              if (status2 !== google.maps.DirectionsStatus.OK) {
                alert('找不到路線，請確認起點和終點名稱是否正確。'); return;
              }
              await saveRouteFromResult(result2, name, 'drive');
              clearTopRouteInputs();
            }
          );
        }
      } else {
        alert('找不到路線，請確認起點和終點名稱是否正確。\n\n建議：輸入完整車站名，例如「大船駅」、「渋谷駅」');
      }
      return;
    }
    await saveRouteFromResult(result, name, transport);
    clearTopRouteInputs();
  });
}

function clearTopRouteInputs() {
  document.getElementById('top-r-origin').value = '';
  document.getElementById('top-r-dest').value = '';
}

async function saveRouteFromResult(result, name, transport) {
  const t = TRANSPORT[transport];
  const leg = result.routes[0].legs[0];
  const points = [];
  leg.steps.forEach(step => {
    if (step.steps) {
      step.steps.forEach(sub => sub.path.forEach(ll => points.push({ lat: ll.lat(), lng: ll.lng() })));
    } else {
      step.path.forEach(ll => points.push({ lat: ll.lat(), lng: ll.lng() }));
    }
  });

  const maxPts = 200;
  const interval = Math.max(1, Math.floor(points.length / maxPts));
  const sampled = points.filter((_, i) => i % interval === 0);
  if (points.length > 0 && sampled[sampled.length - 1] !== points[points.length - 1]) {
    sampled.push(points[points.length - 1]);
  }

  await addRoute({ name, transport, points: sampled });
  if (activeTab !== 'routes') switchTab('routes');

  directionsRenderer.setMap(map);
  directionsRenderer.setDirections(result);
  directionsRenderer.setOptions({ polylineOptions: { strokeColor: t.color, strokeWeight: 4, strokeOpacity: 0.6 } });
  setTimeout(() => directionsRenderer.setMap(null), 4000);
}

// ══════════════════════════════════════
// Import (Google Timeline)
// ══════════════════════════════════════
window.openImport = function() {
  document.getElementById('import-overlay').classList.remove('hidden');
  document.getElementById('import-result').classList.add('hidden');
  document.getElementById('import-confirm').classList.add('hidden');
  document.getElementById('file-input').value = '';
  pendingImport = null;
};
window.closeImport = function() { document.getElementById('import-overlay').classList.add('hidden'); };
window.handleDrop = function(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.remove('dragover');
  const f = e.dataTransfer.files[0]; if (f) handleFile(f);
};
window.handleFile = function(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      const result = parseGoogleTimeline(data);
      const res = document.getElementById('import-result');
      res.classList.remove('hidden');
      if (result.places.length === 0 && result.routes.length === 0) {
        res.textContent = '找不到可匯入的資料，請確認檔案格式。';
        res.className = 'error';
        document.getElementById('import-confirm').classList.add('hidden');
        pendingImport = null;
      } else {
        res.textContent = `找到 ${result.places.length} 個地點、${result.routes.length} 條路線，確認後加入地圖。`;
        res.className = 'success';
        document.getElementById('import-confirm').classList.remove('hidden');
        pendingImport = result;
      }
    } catch {
      const res = document.getElementById('import-result');
      res.classList.remove('hidden');
      res.textContent = '無法解析 JSON 檔案，請確認檔案未損壞。';
      res.className = 'error';
    }
  };
  reader.readAsText(file);
};

window.confirmImport = async function() {
  if (!pendingImport) return;
  const btn = document.getElementById('import-confirm');
  btn.textContent = '匯入中...'; btn.disabled = true;
  for (const p of pendingImport.places) await addPlace(p);
  for (const r of pendingImport.routes) await addRoute(r);
  closeImport();
  btn.textContent = '匯入'; btn.disabled = false;
};

function parseGoogleTimeline(data) {
  const out = { places: [], routes: [] };
  if (data.timelineObjects) {
    data.timelineObjects.forEach(obj => {
      if (obj.placeVisit) {
        const pv = obj.placeVisit; const loc = pv.location || {};
        if (loc.latitudeE7 && loc.longitudeE7) {
          out.places.push({
            name: loc.name || '未命名地點',
            tag: '文化', date: pv.duration?.startTimestamp?.slice(0, 10) || '',
            note: '從 Google 時間軸匯入',
            lat: loc.latitudeE7 / 1e7, lng: loc.longitudeE7 / 1e7,
          });
        }
      }
      if (obj.activitySegment) {
        const as = obj.activitySegment; const pts = [];
        if (as.startLocation?.latitudeE7) pts.push({ lat: as.startLocation.latitudeE7 / 1e7, lng: as.startLocation.longitudeE7 / 1e7 });
        if (as.endLocation?.latitudeE7) pts.push({ lat: as.endLocation.latitudeE7 / 1e7, lng: as.endLocation.longitudeE7 / 1e7 });
        if (pts.length >= 2) {
          const act = as.activityType || '';
          let transport = 'drive';
          if (act.includes('WALKING') || act.includes('FOOT')) transport = 'walk';
          else if (act.includes('SUBWAY') || act.includes('TRAIN') || act.includes('RAIL')) transport = 'train';
          out.routes.push({ name: '匯入路線', transport, points: pts });
        }
      }
    });
  }
  if (data.locations?.length > 0) {
    const pts = data.locations.slice(0, 100).filter(l => l.latitudeE7).map(l => ({ lat: l.latitudeE7 / 1e7, lng: l.longitudeE7 / 1e7 }));
    if (pts.length >= 2) out.routes.push({ name: '位置記錄軌跡', transport: 'drive', points: pts });
  }
  return out;
}

window.zoomIn = function() { if (map) map.setZoom(map.getZoom() + 1); };
window.zoomOut = function() { if (map) map.setZoom(map.getZoom() - 1); };
window.recenterMap = function() { if (map) { map.panTo({ lat: 36.2, lng: 138.5 }); map.setZoom(5); } };

// ── Expose globals ──
window.selectPlace = selectPlace;
window.selectRoute = selectRoute;
window.startDrawing = startDrawing;

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
