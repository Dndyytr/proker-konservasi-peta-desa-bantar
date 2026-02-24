import "./style.css";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ============================================================
// Peta Potensi Desa Bantar – KKN Universitas Galuh
// app.js – Vanilla JS Application
// ============================================================

("use strict");

// ─── State ───────────────────────────────────────────────────
const state = {
  locations: [],
  filtered: [],
  activeSlug: null,
  searchQuery: "",
  activeCategory: "Semua",
  map: null,
  markers: {},
};

// ─── Category Config ─────────────────────────────────────────
const CATEGORY_CONFIG = {
  Pemerintahan: { color: "#4B2E83", bg: "#EDE9FF", icon: "🏛️" },
  "Sumber Daya Alam": { color: "#065F46", bg: "#D1FAE5", icon: "🌿" },
  UMKM: { color: "#FF8C00", bg: "#FFF3CD", icon: "🧺" },
  Pendidikan: { color: "#1D4ED8", bg: "#DBEAFE", icon: "📚" },
  Pertanian: { color: "#15803D", bg: "#DCFCE7", icon: "🌾" },
};

function getCatConfig(category) {
  return (
    CATEGORY_CONFIG[category] || { color: "#6B7280", bg: "#F3F4F6", icon: "📍" }
  );
}

// ─── Helpers ─────────────────────────────────────────────────
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// ─── Fetch Data ───────────────────────────────────────────────
async function fetchLocations() {
  try {
    const res = await fetch("public/data/locations.json");
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    state.locations = data;
    state.filtered = data;
    return data;
  } catch (err) {
    console.warn("Fetch gagal, menggunakan data fallback:", err);
    // Fallback jika fetch gagal (misal file:// protocol)
    return [];
  }
}

// ─── MAP ─────────────────────────────────────────────────────
function initMap() {
  state.map = L.map("map", {
    center: [-7.7108, 108.4875],
    zoom: 14,
    zoomControl: false,
  });

  L.control.zoom({ position: "bottomright" }).addTo(state.map);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(state.map);

  setTimeout(() => state.map.invalidateSize(), 200);
}

function createCustomIcon(category) {
  const cfg = getCatConfig(category);
  const html = `
    <div class="custom-marker" style="background:${cfg.color};">
      <span>${cfg.icon}</span>
    </div>
    <div class="custom-marker-tail" style="border-top-color:${cfg.color};"></div>
  `;
  return L.divIcon({
    html: `<div class="custom-marker-wrap">${html}</div>`,
    className: "",
    iconSize: [42, 54],
    iconAnchor: [21, 54],
    popupAnchor: [0, -54],
  });
}

function renderMarkers(locations) {
  // Clear existing
  Object.values(state.markers).forEach((m) => m.remove());
  state.markers = {};

  locations.forEach((loc) => {
    const icon = createCustomIcon(loc.category);
    const cfg = getCatConfig(loc.category);
    const marker = L.marker([loc.lat, loc.lng], { icon })
      .addTo(state.map)
      .bindPopup(createPopupContent(loc), {
        maxWidth: 280,
        className: "custom-popup",
      });

    marker.on("click", () => {
      highlightCard(loc.slug);
    });

    marker.getPopup().on("add", () => {
      const btn = document.querySelector(
        `.popup-detail-btn[data-slug="${loc.slug}"]`,
      );
      if (btn) btn.addEventListener("click", () => openModal(loc.slug));
    });

    state.markers[loc.slug] = marker;
  });
}

function createPopupContent(loc) {
  const cfg = getCatConfig(loc.category);
  return `
    <div class="popup-card">
      <div class="popup-img-wrap">
        <img src="${loc.thumbnail}" alt="${loc.name}" onerror="this.src='https://via.placeholder.com/280x120?text=Foto'"/>
        <span class="popup-badge" style="background:${cfg.bg};color:${cfg.color};">${cfg.icon} ${loc.category}</span>
      </div>
      <div class="popup-body">
        <h3>${loc.name}</h3>
        <p>${loc.description.slice(0, 90)}…</p>
        <button class="popup-detail-btn" data-slug="${loc.slug}">Lihat Detail →</button>
      </div>
    </div>
  `;
}

// ─── SIDEBAR LIST ─────────────────────────────────────────────
function renderList(locations) {
  const container = document.getElementById("location-list");
  const emptyState = document.getElementById("empty-state");

  if (!locations.length) {
    container.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  container.innerHTML = locations
    .map((loc) => {
      const cfg = getCatConfig(loc.category);
      return `
      <article
        class="loc-card"
        data-slug="${loc.slug}"
        tabindex="0"
        role="button"
        aria-label="Lihat detail ${loc.name}"
        onclick="handleCardClick('${loc.slug}')"
        onkeydown="if(event.key==='Enter')handleCardClick('${loc.slug}')"
      >
        <div class="loc-card-thumb">
          <img src="${loc.thumbnail}" alt="Foto ${loc.name}" loading="lazy"
            onerror="this.src='https://via.placeholder.com/120x80?text=Foto'"/>
        </div>
        <div class="loc-card-body">
          <span class="loc-badge" style="background:${cfg.bg};color:${cfg.color};">${cfg.icon} ${loc.category}</span>
          <h3 class="loc-card-title">${loc.name}</h3>
          <p class="loc-card-addr">📍 ${loc.address.split(",")[0]}</p>
        </div>
      </article>
    `;
    })
    .join("");
}

function handleCardClick(slug) {
  highlightCard(slug);
  const loc = state.locations.find((l) => l.slug === slug);
  if (loc && state.markers[slug]) {
    state.map.flyTo([loc.lat, loc.lng], 16, { animate: true, duration: 0.8 });
    setTimeout(() => state.markers[slug].openPopup(), 900);
  }
  openModal(slug);
}

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

// ─── FILTER & SEARCH ──────────────────────────────────────────
function applyFilter() {
  const q = state.searchQuery.toLowerCase();
  const cat = state.activeCategory;

  state.filtered = state.locations.filter((loc) => {
    const matchSearch =
      !q ||
      loc.name.toLowerCase().includes(q) ||
      loc.category.toLowerCase().includes(q) ||
      loc.address.toLowerCase().includes(q) ||
      loc.tags.some((t) => t.toLowerCase().includes(q));
    const matchCat = cat === "Semua" || loc.category === cat;
    return matchSearch && matchCat;
  });

  renderList(state.filtered);
  renderMarkers(state.filtered);
}

function buildCategoryFilters() {
  const container = document.getElementById("category-filters");
  const categories = ["Semua", ...Object.keys(CATEGORY_CONFIG)];

  container.innerHTML = categories
    .map((cat) => {
      const cfg = getCatConfig(cat);
      const isAll = cat === "Semua";
      return `
      <button
        class="cat-filter-btn ${isAll ? "active" : ""}"
        data-cat="${cat}"
        style="${isAll ? "--cat-color:#4B2E83" : `--cat-color:${cfg.color}`}"
        onclick="setCategory('${cat}')"
      >
        ${isAll ? "🗺️ Semua" : `${cfg.icon} ${cat}`}
      </button>
    `;
    })
    .join("");
}

window.setCategory = function (cat) {
  state.activeCategory = cat;
  document.querySelectorAll(".cat-filter-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.cat === cat);
  });
  applyFilter();
};

// ─── MODAL ───────────────────────────────────────────────────
function openModal(slug) {
  const loc = state.locations.find((l) => l.slug === slug);
  if (!loc) return;

  const cfg = getCatConfig(loc.category);
  const modal = document.getElementById("detail-modal");
  const content = document.getElementById("modal-content");

  content.innerHTML = `
    <div class="modal-header" style="background:linear-gradient(135deg,#4B2E83,#2d1a52);">
      <div class="modal-header-content">
        <span class="modal-badge" style="background:rgba(255,255,255,0.15);color:white;">${cfg.icon} ${loc.category}</span>
        <h2 class="modal-title">${loc.name}</h2>
        <p class="modal-addr">📍 ${loc.address}</p>
      </div>
      <button id="modal-close" aria-label="Tutup modal" onclick="closeModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="modal-img-wrap">
        <img src="${loc.photo}" alt="Foto ${loc.name}" loading="lazy"
          onerror="this.src='https://via.placeholder.com/800x400?text=Foto+Lokasi'"/>
      </div>
      <div class="modal-section">
        <h3 class="modal-section-title">Deskripsi</h3>
        <p class="modal-desc">${loc.description}</p>
      </div>
      <div class="modal-meta-grid">
        <div class="modal-meta-item">
          <span class="meta-label">📅 Tanggal Survei</span>
          <span class="meta-value">${formatDate(loc.date)}</span>
        </div>
        <div class="modal-meta-item">
          <span class="meta-label">👤 Kontributor</span>
          <span class="meta-value">${loc.contributor}</span>
        </div>
        <div class="modal-meta-item" style="grid-column:1/-1;">
          <span class="meta-label">🏷️ Tag</span>
          <div class="meta-tags">
            ${loc.tags.map((t) => `<span class="tag-chip" style="background:${cfg.bg};color:${cfg.color};">${t}</span>`).join("")}
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <a href="${loc.mapsUrl}" target="_blank" rel="noopener" class="btn-maps">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          Buka di Google Maps
        </a>
        <button class="btn-navigate" onclick="navigateTo(${loc.lat},${loc.lng},'${loc.slug}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          Navigasi
        </button>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  requestAnimationFrame(() => {
    modal.querySelector(".modal-box").classList.add("modal-enter");
  });

  // Hash routing
  history.pushState(null, "", `#lokasi=${slug}`);
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = document.getElementById("detail-modal");
  const box = modal.querySelector(".modal-box");
  box.classList.remove("modal-enter");
  box.classList.add("modal-leave");
  setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    box.classList.remove("modal-leave");
    document.body.style.overflow = "";
    history.pushState(null, "", window.location.pathname);
  }, 200);
}

window.openModal = openModal;
window.closeModal = closeModal;
window.handleCardClick = handleCardClick;

window.navigateTo = function (lat, lng, slug) {
  state.map.flyTo([lat, lng], 17, { animate: true, duration: 1 });
  closeModal();
  setTimeout(() => {
    if (state.markers[slug]) state.markers[slug].openPopup();
  }, 1200);
};

// ─── HASH ROUTING ─────────────────────────────────────────────
function handleHash() {
  const hash = window.location.hash;
  if (hash.startsWith("#lokasi=")) {
    const slug = hash.replace("#lokasi=", "");
    if (state.locations.length) {
      openModal(slug);
      highlightCard(slug);
    } else {
      state._pendingSlug = slug;
    }
  }
}

// ─── NAVBAR ───────────────────────────────────────────────────
function initNavbar() {
  const burger = document.getElementById("burger-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  let open = false;

  burger.addEventListener("click", () => {
    open = !open;
    mobileMenu.classList.toggle("hidden", !open);
    burger.setAttribute("aria-expanded", open);
    burger.innerHTML = open
      ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
      : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
  });

  // Scroll header shrink
  const header = document.getElementById("main-header");
  window.addEventListener("scroll", () => {
    header.classList.toggle("header-scrolled", window.scrollY > 60);
  });
}

// ─── KEYBOARD ─────────────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const modal = document.getElementById("detail-modal");
    if (!modal.classList.contains("hidden")) closeModal();
  }
});

// Backdrop click
document.addEventListener("click", (e) => {
  const modal = document.getElementById("detail-modal");
  if (e.target === modal) closeModal();
});

// ─── SCROLL TO MAP ────────────────────────────────────────────
window.scrollToMap = function () {
  document.getElementById("peta").scrollIntoView({ behavior: "smooth" });
};

// ─── INIT ─────────────────────────────────────────────────────
async function init() {
  initNavbar();
  initMap();
  buildCategoryFilters();

  const locations = await fetchLocations();

  // Fallback data jika fetch gagal
  if (!locations.length) {
    document.getElementById("map-loading").innerHTML = `
      <p style="color:#6B7280;font-size:0.875rem;">⚠️ Data tidak dapat dimuat. Pastikan server berjalan dengan benar.</p>
    `;
    return;
  }

  document.getElementById("map-loading").classList.add("hidden");
  document.getElementById("location-count").textContent =
    `${locations.length} lokasi`;

  renderMarkers(locations);
  renderList(locations);
  handleHash();

  if (state._pendingSlug) {
    openModal(state._pendingSlug);
    highlightCard(state._pendingSlug);
    delete state._pendingSlug;
  }

  // Search
  const searchInput = document.getElementById("search-input");
  searchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    applyFilter();
  });

  // Hash changes
  window.addEventListener("hashchange", handleHash);
}

document.addEventListener("DOMContentLoaded", init);
