/* Shelfmark client: localStorage reading tracker, shelf page, share card, analytics, email capture. */
(function () {
  "use strict";
  var KEY = "shelfmark_read_v1";

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }

  // ---- hide covers that fail to load ----
  document.addEventListener("error", function (e) {
    var t = e.target;
    if (t && t.tagName === "IMG" && t.hasAttribute("width")) t.remove();
  }, true);

  // ---- analytics (first-party, cookie-less) ----
  try {
    var p = location.pathname;
    if (p === "/search" && location.search) p += location.search.slice(0, 120);
    if (navigator.sendBeacon) navigator.sendBeacon("/api/hit", p);
    else fetch("/api/hit", { method: "POST", body: p, keepalive: true });
  } catch (e) {}

  // ---- one-time id migration (catalog re-imports can renumber book ids) ----
  var MIG = "shelfmark_mig_v2";
  try {
    if (!localStorage.getItem(MIG)) {
      var oldIds = Object.keys(load());
      if (!oldIds.length) {
        localStorage.setItem(MIG, "1");
      } else {
        fetch("/api/migrate-ids", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ids: oldIds }),
        }).then(function (r) { return r.ok ? r.json() : null; }).then(function (map) {
          if (!map) return;
          var d = load();
          var changed = false;
          Object.keys(map).forEach(function (oldId) {
            var newId = String(map[oldId]);
            if (d[oldId] && !d[newId]) { d[newId] = d[oldId]; delete d[oldId]; changed = true; }
          });
          if (changed) save(d);
          localStorage.setItem(MIG, "1");
          if (changed) location.reload();
        }).catch(function () {});
      }
    }
  } catch (e) {}

  // ---- series checkboxes ----
  var data = load();

  function updateSeriesUI(slug) {
    var list = document.querySelector('[data-series="' + slug + '"]');
    if (!list) return;
    var boxes = list.querySelectorAll("input[data-book]");
    var read = 0;
    boxes.forEach(function (b) { if (b.checked) read++; });
    var pct = boxes.length ? Math.round((read / boxes.length) * 100) : 0;
    document.querySelectorAll('[data-progress-bar="' + slug + '"]').forEach(function (el) { el.style.width = pct + "%"; });
    document.querySelectorAll('[data-progress-label="' + slug + '"]').forEach(function (el) {
      el.textContent = read ? read + " of " + boxes.length + " read (" + pct + "%)" : "";
    });
    list.querySelectorAll(".up-next-badge").forEach(function (el) { el.remove(); });
    if (read > 0 && read < boxes.length) {
      for (var i = 0; i < boxes.length; i++) {
        if (!boxes[i].checked) {
          var title = boxes[i].parentElement.querySelector(".font-medium");
          if (title) {
            var badge = document.createElement("span");
            badge.className = "up-next-badge";
            badge.textContent = "Up next";
            title.insertAdjacentElement("afterend", badge);
          }
          break;
        }
      }
    }
  }

  document.querySelectorAll("ol[data-series]").forEach(function (list) {
    var slug = list.getAttribute("data-series");
    var seriesName = list.getAttribute("data-series-name") || slug;
    list.querySelectorAll("input[data-book]").forEach(function (box) {
      var id = box.getAttribute("data-book");
      if (data[id]) box.checked = true;
      box.addEventListener("change", function () {
        var d = load();
        if (box.checked) {
          d[id] = { t: Date.now(), title: box.getAttribute("data-title"), series: seriesName, slug: slug };
        } else {
          delete d[id];
        }
        save(d);
        data = d;
        updateSeriesUI(slug);
      });
    });
    updateSeriesUI(slug);
  });

  // progress bars on card grids (series cards elsewhere) — computed only for lists present.

  // ---- share button ----
  document.querySelectorAll("[data-share]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var payload = { title: btn.getAttribute("data-share-title") || document.title, url: location.href };
      if (navigator.share) {
        navigator.share(payload).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(location.href).then(function () {
          var old = btn.textContent;
          btn.textContent = "Link copied ✓";
          setTimeout(function () { btn.textContent = old; }, 2000);
        }).catch(function () {});
      }
    });
  });

  // ---- email capture ----
  document.querySelectorAll("form[data-subscribe]").forEach(function (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var input = form.querySelector('input[type="email"]');
      var btn = form.querySelector("button");
      fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: input.value, source: location.pathname }),
      }).then(function (r) {
        btn.textContent = r.ok ? "Subscribed ✓" : "Try again";
        if (r.ok) {
          input.value = "";
          var note = document.createElement("p");
          note.className = "text-xs text-amber-accent mt-1 w-full";
          note.textContent = "Thanks! We\u2019ll email you when tracked series get new releases.";
          form.appendChild(note);
        }
      }).catch(function () { btn.textContent = "Try again"; });
    });
  });

  // ---- shelf page ----
  var root = document.getElementById("shelf-root");
  if (root) {
    var entries = Object.keys(data).map(function (k) { var e = data[k]; e.id = k; return e; });
    if (!entries.length) {
      root.innerHTML = '<div class="rounded-2xl bg-white border border-ink-200 p-8 text-center"><p class="font-display font-semibold text-xl text-ink-900">Your shelf is empty</p><p class="mt-2 text-ink-700">Find a series and tick off the books you\u2019ve read \u2014 they\u2019ll show up here.</p><p class="mt-4"><a href="/series" class="rounded-full bg-ink-900 text-ink-50 px-5 py-2.5 text-sm font-semibold">Browse series</a></p></div>';
    } else {
      var bySeries = {};
      entries.forEach(function (e) {
        var key = e.slug || e.series || "other";
        (bySeries[key] = bySeries[key] || { name: e.series || key, slug: e.slug, items: [] }).items.push(e);
      });
      var yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
      var thisYear = entries.filter(function (e) { return e.t > 1e12 && e.t >= yearStart; }).length;
      var topSeries = null;
      Object.keys(bySeries).forEach(function (k) {
        if (!topSeries || bySeries[k].items.length > topSeries.items.length) topSeries = bySeries[k];
      });
      function statCard(num, label) {
        return '<div class="rounded-2xl bg-white border border-ink-200 p-4 text-center"><p class="font-display font-bold text-2xl text-ink-900">' + num + '</p><p class="text-xs text-ink-700/80 mt-1">' + label + "</p></div>";
      }
      var html = '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">' +
        statCard(entries.length, "books read") +
        statCard(Object.keys(bySeries).length, "series followed") +
        statCard(thisYear, "read in " + new Date().getFullYear()) +
        statCard(topSeries ? escapeHtml(topSeries.name.length > 22 ? topSeries.name.slice(0, 21) + "…" : topSeries.name) : "—", "most-read series") +
        "</div>";
      Object.keys(bySeries).forEach(function (k) {
        var g = bySeries[k];
        g.items.sort(function (a, b) { return b.t - a.t; });
        html += '<section class="mb-6"><h2 class="font-display font-semibold text-xl text-ink-900">' +
          (g.slug ? '<a class="hover:text-amber-accent" href="' + (g.slug.indexOf("standalone-") === 0 ? "/authors/" + g.slug.slice(11) : "/series/" + g.slug) + '">' : "") + escapeHtml(g.name) + (g.slug ? "</a>" : "") +
          ' <span class="text-sm font-sans font-normal text-ink-700/75">' + g.items.length + " read</span></h2><ul class=\"mt-2 space-y-1\">" +
          g.items.map(function (e) {
            return '<li class="flex items-center justify-between rounded-xl bg-white border border-ink-200 px-4 py-2.5 text-sm"><span class="font-medium text-ink-900">' + escapeHtml(e.title || e.id) + '</span><span class="text-ink-700/75">' + (e.t > 1e12 ? new Date(e.t).toLocaleDateString() : "") + "</span></li>";
          }).join("") + "</ul></section>";
      });
      root.innerHTML = html;
    }

    var exportBtn = document.getElementById("export-btn");
    if (exportBtn) exportBtn.addEventListener("click", function () {
      var blob = new Blob([JSON.stringify(load(), null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "shelfmark-export.json";
      a.click();
    });

    var importBtn = document.getElementById("import-btn");
    var importFile = document.getElementById("import-file");
    var importStatus = document.getElementById("import-status");
    if (importBtn && importFile) {
      importBtn.addEventListener("click", function () { importFile.click(); });
      importFile.addEventListener("change", function () {
        var f = importFile.files && importFile.files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          try {
            var incoming = JSON.parse(String(reader.result));
            if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) throw new Error("bad");
            var cur = load();
            var added = 0;
            Object.keys(incoming).forEach(function (k) {
              var e = incoming[k];
              if (e && typeof e === "object" && typeof e.title === "string") {
                if (!cur[k]) added++;
                cur[k] = { t: typeof e.t === "number" ? e.t : Date.now(), title: e.title, series: typeof e.series === "string" ? e.series : "", slug: typeof e.slug === "string" ? e.slug : "" };
              }
            });
            localStorage.setItem(KEY, JSON.stringify(cur));
            if (importStatus) importStatus.textContent = "Imported " + added + " new book" + (added === 1 ? "" : "s") + " ✓ Reloading…";
            setTimeout(function () { location.reload(); }, 1600);
          } catch (err) {
            if (importStatus) importStatus.textContent = "That file doesn't look like a Shelfmark export.";
          }
        };
        reader.readAsText(f);
      });
    }

    var shareBtn = document.getElementById("share-card-btn");
    if (shareBtn) shareBtn.addEventListener("click", function () { drawCard(entries); });
  }

  function drawCard(entries) {
    var canvas = document.getElementById("share-canvas");
    var ctx = canvas.getContext("2d");
    var W = canvas.width, H = canvas.height;
    ctx.fillStyle = "#1a1916"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#c8842c"; ctx.fillRect(0, 0, W, 14);
    ctx.fillStyle = "#f7f6f3";
    ctx.font = "700 84px Georgia, serif";
    ctx.fillText("My Reading Card", 80, 190);
    ctx.font = "500 44px Georgia, serif";
    ctx.fillStyle = "#c8842c";
    ctx.fillText(new Date().toLocaleDateString(undefined, { year: "numeric", month: "long" }), 80, 270);
    var bySeries = {};
    entries.forEach(function (e) { bySeries[e.series || "?"] = (bySeries[e.series || "?"] || 0) + 1; });
    ctx.fillStyle = "#f7f6f3";
    ctx.font = "700 160px Georgia, serif";
    ctx.fillText(String(entries.length), 80, 480);
    ctx.font = "400 44px Arial, sans-serif";
    ctx.fillStyle = "#d9d5c8";
    ctx.fillText("books read \u00b7 " + Object.keys(bySeries).length + " series", 80, 560);
    var top = Object.keys(bySeries).map(function (k) { return [k, bySeries[k]]; })
      .sort(function (a, b) { return b[1] - a[1]; }).slice(0, 6);
    var y = 680;
    ctx.font = "400 40px Arial, sans-serif";
    top.forEach(function (t) {
      ctx.fillStyle = "#c8842c"; ctx.fillText("\u25a0", 80, y);
      ctx.fillStyle = "#f7f6f3";
      var name = t[0].length > 34 ? t[0].slice(0, 33) + "\u2026" : t[0];
      ctx.fillText(name + "  \u00b7  " + t[1], 140, y);
      y += 78;
    });
    ctx.fillStyle = "#d9d5c8";
    ctx.font = "400 36px Arial, sans-serif";
    ctx.fillText("shelfmark.zalize.com", 80, H - 80);
    var a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "shelfmark-reading-card.png";
    a.click();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
})();
