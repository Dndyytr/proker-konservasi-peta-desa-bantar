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
  Pemerintahan: {
    color: "#4B2E83",
    bg: "#EDE9FF",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="size-4.5 bp360:size-4.75 bp575:size-5 md:size-5.25 lg:size-5.75 xl:size-6 2xl:size-6.25 fill-current"><path d="M335.9 84.2C326.1 78.6 314 78.6 304.1 84.2L80.1 212.2C67.5 219.4 61.3 234.2 65 248.2C68.7 262.2 81.5 272 96 272L128 272L128 480L128 480L76.8 518.4C68.7 524.4 64 533.9 64 544C64 561.7 78.3 576 96 576L544 576C561.7 576 576 561.7 576 544C576 533.9 571.3 524.4 563.2 518.4L512 480L512 272L544 272C558.5 272 571.2 262.2 574.9 248.2C578.6 234.2 572.4 219.4 559.8 212.2L335.8 84.2zM464 272L464 480L400 480L400 272L464 272zM352 272L352 480L288 480L288 272L352 272zM240 272L240 480L176 480L176 272L240 272zM320 160C337.7 160 352 174.3 352 192C352 209.7 337.7 224 320 224C302.3 224 288 209.7 288 192C288 174.3 302.3 160 320 160z"/></svg>`,
  },
  Perbelanjaan: {
    color: "#D97706",
    bg: "#FEF3C7",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="size-4.5 bp360:size-4.75 bp575:size-5 md:size-5.25 lg:size-5.75 xl:size-6 2xl:size-6.25 fill-current"><path d="M24 48C10.7 48 0 58.7 0 72C0 85.3 10.7 96 24 96L69.3 96C73.2 96 76.5 98.8 77.2 102.6L129.3 388.9C135.5 423.1 165.3 448 200.1 448L456 448C469.3 448 480 437.3 480 424C480 410.7 469.3 400 456 400L200.1 400C188.5 400 178.6 391.7 176.5 380.3L171.4 352L475 352C505.8 352 532.2 330.1 537.9 299.8L568.9 133.9C572.6 114.2 557.5 96 537.4 96L124.7 96L124.3 94C119.5 67.4 96.3 48 69.2 48L24 48zM208 576C234.5 576 256 554.5 256 528C256 501.5 234.5 480 208 480C181.5 480 160 501.5 160 528C160 554.5 181.5 576 208 576zM432 576C458.5 576 480 554.5 480 528C480 501.5 458.5 480 432 480C405.5 480 384 501.5 384 528C384 554.5 405.5 576 432 576z"/></svg>`,
  },
  // "Wisata Alam": { color: "#065F46", bg: "#D1FAE5", icon: "🌊" },
  // "Sumber Daya Alam": { color: "#0369A1", bg: "#E0F2FE", icon: "🏞️" },
  // Pertanian: { color: "#15803D", bg: "#DCFCE7", icon: "🌿" },
  Pendidikan: {
    color: "#6D28D9",
    bg: "#EDE9FE",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="size-4.5 bp360:size-4.75 bp575:size-5 md:size-5.25 lg:size-5.75 xl:size-6 2xl:size-6.25 fill-current"><path d="M80 259.8L289.2 345.9C299 349.9 309.4 352 320 352C330.6 352 341 349.9 350.8 345.9L593.2 246.1C602.2 242.4 608 233.7 608 224C608 214.3 602.2 205.6 593.2 201.9L350.8 102.1C341 98.1 330.6 96 320 96C309.4 96 299 98.1 289.2 102.1L46.8 201.9C37.8 205.6 32 214.3 32 224L32 520C32 533.3 42.7 544 56 544C69.3 544 80 533.3 80 520L80 259.8zM128 331.5L128 448C128 501 214 544 320 544C426 544 512 501 512 448L512 331.4L369.1 390.3C353.5 396.7 336.9 400 320 400C303.1 400 286.5 396.7 270.9 390.3L128 331.4z"/></svg>`,
  },
  "Fasilitas Ibadah": {
    color: "#B45309",
    bg: "#FEF3C7",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M174.8 224l226.4 0c43.5 0 78.8-35.3 78.8-78.8 0-25.5-12.3-49.4-33.1-64.2L297.3-25.4c-5.6-3.9-13-3.9-18.5 0L129.1 81C108.3 95.8 96 119.7 96 145.2 96 188.7 131.3 224 174.8 224zM512 512c35.3 0 64-28.7 64-64l0-224c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 48-448 0 0-48c0-17.7-14.3-32-32-32S0 206.3 0 224L0 448c0 35.3 28.7 64 64 64l448 0zM240 384c0-26.5 21.5-48 48-48s48 21.5 48 48l0 80-96 0 0-80z"/></svg>`,
  },
  "Fasilitas Umum": {
    color: "#1D4ED8",
    bg: "#DBEAFE",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" class="size-4.5 bp360:size-4.75 bp575:size-5 md:size-5.25 lg:size-5.75 xl:size-6 2xl:size-6.25 fill-current"><path d="M64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-384c0-35.3-28.7-64-64-64L64 0zM176 352l32 0c17.7 0 32 14.3 32 32l0 80-96 0 0-80c0-17.7 14.3-32 32-32zM96 112c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32zM240 96l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16zM96 240c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32zm144-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16z"/></svg>`,
  },
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
    "/data/locations.json", // Production (Netlify)
    "data/locations.json", // Relative
    "/public/data/locations.json", // Fallback lokal
    "public/data/locations.json", // Fallback lokal
  ];

  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      console.error(`Failed to fetch from ${path}:`, e);
    }
  }

  console.warn("❌ Data tidak tersedia di semua path");
  return [];
}

// ── Map ────────────────────────────────────────────────────────
function initMap() {
  // Center on Desa Bantar, Wanareja, Cilacap
  state.map = L.map("map", {
    center: [-7.366091753369489, 108.71228885877959],
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

  const desaMarker = L.marker([-7.366091753369489, 108.71228885877959], {
    icon: L.divIcon({
      html: '<div class="desa-label size-max font-bold text-xs bp360:text-[0.8rem] bp400:text-[0.85rem] md:text-[0.9rem] lg:text-[0.95rem] 2xl:text-base">Desa Bantar<small class="font-medium">Kec. Wanareja, Kab. Cilacap</small></div>',
      className: "desa-marker-icon",
      // iconSize: [150, 42],
      iconAnchor: [95, 21],
    }),
    interactive: false,
    zIndexOffset: -9999,
  }).addTo(state.map);

  // ✨ Klik Desa Label → Zoom ke Desa
  document.getElementById("map").addEventListener("click", (e) => {
    if (e.target.closest(".desa-marker-icon")) {
      state.map.flyTo([-7.366091753369489, 108.71228885877959], 14, {
        duration: 800,
      });
    }
  });
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
  if (el) el.textContent = state.filtered.length;
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
      return `<button class="cat-btn text-xs bp360:text-[0.8rem] bp400:text-[0.85rem] md:text-[0.9rem] lg:text-[0.95rem] 2xl:text-base ${isAll ? "active" : ""}" data-cat="${cat}"
      style="${isAll ? "--cat-color:#4B2E83" : `--cat-color:${c.color}`}"
      onclick="setCategory('${cat}')">
      ${isAll ? `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="size-4.5 bp360:size-4.75 bp575:size-5 md:size-5.25 lg:size-5.75 xl:size-6 2xl:size-6.25 fill-current"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M2.43627 5.14686C2 5.64345 2 6.49488 2 8.19773V17.591C2 18.797 2 19.4 2.3146 19.854C2.62919 20.3079 3.17921 20.4986 4.27924 20.88L5.57343 21.3286C6.27436 21.5717 6.81371 21.7586 7.26633 21.879C7.5616 21.9576 7.83333 21.7258 7.83333 21.4203V6.2701C7.83333 6.02118 7.64964 5.81111 7.40837 5.74991C7.01914 5.65118 6.55127 5.48897 5.91002 5.26666C4.35676 4.72817 3.58014 4.45893 2.98922 4.73235C2.77941 4.82942 2.59116 4.97054 2.43627 5.14686Z"></path> <path d="M12.6204 3.48096L11.0844 4.54596C10.5287 4.93124 10.1215 5.2136 9.77375 5.41491C9.60895 5.51032 9.5 5.68291 9.5 5.87334V20.9203C9.5 21.2909 9.88398 21.5222 10.1962 21.3225C10.5312 21.1082 10.9149 20.8422 11.3796 20.5199L12.9156 19.4549C13.4712 19.0697 13.8785 18.7873 14.2262 18.586C14.3911 18.4906 14.5 18.318 14.5 18.1276V3.08063C14.5 2.71004 14.116 2.47866 13.8038 2.67836C13.4688 2.89271 13.0851 3.15874 12.6204 3.48096Z"></path> <path d="M19.7208 3.12093L18.4266 2.67226C17.7256 2.42923 17.1863 2.24228 16.7337 2.12187C16.4384 2.04333 16.1667 2.2751 16.1667 2.58064V17.7308C16.1667 17.9797 16.3504 18.1898 16.5916 18.251C16.9809 18.3497 17.4488 18.5119 18.09 18.7342C19.6432 19.2727 20.4199 19.542 21.0108 19.2686C21.2206 19.1715 21.4088 19.0304 21.5637 18.854C22 18.3575 22 17.506 22 15.8032V6.40988C22 5.2039 22 4.60091 21.6854 4.14695C21.3708 3.69298 20.8208 3.5023 19.7208 3.12093Z"></path> </g></svg> Semua` : `${c.icon} ${cat}`}
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
  const mouseScroll = document.querySelector(".mouse-scroll");

  window.addEventListener(
    "scroll",
    () => {
      header.classList.toggle("scrolled", window.scrollY > 50);
      // Back to top button
      document
        .getElementById("back-to-top")
        .classList.toggle("hidden", window.scrollY < 400);
      mouseScroll.style.opacity = window.scrollY > 200 ? "0" : "1";
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

// ── Counter Animation ──────────────────────────────────────────
function animateCounter(el, target, duration = 1500) {
  let current = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      el.textContent = target;
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(current);
    }
  }, 16);
}

function animateRandomText(element, finalText, duration = 500, fps = 30) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const interval = duration / fps;
  let elapsed = 0;
  const maxRandomChars = 5; // ✨ Limit hanya 5 karakter acak di ujung

  const timer = setInterval(() => {
    elapsed += interval;
    const progress = Math.min(elapsed / duration, 1);

    // Hitung berapa banyak karakter di ujung yang sudah "fixed"
    const randomStartIdx = Math.max(0, finalText.length - maxRandomChars);
    const fixedEndCount = Math.floor(maxRandomChars * progress);
    const randomEndIdx = finalText.length - fixedEndCount;

    // Karakter normal dari awal sampai mulai acak
    let display = finalText.slice(0, randomStartIdx);

    // Karakter acak di ujung (berkurang seiring progress)
    for (let i = randomStartIdx; i < randomEndIdx; i++) {
      display += chars[Math.floor(Math.random() * chars.length)];
    }

    // Karakter yang sudah fixed di ujung
    display += finalText.slice(randomEndIdx);

    element.textContent = display;
    if (progress >= 1) {
      element.textContent = finalText;
      clearInterval(timer);
    }
  }, interval);
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
  const heroStat = document.getElementById("hero-stat-count");
  const heroStat2 = document.getElementById("hero-stat-count-2");
  const heroStat3 = document.getElementById("hero-stat-count-3");
  if (heroStat || countEl) {
    heroStat.textContent = "0";
    heroStat2.textContent = "0";
    heroStat3.textContent = "0";
    setTimeout(() => animateCounter(heroStat, locations.length, 1000), 300);
    setTimeout(() => animateCounter(countEl, locations.length, 1000), 300);
    setTimeout(
      () => animateCounter(heroStat2, Object.keys(CAT).length, 1000),
      300,
    );
    setTimeout(() => animateCounter(heroStat3, 2026, 1000), 300);
  }

  // Animate hero text
  const heroText = document.querySelectorAll(".hero-stat-label");
  heroText.forEach((el) => {
    // Ambil text yang sudah ada di HTML
    const textContent = el.textContent.trim();
    // Jalankan animasi dengan text itu
    setTimeout(() => animateRandomText(el, textContent, 2000), 300);
  });

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
