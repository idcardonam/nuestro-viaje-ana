(function () {
  const STORAGE_KEY = "viaje-ana-2026";
  const SITE_URL = "https://idcardonam.github.io/nuestro-viaje-ana/";

  const state = loadState();
  let heartTaps = 0;
  let heartTimer = null;
  let geoWatchId = null;

  const LOCATIONS = [
    { id: "bga", name: "Bucaramanga", lat: 7.1254, lng: -73.1198, radius: 25 },
    { id: "cur", name: "Curumaní", lat: 9.1859, lng: -75.9197, radius: 20 },
    { id: "baq", name: "Barranquilla", lat: 10.9685, lng: -74.7813, radius: 25 },
    { id: "ctg", name: "Cartagena", lat: 10.391, lng: -75.4794, radius: 25 },
    { id: "smr", name: "Santa Marta", lat: 11.2408, lng: -74.199, radius: 25 }
  ];

  const DAY_LOCATIONS = {
    "day-27": "bga",
    "day-28": "cur",
    "day-29": "baq",
    "day-30": "ctg",
    "day-01": "ctg",
    "day-02": "smr",
    "day-03": "cur"
  };

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { checks: {}, photos: {}, secretSeen: false };
    } catch {
      return { checks: {}, photos: {}, secretSeen: false };
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateGlobalProgress();
  }

  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  function $$(sel, root = document) {
    return [...root.querySelectorAll(sel)];
  }

  function initTabs() {
    $$(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const name = tab.dataset.tab;
        $$(".tab").forEach((t) => t.classList.toggle("active", t === tab));
        $$(".panel").forEach((p) => p.classList.toggle("active", p.id === "panel-" + name));
      });
    });
  }

  function initStops() {
    $$(".stop-head").forEach((head) => {
      head.addEventListener("click", () => {
        head.closest(".stop").classList.toggle("open");
      });
    });
    const first = $(".stop");
    if (first) first.classList.add("open");
  }

  function initChecks() {
    $$(".check-item").forEach((item) => {
      const id = item.dataset.id;
      const box = $(".check-box", item);
      const photoBtn = $(".check-photo-btn", item);

      if (state.checks[id]) {
        item.classList.add("done");
        box.classList.add("done");
      }

      if (state.photos[id]) {
        renderPhotoPreview(item, state.photos[id]);
        photoBtn?.classList.add("has-photo");
      }

      box?.addEventListener("click", () => toggleCheck(id, item, box));
      photoBtn?.addEventListener("click", () => openPhotoPicker(id, item, photoBtn));
    });

    updateStopProgress();
    updateGlobalProgress();
  }

  function toggleCheck(id, item, box) {
    const done = !state.checks[id];
    state.checks[id] = done;
    item.classList.toggle("done", done);
    box.classList.toggle("done", done);
    saveState();
    updateStopProgress();

    if (done) {
      maybeCelebrate();
      maybeUnlockSecret();
    }
  }

  function openPhotoPicker(id, item, photoBtn) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        state.photos[id] = reader.result;
        state.checks[id] = true;
        item.classList.add("done");
        $(".check-box", item)?.classList.add("done");
        renderPhotoPreview(item, reader.result);
        photoBtn?.classList.add("has-photo");
        saveState();
        updateStopProgress();
        showToast("📸 Foto guardada. Esa va directo al álbum del viaje.");
        maybeCelebrate();
        maybeUnlockSecret();
      };
      reader.readAsDataURL(file);
    });
    input.click();
  }

  function renderPhotoPreview(item, src) {
    let wrap = $(".check-preview", item);
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "check-preview";
      item.appendChild(wrap);
    }
    wrap.innerHTML = `<img src="${src}" alt="Recuerdo del viaje">`;
  }

  function updateStopProgress() {
    $$(".stop").forEach((stop) => {
      const items = $$(".check-item", stop);
      const done = items.filter((i) => state.checks[i.dataset.id]).length;
      const el = $(".stop-progress", stop);
      if (el) el.textContent = done + "/" + items.length;
    });
  }

  function updateGlobalProgress() {
    const items = $$(".check-item");
    const total = items.length;
    const done = items.filter((i) => state.checks[i.dataset.id]).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const fill = $(".progress-fill");
    const label = $(".progress-count");
    if (fill) fill.style.width = pct + "%";
    if (label) label.textContent = done + " de " + total + " recuerdos";
  }

  function maybeCelebrate() {
    const items = $$(".check-item");
    const done = items.filter((i) => state.checks[i.dataset.id]).length;
    if (done === 5 || done === 15 || done === totalChecks()) {
      launchConfetti();
    }
  }

  function totalChecks() {
    return $$(".check-item").length;
  }

  function launchConfetti() {
    const colors = ["#f472b6", "#2dd4bf", "#e8c17a", "#a78bfa", "#ff6b6b"];
    for (let i = 0; i < 40; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 0.5 + "s";
      piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 3000);
    }
  }

  function initHeartSecret() {
    const heart = $(".hero-heart");
    if (!heart) return;
    heart.addEventListener("click", () => {
      heartTaps++;
      heart.classList.add("pulse");
      setTimeout(() => heart.classList.remove("pulse"), 600);
      clearTimeout(heartTimer);
      heartTimer = setTimeout(() => { heartTaps = 0; }, 1200);
      if (heartTaps >= 3) {
        heartTaps = 0;
        showSecret();
      }
    });
  }

  function maybeUnlockSecret() {
    const items = $$(".check-item");
    const done = items.filter((i) => state.checks[i.dataset.id]).length;
    const threshold = Math.ceil(items.length * 0.35);
    if (!state.secretSeen && done >= threshold) showSecret();
  }

  function showSecret() {
    if (state.secretSeen) return;
    state.secretSeen = true;
    saveState();
    $(".modal-overlay")?.classList.add("show");
    launchConfetti();
  }

  function initModal() {
    $(".modal-close")?.addEventListener("click", () => {
      $(".modal-overlay")?.classList.remove("show");
    });
    $(".modal-overlay")?.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-overlay")) {
        e.target.classList.remove("show");
      }
    });
  }

  function showToast(msg) {
    const toast = $(".toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 4000);
  }

  function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function initPlanBadges() {
    const today = new Date();
    $$(".day-card").forEach((card) => {
      const dateStr = card.dataset.date;
      if (!dateStr) return;
      const cardDate = new Date(dateStr + "T12:00:00");
      const badge = $(".day-badge", card);
      if (!badge) return;

      const diff = Math.floor((cardDate - today) / 86400000);
      card.classList.remove("near");
      badge.className = "day-badge";

      if (diff < 0) {
        badge.textContent = "Hecho";
        badge.classList.add("badge-done");
      } else if (diff === 0) {
        badge.textContent = "Hoy";
        badge.classList.add("badge-today");
      } else if (diff === 1) {
        badge.textContent = "Mañana";
        badge.classList.add("badge-soon");
      } else {
        badge.textContent = "Pronto";
        badge.classList.add("badge-soon");
      }
    });
  }

  function initGeo() {
    const btn = $(".geo-btn");
    if (!btn) return;

    btn.addEventListener("click", () => {
      if (!navigator.geolocation) {
        showToast("Tu celular no soporta ubicación. Igual vamos a disfrutar todo.");
        return;
      }

      if (geoWatchId !== null) {
        navigator.geolocation.clearWatch(geoWatchId);
        geoWatchId = null;
        btn.classList.remove("active");
        btn.innerHTML = "📍 Activar alertas por ubicación";
        showToast("Alertas desactivadas.");
        return;
      }

      btn.classList.add("active");
      btn.innerHTML = "📍 Alertas activas — cerca de cada destino";

      geoWatchId = navigator.geolocation.watchPosition(
        (pos) => checkNearby(pos.coords.latitude, pos.coords.longitude),
        () => showToast("No pude leer tu ubicación. Revisa permisos del navegador."),
        { enableHighAccuracy: false, maximumAge: 120000, timeout: 15000 }
      );
    });
  }

  let lastNearId = null;

  function checkNearby(lat, lng) {
    for (const loc of LOCATIONS) {
      const dist = haversine(lat, lng, loc.lat, loc.lng);
      if (dist <= loc.radius) {
        if (lastNearId !== loc.id) {
          lastNearId = loc.id;
          highlightPlanDays(loc.id);
          showToast("🌴 Llegamos a " + loc.name + ". Mira el Plan — hay recuerdos esperando.");
        }
        return;
      }
    }
    lastNearId = null;
  }

  function highlightPlanDays(locId) {
    $$(".day-card").forEach((card) => {
      const dayId = card.id;
      const match = DAY_LOCATIONS[dayId] === locId;
      card.classList.toggle("near", match);
      if (match) {
        const badge = $(".day-badge", card);
        if (badge) {
          badge.textContent = "¡Estás aquí!";
          badge.className = "day-badge badge-near";
        }
      }
    });
  }

  window.ViajeApp = {
    reset: function () {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    },
    exportData: function () {
      return JSON.stringify(state, null, 2);
    },
    siteUrl: SITE_URL
  };

  initTabs();
  initStops();
  initChecks();
  initHeartSecret();
  initModal();
  initPlanBadges();
  initGeo();
})();
