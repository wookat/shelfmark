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
    var refHost = "";
    try {
      if (document.referrer) {
        var rh = new URL(document.referrer).hostname;
        if (rh && rh !== location.hostname) refHost = rh;
      }
    } catch (e2) {}
    var payload = refHost ? p + "\n" + refHost : p;
    if (navigator.sendBeacon) navigator.sendBeacon("/api/hit", payload);
    else fetch("/api/hit", { method: "POST", body: payload, keepalive: true });
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

    var boxes = list.querySelectorAll("input[data-book]");
    if (boxes.length > 1) {
      var controls = document.createElement("div");
      controls.className = "mt-3 flex gap-2 text-xs print:hidden";
      function bulkBtn(label, checked) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = label;
        b.className = "rounded-full bg-white border border-ink-200 px-3 py-1.5 hover:border-amber-accent cursor-pointer";
        b.addEventListener("click", function () {
          var d = load();
          boxes.forEach(function (box) {
            var id = box.getAttribute("data-book");
            box.checked = checked;
            if (checked) {
              if (!d[id]) d[id] = { t: Date.now(), title: box.getAttribute("data-title"), series: seriesName, slug: slug };
            } else {
              delete d[id];
            }
          });
          save(d);
          data = d;
          updateSeriesUI(slug);
        });
        return b;
      }
      controls.appendChild(bulkBtn("Mark all read", true));
      controls.appendChild(bulkBtn("Clear progress", false));
      list.insertAdjacentElement("afterend", controls);
    }
  });

  // ---- homepage "Continue reading" strip (localStorage only) ----
  var contEl = document.getElementById("continue-reading");
  if (contEl) {
    var bySlug = {};
    Object.keys(data).forEach(function (id) {
      var e = data[id];
      if (!e || !e.slug || e.slug.indexOf("standalone-") === 0) return;
      if (!bySlug[e.slug] || e.t > bySlug[e.slug].t) bySlug[e.slug] = { t: e.t, series: e.series, slug: e.slug, n: 0 };
    });
    Object.keys(data).forEach(function (id) {
      var e = data[id];
      if (e && e.slug && bySlug[e.slug]) bySlug[e.slug].n++;
    });
    var recent = Object.keys(bySlug).map(function (k) { return bySlug[k]; })
      .sort(function (a, b) { return b.t - a.t; }).slice(0, 4);
    var heading = "Continue reading";
    if (!recent.length) {
      var savedMap = loadSaved();
      recent = Object.keys(savedMap).map(function (slug) {
        var se = savedMap[slug] || {};
        return { t: se.t || 0, series: se.name, slug: slug, n: 0 };
      }).sort(function (a, b) { return b.t - a.t; }).slice(0, 4);
      heading = "From your saved list";
    }
    if (recent.length) {
      var sec = document.createElement("section");
      sec.className = "mt-8";
      var h2 = document.createElement("h2");
      h2.className = "font-display font-semibold text-2xl text-ink-900";
      h2.textContent = heading;
      sec.appendChild(h2);
      var grid = document.createElement("div");
      grid.className = "grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-4";
      recent.forEach(function (r) {
        var a = document.createElement("a");
        a.href = "/series/" + encodeURIComponent(r.slug);
        a.className = "block rounded-2xl bg-white border border-ink-200 p-4 hover:border-amber-accent transition";
        var name = document.createElement("p");
        name.className = "font-display font-semibold text-ink-900 truncate";
        name.textContent = r.series || r.slug;
        var meta = document.createElement("p");
        meta.className = "text-sm text-ink-700/80 mt-1";
        meta.textContent = r.n ? r.n + " read · pick up where you left off →" : "saved for later · start reading →";
        a.appendChild(name);
        a.appendChild(meta);
        grid.appendChild(a);
      });
      sec.appendChild(grid);
      contEl.appendChild(sec);
    }
  }

  // ---- fill series-card progress bars from localStorage on listing pages ----
  var readsBySlug = {};
  Object.keys(data).forEach(function (id) {
    var e = data[id];
    if (e && e.slug) readsBySlug[e.slug] = (readsBySlug[e.slug] || 0) + 1;
  });
  document.querySelectorAll("[data-progress-bar][data-total]").forEach(function (el) {
    var slug = el.getAttribute("data-progress-bar");
    if (document.querySelector('ol[data-series="' + slug + '"]')) return; // handled by updateSeriesUI
    var total = parseInt(el.getAttribute("data-total"), 10);
    var read = readsBySlug[slug] || 0;
    if (total > 0 && read > 0) el.style.width = Math.min(100, Math.round((read / total) * 100)) + "%";
  });

  // ---- search typeahead ----
  var typeaheadSeq = 0;
  document.querySelectorAll('form[action="/search"]').forEach(function (form) {
    var input = form.querySelector('input[name="q"]');
    if (!input) return;
    form.style.position = "relative";
    var boxId = "suggest-box-" + (++typeaheadSeq);
    input.setAttribute("autocomplete", "off");
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-expanded", "false");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", boxId);
    var box = document.createElement("div");
    box.id = boxId;
    box.className = "absolute left-0 right-0 top-full mt-1 rounded-2xl bg-white border border-ink-200 shadow-lg overflow-hidden hidden z-50 text-left";
    box.setAttribute("role", "listbox");
    form.appendChild(box);
    var items = [];
    var active = -1;
    var timer = null;
    var lastQ = "";
    function close() {
      box.classList.add("hidden");
      box.innerHTML = "";
      items = [];
      active = -1;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    }
    function render(results) {
      if (!results.length) { close(); return; }
      box.innerHTML = "";
      items = results.map(function (r, i) {
        var a = document.createElement("a");
        a.href = r.href;
        a.id = boxId + "-opt-" + i;
        a.className = "block px-4 py-2 text-sm hover:bg-ink-100";
        a.setAttribute("role", "option");
        a.setAttribute("aria-selected", "false");
        a.innerHTML = '<span class="font-medium text-ink-900">' + escapeHtml(r.label) + '</span> <span class="text-ink-700/75 text-xs">' + r.kind + "</span>";
        box.appendChild(a);
        return a;
      });
      active = -1;
      box.classList.remove("hidden");
      input.setAttribute("aria-expanded", "true");
    }
    function highlight(i) {
      items.forEach(function (el, j) {
        el.classList.toggle("bg-ink-100", j === i);
        el.setAttribute("aria-selected", j === i ? "true" : "false");
      });
      active = i;
      if (i >= 0 && items[i]) input.setAttribute("aria-activedescendant", items[i].id);
      else input.removeAttribute("aria-activedescendant");
    }
    input.addEventListener("input", function () {
      var q = input.value.trim();
      if (timer) clearTimeout(timer);
      if (q.length < 2) { close(); return; }
      timer = setTimeout(function () {
        lastQ = q;
        fetch("/api/suggest?q=" + encodeURIComponent(q)).then(function (r) { return r.ok ? r.json() : null; }).then(function (res) {
          if (!res || input.value.trim() !== lastQ) return;
          render(res.results || []);
        }).catch(function () {});
      }, 200);
    });
    input.addEventListener("keydown", function (ev) {
      if (box.classList.contains("hidden")) return;
      if (ev.key === "ArrowDown") { ev.preventDefault(); highlight(Math.min(active + 1, items.length - 1)); }
      else if (ev.key === "ArrowUp") { ev.preventDefault(); highlight(Math.max(active - 1, 0)); }
      else if (ev.key === "Enter" && active >= 0) { ev.preventDefault(); location.href = items[active].href; }
      else if (ev.key === "Escape") { close(); }
    });
    document.addEventListener("click", function (ev) {
      if (!form.contains(ev.target)) close();
    });
  });

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

  // ---- print button ----
  document.querySelectorAll("[data-print]").forEach(function (btn) {
    btn.addEventListener("click", function () { window.print(); });
  });

  // ---- copy list button ----
  document.querySelectorAll("[data-copylist]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var slug = btn.getAttribute("data-copylist");
      var list = document.querySelector('ol[data-series="' + slug + '"]');
      if (!list || !navigator.clipboard) return;
      var name = list.getAttribute("data-series-name") || document.title;
      var lines = [name + " — reading order", ""];
      list.querySelectorAll("input[data-book]").forEach(function (box, i) {
        lines.push((i + 1) + ". " + box.getAttribute("data-title"));
      });
      lines.push("", "via " + location.origin + "/series/" + slug);
      navigator.clipboard.writeText(lines.join("\n")).then(function () {
        var old = btn.textContent;
        btn.textContent = "Copied ✓";
        setTimeout(function () { btn.textContent = old; }, 2000);
      }).catch(function () {});
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
      root.innerHTML = '<div class="rounded-2xl bg-white border border-ink-200 p-8 text-center"><p class="font-display font-semibold text-xl text-ink-900">Your shelf is empty</p><p class="mt-2 text-ink-700">Find a series and tick off the books you\u2019ve read \u2014 they\u2019ll show up here.</p><p class="mt-4"><a href="/series" class="rounded-full bg-ink-900 text-ink-50 px-5 py-2.5 text-sm font-semibold">Browse series</a></p><p class="mt-5 text-sm text-ink-700/75">Popular starts: <a class="text-amber-accent underline" href="/series/discworld">Discworld</a> \u00b7 <a class="text-amber-accent underline" href="/series/mistborn">Mistborn</a> \u00b7 <a class="text-amber-accent underline" href="/series/the-murderbot-diaries">The Murderbot Diaries</a> \u00b7 <a class="text-amber-accent underline" href="/new">New releases</a></p></div>';
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
      var html = '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">' +
        statCard(entries.length, "books read") +
        statCard(Object.keys(bySeries).length, "series followed") +
        statCard(thisYear, "read in " + new Date().getFullYear()) +
        statCard(topSeries ? escapeHtml(topSeries.name.length > 22 ? topSeries.name.slice(0, 21) + "…" : topSeries.name) : "—", "most-read series") +
        "</div>";
      var GOAL_KEY = "shelfmark:goal:" + new Date().getFullYear();
      var goal = parseInt(localStorage.getItem(GOAL_KEY), 10) || 0;
      var goalPct = goal ? Math.min(100, Math.round((thisYear / goal) * 100)) : 0;
      html += '<div class="rounded-2xl bg-white border border-ink-200 p-4 mb-8">' +
        (goal
          ? '<div class="flex items-baseline justify-between gap-3"><p class="text-sm font-medium text-ink-900">' + new Date().getFullYear() + ' reading goal: ' + thisYear + ' of ' + goal + ' books' + (thisYear >= goal ? ' 🎉' : '') + '</p><button type="button" id="goal-edit" class="text-xs text-amber-accent underline cursor-pointer">Edit goal</button></div>' +
            '<div class="mt-2 h-2 rounded-full bg-ink-100 overflow-hidden" role="progressbar" aria-valuenow="' + thisYear + '" aria-valuemin="0" aria-valuemax="' + goal + '" aria-label="Yearly reading goal"><div class="h-full bg-amber-accent rounded-full" style="width:' + goalPct + '%"></div></div>'
          : '<div class="flex items-baseline justify-between gap-3"><p class="text-sm text-ink-700">Set a yearly reading goal to track your pace — stored only in this browser.</p><button type="button" id="goal-edit" class="text-xs rounded-full bg-ink-900 text-ink-50 px-3 py-1.5 font-semibold cursor-pointer">Set goal</button></div>') +
        "</div>";
      // last-12-months reading pace chart (dated entries only)
      var months = [];
      var now = new Date();
      for (var mi = 11; mi >= 0; mi--) {
        var d0 = new Date(now.getFullYear(), now.getMonth() - mi, 1);
        months.push({ y: d0.getFullYear(), m: d0.getMonth(), label: d0.toLocaleDateString(undefined, { month: "short" }), n: 0 });
      }
      var dated = 0;
      entries.forEach(function (e) {
        if (!(e.t > 1e12)) return;
        var dt = new Date(e.t);
        for (var j = 0; j < months.length; j++) {
          if (months[j].y === dt.getFullYear() && months[j].m === dt.getMonth()) { months[j].n++; dated++; break; }
        }
      });
      if (dated) {
        var maxN = months.reduce(function (mx, mo) { return Math.max(mx, mo.n); }, 1);
        html += '<div class="rounded-2xl bg-white border border-ink-200 p-4 mb-8"><p class="text-sm font-medium text-ink-900">Reading pace — last 12 months</p>' +
          '<div class="mt-3 flex items-end gap-1.5 h-24" role="img" aria-label="Books read per month over the last 12 months">' +
          months.map(function (mo) {
            var hpx = mo.n ? Math.max(6, Math.round((mo.n / maxN) * 84)) : 2;
            return '<div class="flex-1 flex flex-col items-center gap-1 min-w-0"><span class="text-[10px] tabular-nums text-ink-700/75">' + (mo.n || "") + '</span><div class="w-full rounded-t ' + (mo.n ? "bg-amber-accent" : "bg-ink-100") + '" style="height:' + hpx + 'px"></div><span class="text-[10px] text-ink-700/75 truncate">' + mo.label + "</span></div>";
          }).join("") + "</div></div>";
      }
      Object.keys(bySeries).map(function (k) {
        var g = bySeries[k];
        g.items.sort(function (a, b) { return b.t - a.t; });
        return g;
      }).sort(function (a, b) { return (b.items[0].t || 0) - (a.items[0].t || 0); }).forEach(function (g) {
        html += '<section class="mb-6"><h2 class="font-display font-semibold text-xl text-ink-900">' +
          (g.slug ? '<a class="hover:text-amber-accent" href="' + (g.slug.indexOf("standalone-") === 0 ? "/authors/" + g.slug.slice(11) : "/series/" + g.slug) + '">' : "") + escapeHtml(g.name) + (g.slug ? "</a>" : "") +
          ' <span class="text-sm font-sans font-normal text-ink-700/75">' + g.items.length + ' read</span>' +
          (g.slug && g.slug.indexOf("standalone-") !== 0 ? ' <span class="block sm:inline text-sm font-sans font-normal" data-upnext="' + escapeHtml(g.slug) + '"></span>' : '') +
          '</h2><ul class="mt-2 space-y-1">' +
          g.items.map(function (e) {
            return '<li class="flex items-center justify-between rounded-xl bg-white border border-ink-200 px-4 py-2.5 text-sm"><span class="font-medium text-ink-900">' + escapeHtml(e.title || e.id) + '</span><span class="text-ink-700/75">' + (e.t > 1e12 ? new Date(e.t).toLocaleDateString() : "") + "</span></li>";
          }).join("") + "</ul></section>";
      });
      root.innerHTML = html;

      var goalBtn = document.getElementById("goal-edit");
      if (goalBtn) goalBtn.addEventListener("click", function () {
        var v = prompt("How many books do you want to read in " + new Date().getFullYear() + "?", goal || "24");
        if (v === null) return;
        var n = parseInt(v, 10);
        if (n > 0 && n < 10000) { try { localStorage.setItem(GOAL_KEY, String(n)); } catch (e) {} location.reload(); }
        else if (v.trim() === "0" || v.trim() === "") { try { localStorage.removeItem(GOAL_KEY); } catch (e) {} location.reload(); }
      });

      var slots = Array.prototype.slice.call(root.querySelectorAll("[data-upnext]")).slice(0, 20);
      slots.forEach(function (slot) {
        var slug = slot.getAttribute("data-upnext");
        fetch("/api/series-books/" + encodeURIComponent(slug)).then(function (r) { return r.ok ? r.json() : null; }).then(function (res) {
          if (!res || !res.books) return;
          var next = null;
          for (var i = 0; i < res.books.length; i++) {
            if (!data[String(res.books[i].id)]) { next = res.books[i]; break; }
          }
          if (next) {
            slot.innerHTML = '\u00b7 Up next: <a class="text-amber-accent hover:underline" href="/series/' + escapeHtml(slug) + '">' + escapeHtml(next.title) + "</a>";
          } else if (res.books.length) {
            slot.innerHTML = '<span class="text-ink-700/75">\u00b7 Series complete \ud83c\udf89</span>';
          }
        }).catch(function () {});
      });
    }

    var exportBtn = document.getElementById("export-btn");
    if (exportBtn) exportBtn.addEventListener("click", function () {
      var out = load();
      var savedList = loadSaved();
      if (Object.keys(savedList).length) out = Object.assign({ _saved: savedList }, out);
      var blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "shelfmark-export.json";
      a.click();
    });

    var exportCsvBtn = document.getElementById("export-csv-btn");
    if (exportCsvBtn) exportCsvBtn.addEventListener("click", function () {
      function q(v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }
      var d = load();
      var rows = ["Title,Series,Date Read"];
      Object.keys(d).forEach(function (id) {
        var e = d[id];
        if (!e) return;
        var date = e.t > 1e12 ? new Date(e.t).toISOString().slice(0, 10) : "";
        rows.push([q(e.title), q(e.series), q(date)].join(","));
      });
      var blob = new Blob([rows.join("\r\n")], { type: "text/csv" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "shelfmark-export.csv";
      a.click();
    });

    var clearBtn = document.getElementById("clear-data-btn");
    if (clearBtn) clearBtn.addEventListener("click", function () {
      if (!confirm("Erase all Shelfmark data from this browser (reading progress, saved list, goals)? This cannot be undone.")) return;
      var keys = [];
      for (var ki = 0; ki < localStorage.length; ki++) {
        var kn = localStorage.key(ki);
        if (kn && kn.indexOf("shelfmark") === 0) keys.push(kn);
      }
      keys.forEach(function (kn) { localStorage.removeItem(kn); });
      location.reload();
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
            if (incoming._saved && typeof incoming._saved === "object" && !Array.isArray(incoming._saved)) {
              var curSaved = loadSaved();
              Object.keys(incoming._saved).forEach(function (slug) {
                var se = incoming._saved[slug];
                if (se && typeof se === "object" && typeof se.name === "string" && !curSaved[slug]) {
                  curSaved[slug] = { name: se.name, t: typeof se.t === "number" ? se.t : Date.now() };
                }
              });
              storeSaved(curSaved);
            }
            Object.keys(incoming).forEach(function (k) {
              var e = incoming[k];
              if (k === "_saved") return;
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
    var subline = "books read \u00b7 " + Object.keys(bySeries).length + " series";
    var cardGoal = parseInt(localStorage.getItem("shelfmark:goal:" + new Date().getFullYear()), 10) || 0;
    if (cardGoal) {
      var yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
      var readThisYear = entries.filter(function (e) { return e.t > 1e12 && e.t >= yearStart; }).length;
      subline += " \u00b7 " + new Date().getFullYear() + " goal " + readThisYear + "/" + cardGoal + (readThisYear >= cardGoal ? " \u2713" : "");
    }
    ctx.fillText(subline, 80, 560);
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

  // ---- browser-local "Save for later" list ----
  var SAVED_KEY = "shelfmark_saved_v1";
  function loadSaved() {
    try { return JSON.parse(localStorage.getItem(SAVED_KEY)) || {}; } catch (e) { return {}; }
  }
  function storeSaved(m) { localStorage.setItem(SAVED_KEY, JSON.stringify(m)); }
  var saveBtn = document.querySelector("[data-save-series]");
  if (saveBtn) {
    var savedSlug = saveBtn.getAttribute("data-save-series");
    function paintSaveBtn() {
      var on = !!loadSaved()[savedSlug];
      saveBtn.textContent = on ? "★ Saved for later" : "☆ Save for later";
      saveBtn.setAttribute("aria-pressed", on ? "true" : "false");
    }
    paintSaveBtn();
    saveBtn.addEventListener("click", function () {
      var m = loadSaved();
      if (m[savedSlug]) delete m[savedSlug];
      else m[savedSlug] = { name: saveBtn.getAttribute("data-save-name") || savedSlug, t: Date.now() };
      storeSaved(m);
      paintSaveBtn();
    });
  }
  var savedRoot = document.getElementById("saved-root");
  if (savedRoot) {
    var savedMap = loadSaved();
    var savedSlugs = Object.keys(savedMap).sort(function (a, b) { return savedMap[b].t - savedMap[a].t; });
    if (savedSlugs.length) {
      var sh2 = document.createElement("h2");
      sh2.className = "font-display font-semibold text-2xl text-ink-900";
      sh2.textContent = "Saved for later";
      savedRoot.appendChild(sh2);
      var sgrid = document.createElement("div");
      sgrid.className = "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4";
      savedSlugs.forEach(function (slug) {
        var wrap = document.createElement("div");
        wrap.className = "flex items-center gap-3 rounded-2xl bg-white border border-ink-200 p-4";
        var a = document.createElement("a");
        a.href = "/series/" + encodeURIComponent(slug);
        a.className = "font-display font-semibold text-ink-900 hover:text-amber-accent min-w-0 flex-1 truncate";
        a.textContent = savedMap[slug].name || slug;
        var rm = document.createElement("button");
        rm.type = "button";
        rm.className = "text-sm text-ink-700/75 hover:text-amber-accent shrink-0";
        rm.textContent = "Remove";
        rm.setAttribute("aria-label", "Remove " + (savedMap[slug].name || slug) + " from saved list");
        rm.addEventListener("click", function () {
          var m = loadSaved();
          delete m[slug];
          storeSaved(m);
          wrap.remove();
          if (!sgrid.children.length) savedRoot.replaceChildren();
        });
        wrap.appendChild(a);
        wrap.appendChild(rm);
        sgrid.appendChild(wrap);
      });
      savedRoot.appendChild(sgrid);
    }
  }

  // "/" focuses the header search box (unless typing in a field)
  document.addEventListener("keydown", function (e) {
    if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    var box = document.querySelector('header input[name="q"]');
    if (box) {
      e.preventDefault();
      box.focus();
    }
  });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
})();
