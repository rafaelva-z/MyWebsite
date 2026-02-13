(() => {
  const gallery = document.getElementById("gallery");
  if (!gallery) return;

  // ====== CONFIG ======
  const CLOUD_NAME = "dcdjuwoi4";
  const DEFAULT_FETCH = "data/photos.json";

  const cldUrl = (publicId, transforms = "") => {
    const t = transforms ? `${transforms}/` : "";
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${t}${publicId}`;
  };

  const thumbUrl = (publicId) => cldUrl(publicId, "f_auto,q_auto,w_900,c_limit");
  const fullUrl = (publicId) => cldUrl(publicId, "f_auto,q_auto,w_2200,c_limit");

  const shuffleInPlace = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };

  // ---- Renderers ----
  const makeImageItem = ({ id, alt, caption }) => {
    const fig = document.createElement("figure");

    const img = document.createElement("img");
    img.className = "thumb";
    img.src = thumbUrl(id);
    img.alt = alt || "";
    img.loading = "lazy";
    img.dataset.full = fullUrl(id);
    img.dataset.caption = caption || "";

    const cap = document.createElement("figcaption");
    cap.textContent = caption || "";

    fig.appendChild(img);
    fig.appendChild(cap);
    return fig;
  };

  const makeTextItem = ({ text }) => {
    const h3 = document.createElement("h3");
    h3.className = "gallery-message";

    // Support either:
    // - text as an array of lines (recommended)
    // - text as a single string
    if (Array.isArray(text)) {
      h3.innerHTML = text.map(escapeHtml).join("<br><br>");
    } else {
      h3.textContent = String(text ?? "");
    }

    return h3;
  };

  // Basic HTML escape for safety (so your JSON can’t accidentally inject HTML)
  const escapeHtml = (s) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const renderItem = (item) => {
    if (!item || typeof item !== "object") return null;

    if (item.type === "text") return makeTextItem(item);
    if (item.type === "image") return makeImageItem(item);

    // default fallback: treat as image if it has id
    if (item.id) return makeImageItem({ ...item, type: "image" });

    return null;
  };

  const applyImperfection = () => {
    // rotate figures (and optionally text blocks too)
    const nodes = gallery.querySelectorAll("figure, .gallery-message");
    nodes.forEach((node) => {
      const rotation = Math.random() - 0.5; // ~±0.5deg
      const yOffset = Math.random() * 6 - 3; // ±3px
      node.style.transform = `rotate(${rotation}deg) translateY(${yOffset}px)`;
    });
  };

  const setupLightbox = () => {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightboxImg");
    const lightboxCaption = document.getElementById("lightboxCaption");

    const thumbs = Array.from(document.querySelectorAll(".thumb"));
    let currentIndex = -1;

    const openAt = (index) => {
      currentIndex = index;
      const el = thumbs[currentIndex];

      lightboxImg.src = el.dataset.full || el.src;
      lightboxImg.alt = el.alt || "";
      lightboxCaption.textContent = el.dataset.caption || "";

      lightbox.classList.add("open");
      document.body.style.overflow = "hidden";
    };

    const close = () => {
      lightbox.classList.remove("open");
      document.body.style.overflow = "";
      lightboxImg.src = "";
      currentIndex = -1;
    };

    const next = () => {
      if (currentIndex < 0) return;
      openAt((currentIndex + 1) % thumbs.length);
    };

    const prev = () => {
      if (currentIndex < 0) return;
      openAt((currentIndex - 1 + thumbs.length) % thumbs.length);
    };

    thumbs.forEach((img, idx) => img.addEventListener("click", () => openAt(idx)));

    lightbox.addEventListener("click", () => close());

    window.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    });
  };

  const render = async () => {
    let items;
    try {
      const res = await fetch(DEFAULT_FETCH, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load ${DEFAULT_FETCH}`);
      items = await res.json();
    } catch (err) {
      console.error(err);
      gallery.textContent = "Could not load gallery items.";
      return;
    }

    // Shuffle the mixed list so quotes move too
    shuffleInPlace(items);

    // Render
    const nodes = items.map(renderItem).filter(Boolean);
    nodes.forEach((n) => gallery.appendChild(n));

    applyImperfection();
    setupLightbox();
  };

  render();
})();
