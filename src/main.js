import "./style.css";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ═══════════════════════════════════════════════════════════
   Peta Potensi Desa Bantar – KKN Universitas Galuh 2026
   app.js — Pure Vanilla JS, no build tools
   Works: Live Server (local) + Netlify (production)
   ═══════════════════════════════════════════════════════════ */

("use strict");

// ── State ─────────────────────────────────────────────────────
const state = {
  locations: [],
  filtered: [],
  activeSlug: null,
  searchQuery: "",
  activeCategory: "Semua",
  map: null,
  markers: {},
};

// ── Category Config ────────────────────────────────────────────
const CAT = {
  Pemerintahan: { color: "#4B2E83", bg: "#EDE9FF", icon: "🏛️" },
  Perbelanjaan: { color: "#D97706", bg: "#FEF3C7", icon: "🛒" },
  "Wisata Alam": { color: "#065F46", bg: "#D1FAE5", icon: "🌊" },
  "Sumber Daya Alam": { color: "#0369A1", bg: "#E0F2FE", icon: "🏞️" },
  Pertanian: { color: "#15803D", bg: "#DCFCE7", icon: "🌿" },
  Pendidikan: { color: "#6D28D9", bg: "#EDE9FE", icon: "📚" },
  "Fasilitas Ibadah": { color: "#B45309", bg: "#FEF3C7", icon: "🕌" },
  "Fasilitas Umum": { color: "#1D4ED8", bg: "#DBEAFE", icon: "🏟️" },
};

function getCat(category) {
  return CAT[category] || { color: "#6B7280", bg: "#F3F4F6", icon: "📍" };
}

// ── Helpers ────────────────────────────────────────────────────
function fmtDate(str) {
  return new Date(str).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function showToast(msg, ms = 2200) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.add("hidden"), ms);
}

// ── Data Fetch ─────────────────────────────────────────────────
// Works on both local (Live Server) and Netlify static hosting
async function fetchLocations() {
  // Try relative path first (works on Live Server & Netlify)
  const paths = [
    "public/data/locations.json",
    "./public/data/locations.json",
    "/public/data/locations.json",
  ];

  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      /* try next */
    }
  }
  return [];
}

// ── Map ────────────────────────────────────────────────────────
function initMap() {
  // Center on Desa Bantar, Wanareja, Cilacap
  state.map = L.map("map", {
    center: [-7.363, 108.703],
    zoom: 14,
    zoomControl: false,
  });

  L.control.zoom({ position: "bottomright" }).addTo(state.map);

  const osm = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    },
  );

  const satellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "Tiles © Esri",
      maxZoom: 19,
    },
  );

  osm.addTo(state.map);

  L.control
    .layers(
      { "🗺️ Peta Jalan": osm, "🛰️ Citra Satelit": satellite },
      {},
      { position: "topright", collapsed: false },
    )
    .addTo(state.map);

  // Desa label
  L.marker([-7.36, 108.7], {
    icon: L.divIcon({
      html: '<div class="desa-label">Desa Bantar<small>Kec. Wanareja, Kab. Cilacap</small></div>',
      className: "",
      iconSize: [190, 42],
      iconAnchor: [95, 21],
    }),
    interactive: false,
    zIndexOffset: -9999,
  }).addTo(state.map);
}

function makeIcon(category) {
  const c = getCat(category);
  return L.divIcon({
    html: `<div class="custom-marker-wrap">
      <div class="custom-marker" style="background:${c.color}"><span>${c.icon}</span></div>
      <div class="custom-marker-tail" style="border-top-color:${c.color}"></div>
    </div>`,
    className: "",
    iconSize: [40, 52],
    iconAnchor: [20, 52],
    popupAnchor: [0, -52],
  });
}

function renderMarkers(locs) {
  Object.values(state.markers).forEach((m) => m.remove());
  state.markers = {};

  locs.forEach((loc) => {
    const m = L.marker([loc.lat, loc.lng], { icon: makeIcon(loc.category) })
      .addTo(state.map)
      .bindPopup(buildPopup(loc), { maxWidth: 272, className: "custom-popup" });

    m.on("click", () => highlightCard(loc.slug));

    // Wire popup buttons after popup opens
    m.getPopup().on("add", () => {
      const detailBtn = document.querySelector(
        `.popup-btn-detail[data-slug="${loc.slug}"]`,
      );
      if (detailBtn)
        detailBtn.addEventListener("click", () => openModal(loc.slug));
    });

    state.markers[loc.slug] = m;
  });
}

function buildPopup(loc) {
  const c = getCat(loc.category);
  const shortAddr = loc.address.split(",").slice(0, 2).join(", ");
  return `
    <div class="popup-img-wrap">
      <img src="${loc.thumbnail}" alt="${loc.name}" loading="lazy"
        onerror="this.src='https://placehold.co/272x110/e2e8f0/6b7280?text=Foto'"/>
      <span class="popup-badge" style="background:${c.bg};color:${c.color}">${c.icon} ${loc.category}</span>
    </div>
    <div class="popup-body">
      <h3>${loc.name}</h3>
      <p>📍 ${shortAddr}</p>
      <div class="popup-btn-row">
        <button class="popup-btn-detail" data-slug="${loc.slug}">📋 Lihat Detail</button>
        <a href="${loc.mapsUrl}" target="_blank" rel="noopener" class="popup-btn-maps">🗺️ Maps</a>
      </div>
    </div>`;
}

// ── Sidebar List ────────────────────────────────────────────────
function renderList(locs) {
  const container = document.getElementById("location-list");
  const empty = document.getElementById("empty-state");
  const badge = document.getElementById("list-count-badge");

  if (!locs.length) {
    container.innerHTML = "";
    empty.classList.remove("hidden");
    if (badge) badge.textContent = "0";
    return;
  }

  empty.classList.add("hidden");
  if (badge) badge.textContent = `${locs.length}`;

  container.innerHTML = locs
    .map((loc) => {
      const c = getCat(loc.category);
      return `
      <article class="loc-card" data-slug="${loc.slug}"
        tabindex="0" role="button" aria-label="Lihat detail ${loc.name}"
        onclick="handleCardClick('${loc.slug}')"
        onkeydown="if(event.key==='Enter')handleCardClick('${loc.slug}')">
        <div class="loc-card-thumb">
          <img src="${loc.thumbnail}" alt="${loc.name}" loading="lazy"
            onerror="this.src='https://placehold.co/68x58/e2e8f0/6b7280?text=📍'"/>
        </div>
        <div class="loc-card-body">
          <span class="loc-badge" style="background:${c.bg};color:${c.color}">${c.icon} ${loc.category}</span>
          <h3 class="loc-card-title">${loc.name}</h3>
          <p class="loc-card-addr">📍 ${loc.address.split(",")[0]}</p>
        </div>
      </article>`;
    })
    .join("");
}

// ── Card Click ─────────────────────────────────────────────────
function handleCardClick(slug) {
  highlightCard(slug);
  const loc = state.locations.find((l) => l.slug === slug);
  if (loc && state.markers[slug]) {
    state.map.flyTo([loc.lat, loc.lng], 16, { duration: 0.8 });
    setTimeout(() => state.markers[slug].openPopup(), 900);
  }
  openModal(slug);
}
window.handleCardClick = handleCardClick;

function highlightCard(slug) {
  document
    .querySelectorAll(".loc-card")
    .forEach((c) => c.classList.remove("active"));
  const card = document.querySelector(`.loc-card[data-slug="${slug}"]`);
  if (card) {
    card.classList.add("active");
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  state.activeSlug = slug;
}

// ── Filter ─────────────────────────────────────────────────────
function applyFilter() {
  const q = state.searchQuery.toLowerCase();
  const cat = state.activeCategory;

  state.filtered = state.locations.filter((loc) => {
    const matchQ =
      !q ||
      loc.name.toLowerCase().includes(q) ||
      loc.category.toLowerCase().includes(q) ||
      loc.address.toLowerCase().includes(q) ||
      loc.tags.some((t) => t.toLowerCase().includes(q));
    const matchC = cat === "Semua" || loc.category === cat;
    return matchQ && matchC;
  });

  renderMarkers(state.filtered);
  renderList(state.filtered);

  // Update count
  const el = document.getElementById("location-count");
  if (el) el.textContent = `${state.filtered.length} lokasi`;
}

function buildFilters() {
  const wrap = document.getElementById("category-filters");
  const cats = ["Semua", ...Object.keys(CAT)];
  // Only show categories that exist in data
  const usedCats = new Set(state.locations.map((l) => l.category));
  const visible = cats.filter((c) => c === "Semua" || usedCats.has(c));

  wrap.innerHTML = visible
    .map((cat) => {
      const c = getCat(cat);
      const isAll = cat === "Semua";
      return `<button class="cat-btn ${isAll ? "active" : ""}" data-cat="${cat}"
      style="${isAll ? "--cat-color:#4B2E83" : `--cat-color:${c.color}`}"
      onclick="setCategory('${cat}')">
      ${isAll ? "🗺️ Semua" : `${c.icon} ${cat}`}
    </button>`;
    })
    .join("");
}

window.setCategory = function (cat) {
  state.activeCategory = cat;
  document
    .querySelectorAll(".cat-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.cat === cat));
  applyFilter();
};

// ── Search ─────────────────────────────────────────────────────
function setupSearch() {
  const input = document.getElementById("search-input");
  const clear = document.getElementById("clear-search");

  input.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    clear.classList.toggle("hidden", !e.target.value);
    applyFilter();
  });
}

window.clearSearch = function () {
  document.getElementById("search-input").value = "";
  document.getElementById("clear-search").classList.add("hidden");
  state.searchQuery = "";
  applyFilter();
};

// ── Modal ──────────────────────────────────────────────────────
function openModal(slug) {
  const loc = state.locations.find((l) => l.slug === slug);
  if (!loc) return;

  const c = getCat(loc.category);
  const modal = document.getElementById("detail-modal");
  const content = document.getElementById("modal-content");

  content.innerHTML = `
    <div class="modal-header">
      <div class="modal-header-inner">
        <span class="modal-cat-badge">${c.icon} ${loc.category}</span>
        <h2 class="modal-title" id="modal-title-text">${loc.name}</h2>
        <p class="modal-addr">📍 ${loc.address}</p>
      </div>
      <button class="modal-close-btn" onclick="closeModal()" aria-label="Tutup">✕</button>
    </div>

    <div class="modal-body">
      <div class="modal-photo">
        <img src="${loc.photo}" alt="Foto ${loc.name}" loading="lazy"
          onerror="this.src='https://placehold.co/620x210/e2e8f0/6b7280?text=Foto+Lokasi'"/>
      </div>

      <p class="modal-section-label">Deskripsi</p>
      <p class="modal-desc">${loc.description}</p>

      <div class="modal-meta">
        <div class="meta-item">
          <span class="meta-label">📅 Tanggal Survei</span>
          <span class="meta-value">${fmtDate(loc.date)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">👤 Kontributor</span>
          <span class="meta-value">${loc.contributor}</span>
        </div>
        <div class="meta-item" style="grid-column:1/-1">
          <span class="meta-label">🏷️ Tag</span>
          <div class="tag-row">
            ${loc.tags.map((t) => `<span class="tag" style="background:${c.bg};color:${c.color}">${t}</span>`).join("")}
          </div>
        </div>
      </div>

      <div class="coords-bar">
        <span>🌐 Koordinat:</span>
        <code>${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}</code>
        <button class="copy-btn" onclick="copyCoords('${loc.lat},${loc.lng}')">📋 Salin</button>
      </div>

      <div class="modal-actions">
        <a href="${loc.mapsUrl}" target="_blank" rel="noopener" class="btn-modal-maps">
          📍 Buka Google Maps
        </a>
        <button class="btn-modal-nav" onclick="navTo(${loc.lat},${loc.lng},'${loc.slug}')">
          🎯 Tampilkan di Peta
        </button>
      </div>
    </div>`;

  modal.classList.remove("hidden");
  modal.classList.add("open");
  requestAnimationFrame(() =>
    modal.querySelector(".modal-box").classList.add("enter"),
  );

  history.pushState(null, "", `#lokasi=${slug}`);
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = document.getElementById("detail-modal");
  const box = modal.querySelector(".modal-box");
  box.classList.remove("enter");
  box.classList.add("leave");
  setTimeout(() => {
    modal.classList.remove("open");
    modal.classList.add("hidden");
    box.classList.remove("leave");
    document.body.style.overflow = "";
    history.pushState(null, "", window.location.pathname);
  }, 220);
}
window.openModal = openModal;
window.closeModal = closeModal;

window.copyCoords = function (coords) {
  navigator.clipboard
    .writeText(coords)
    .then(() => {
      showToast("✅ Koordinat berhasil disalin!");
    })
    .catch(() => {
      showToast("⚠️ Tidak dapat menyalin koordinat");
    });
};

window.navTo = function (lat, lng, slug) {
  closeModal();
  setTimeout(() => {
    state.map.flyTo([lat, lng], 17, { duration: 1 });
    setTimeout(() => {
      if (state.markers[slug]) state.markers[slug].openPopup();
    }, 1200);
    document.getElementById("peta").scrollIntoView({ behavior: "smooth" });
  }, 250);
};

// ── Backdrop close ─────────────────────────────────────────────
document.addEventListener("click", (e) => {
  const modal = document.getElementById("detail-modal");
  if (e.target === modal) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const modal = document.getElementById("detail-modal");
    if (!modal.classList.contains("hidden")) closeModal();
  }
});

// ── Hash routing ───────────────────────────────────────────────
function handleHash() {
  const hash = window.location.hash;
  if (!hash.startsWith("#lokasi=")) return;
  const slug = hash.replace("#lokasi=", "");
  if (state.locations.length) {
    openModal(slug);
    highlightCard(slug);
  } else state._pendingSlug = slug;
}
window.addEventListener("hashchange", handleHash);

// ── Scroll to map ──────────────────────────────────────────────
window.scrollToMap = function () {
  document.getElementById("peta").scrollIntoView({ behavior: "smooth" });
};

// ── Navbar ─────────────────────────────────────────────────────
const MENU_STORAGE_KEY = "mobileMenuState";

function toggleMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  const btn = document.getElementById("burger-btn");

  const isOpen = menu.classList.toggle("open");

  btn.classList.toggle("active", isOpen); // Hanya toggle button, CSS handle bars

  btn.setAttribute("aria-expanded", isOpen);

  // Simpan state ke Local Storage
  localStorage.setItem(MENU_STORAGE_KEY, isOpen ? "open" : "closed");
}

function closeMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  const btn = document.getElementById("burger-btn");

  menu.classList.remove("open");
  btn.setAttribute("aria-expanded", "false");
  btn.classList.remove("active");

  // Simpan state ke Local Storage
  localStorage.setItem(MENU_STORAGE_KEY, "closed");
}

function restoreMenuState() {
  const savedState = localStorage.getItem(MENU_STORAGE_KEY);
  const menu = document.getElementById("mobile-menu");
  const btn = document.getElementById("burger-btn");

  // Default: menu tertutup saat page load
  if (savedState === "open" && window.innerWidth < 768) {
    menu.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
    btn.classList.add("active");
  } else {
    menu.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    btn.classList.remove("active");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  restoreMenuState();
});

window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;

function initNavbar() {
  // Header scroll effect
  const header = document.getElementById("main-header");
  window.addEventListener(
    "scroll",
    () => {
      header.classList.toggle("scrolled", window.scrollY > 50);
      // Back to top button
      document
        .getElementById("back-to-top")
        .classList.toggle("hidden", window.scrollY < 400);
    },
    { passive: true },
  );
}

// ── Show map ────────────────────────────────────────────────────
function revealMap() {
  const loading = document.getElementById("map-loading");
  const mapEl = document.getElementById("map");

  loading.style.display = "none";
  mapEl.style.display = "block";

  // Make sure Leaflet resizes properly
  requestAnimationFrame(() => {
    state.map.invalidateSize();
  });
}

// ── Init ───────────────────────────────────────────────────────
async function init() {
  initNavbar();

  // Init map FIRST (before hiding loading screen)
  initMap();

  const locations = await fetchLocations();

  if (!locations.length) {
    document.getElementById("map-loading").innerHTML = `
      <div style="text-align:center;padding:2rem">
        <div style="font-size:2.5rem;margin-bottom:.75rem">⚠️</div>
        <p style="font-size:.9rem;color:#374151;font-weight:600;margin-bottom:.25rem">Data tidak dapat dimuat</p>
        <p style="font-size:.78rem;color:#9CA3AF">Pastikan server berjalan dan file locations.json tersedia</p>
      </div>`;
    return;
  }

  state.locations = locations;
  state.filtered = locations;

  // Render
  renderMarkers(locations);
  renderList(locations);
  buildFilters();
  setupSearch();

  // Update counters
  const countEl = document.getElementById("location-count");
  if (countEl) countEl.textContent = `${locations.length} lokasi`;
  const heroStat = document.getElementById("hero-stat-count");
  if (heroStat) heroStat.textContent = locations.length;

  // Wait for first tile to load, then reveal map
  const checkTiles = () => {
    if (document.querySelectorAll(".leaflet-tile-loaded").length > 0) {
      revealMap();
    } else {
      setTimeout(checkTiles, 100);
    }
  };
  // Fallback: show map after 3s regardless
  setTimeout(revealMap, 3000);
  setTimeout(checkTiles, 600);

  // Hash
  handleHash();
  if (state._pendingSlug) {
    openModal(state._pendingSlug);
    highlightCard(state._pendingSlug);
    delete state._pendingSlug;
  }
}

document.addEventListener("DOMContentLoaded", init);
