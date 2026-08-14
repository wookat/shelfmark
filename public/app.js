/* Shelfmark client: localStorage reading tracker, shelf page, share card, analytics, email capture. */
(function () {
  "use strict";
  var KEY = "shelfmark_read_v1";

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }

  var srLive = document.createElement("div");
  srLive.id = "sr-live";
  srLive.className = "sr-only";
  srLive.setAttribute("role", "status");
  document.body.appendChild(srLive);

  // ---- hide covers that fail to load ----
  document.addEventListener("error", function (e) {
    var t = e.target;
    if (t && t.tagName === "IMG" && t.hasAttribute("width")) t.remove();
  }, true);

  // ---- analytics (first-party, cookie-less; QA sessions opt out via shelfmark_qa=1) ----
  try {
    if (localStorage.getItem("shelfmark_qa") === "1") throw 0;
    var p = location.pathname;
    if (p === "/search" && location.search) p += location.search.slice(0, 120);
    var refHost = "";
    try {
      if (document.referrer) {
        var rh = new URL(document.referrer).hostname;
        if (rh && rh !== location.hostname) refHost = rh;
      }
    } catch (e2) {}
    // New-vs-returning is a day-aggregate boolean derived from a first-seen date in
    // localStorage; no identifier ever leaves the browser.
    var visit = "";
    try {
      var today = new Date().toISOString().slice(0, 10);
      var first = localStorage.getItem("shelfmark_first_v1");
      if (!first) {
        localStorage.setItem("shelfmark_first_v1", today);
        localStorage.setItem("shelfmark_evday_v1", today);
        visit = "new";
      } else if (localStorage.getItem("shelfmark_evday_v1") !== today) {
        localStorage.setItem("shelfmark_evday_v1", today);
        visit = first < today ? "returning" : "new";
      }
    } catch (e3) {}
    var payload = p + "\n" + refHost + (visit ? "\n" + visit : "");
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

  // ---- first-visit coach mark on series pages (one-time, dismissible) ----
  var TIP_KEY = "shelfmark_tip_track_v1";
  var firstList = document.querySelector("ol[data-series]");
  if (firstList && firstList.querySelectorAll("input[data-book]").length > 1 && !Object.keys(data).length && !localStorage.getItem(TIP_KEY)) {
    var tip = document.createElement("div");
    tip.className = "coach-tip rounded-xl border border-amber-accent/40 bg-white px-4 py-3 text-sm text-ink-700 flex items-start gap-3 mb-3 print:hidden";
    tip.setAttribute("role", "note");
    var tipText = document.createElement("p");
    tipText.className = "min-w-0 flex-1";
    tipText.innerHTML = '<span class="font-medium text-ink-900">New here?</span> Tick the books you\u2019ve read \u2014 your progress is saved privately in this browser, no account needed.';
    var tipClose = document.createElement("button");
    tipClose.type = "button";
    tipClose.className = "shrink-0 text-ink-700/75 hover:text-ink-900 cursor-pointer font-medium";
    tipClose.textContent = "Got it";
    tipClose.setAttribute("aria-label", "Dismiss tip");
    tipClose.addEventListener("click", function () {
      try { localStorage.setItem(TIP_KEY, "1"); } catch (e) {}
      tip.remove();
    });
    tip.appendChild(tipText);
    tip.appendChild(tipClose);
    firstList.insertAdjacentElement("beforebegin", tip);
  }

  // ---- one-time "see it on My Shelf" hint after the very first tick ----
  var HINT_KEY = "shelfmark_hint_shelf_v1";
  function maybeShelfHint(nearEl) {
    if (localStorage.getItem(HINT_KEY)) return;
    try { localStorage.setItem(HINT_KEY, "1"); } catch (e) {}
    try { localStorage.setItem(TIP_KEY, "1"); } catch (e) {}
    var hintHtml = 'First book tracked \u2713 See all your progress on <a href="/shelf" class="text-amber-accent underline font-medium">My Shelf</a>.';
    var tipEl = document.querySelector(".coach-tip");
    if (tipEl) {
      // Swap the message in place so the list below doesn't jump mid-click.
      tipEl.setAttribute("role", "status");
      tipEl.innerHTML = '<p class="min-w-0 flex-1">' + hintHtml + "</p>";
      return;
    }
    var hint = document.createElement("p");
    hint.className = "coach-tip rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-700 mt-3 print:hidden";
    hint.setAttribute("role", "status");
    hint.innerHTML = hintHtml;
    nearEl.insertAdjacentElement("afterend", hint);
    setTimeout(function () { hint.remove(); }, 12000);
  }

  // ---- one-time "back up your shelf" nudge once a real collection has built up ----
  var BACKUP_KEY = "shelfmark_hint_backup_v1";
  function maybeBackupHint(nearEl, count) {
    if (count < 5 || localStorage.getItem(BACKUP_KEY)) return;
    try { localStorage.setItem(BACKUP_KEY, "1"); } catch (e) {}
    // Rendered right under the ticked row so it lands in the viewport even on long series.
    // role="note" lives on an inner div: li itself must stay role-less to keep the ol valid.
    var isLi = nearEl.tagName === "LI";
    var note = document.createElement(isLi ? "li" : "div");
    var body = document.createElement("div");
    body.className = "coach-tip rounded-xl border border-amber-accent/40 bg-white px-4 py-3 text-sm text-ink-700 flex items-start gap-3" + (isLi ? "" : " mt-3");
    body.setAttribute("role", "note");
    note.className = (isLi ? "list-none " : "") + "print:hidden";
    note.appendChild(body);
    var noteText = document.createElement("p");
    noteText.className = "min-w-0 flex-1";
    noteText.innerHTML = "You\u2019ve tracked " + count + " books \u2014 they live only in this browser. <a href=\"/shelf#backup\" class=\"text-amber-accent underline font-medium\">Back up your shelf</a> so a cleared cache or new device can\u2019t lose them.";
    var noteClose = document.createElement("button");
    noteClose.type = "button";
    noteClose.className = "shrink-0 text-ink-700/75 hover:text-ink-900 cursor-pointer font-medium";
    noteClose.textContent = "Got it";
    noteClose.setAttribute("aria-label", "Dismiss backup reminder");
    noteClose.addEventListener("click", function () { note.remove(); });
    body.appendChild(noteText);
    body.appendChild(noteClose);
    nearEl.insertAdjacentElement("afterend", note);
  }

  // ---- "Up next" inline nudge: after a tick, highlight the next unread book ----
  function updateUpNext(list, animate) {
    var items = list.querySelectorAll("input[data-book]");
    if (items.length < 2) return;
    list.querySelectorAll(".up-next-badge").forEach(function (b) { b.remove(); });
    var anyChecked = false, next = null;
    items.forEach(function (box) {
      if (box.checked) { anyChecked = true; }
      else if (!next) { next = box; }
    });
    if (!anyChecked || !next) return;
    var li = next.closest("li");
    if (!li) return;
    var badge = document.createElement("span");
    badge.className = "up-next-badge ml-2 inline-block align-middle rounded-full bg-amber-accent/15 text-amber-accent text-xs font-semibold px-2 py-0.5 whitespace-nowrap";
    badge.textContent = "Up next";
    var title = li.querySelector("a");
    if (title) title.insertAdjacentElement("afterend", badge);
    if (animate) {
      li.classList.remove("up-next-flash");
      void li.offsetWidth;
      li.classList.add("up-next-flash");
      srLive.textContent = "Up next: " + (next.getAttribute("data-title") || "the next book");
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
        var wasEmpty = !Object.keys(d).length;
        if (box.checked) {
          d[id] = { t: Date.now(), title: box.getAttribute("data-title"), series: seriesName, slug: slug };
        } else {
          delete d[id];
        }
        save(d);
        data = d;
        updateSeriesUI(slug);
        updateUpNext(list, box.checked);
        if (box.checked && wasEmpty) maybeShelfHint(list);
        if (box.checked && !wasEmpty) maybeBackupHint(box.closest("li") || list, Object.keys(d).length);
      });
    });
    updateSeriesUI(slug);
    updateUpNext(list, false);

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
          updateUpNext(list, false);
        });
        return b;
      }
      controls.appendChild(bulkBtn("Mark all read", true));
      controls.appendChild(bulkBtn("Clear progress", false));
      list.insertAdjacentElement("afterend", controls);
    }
  });

  var SAVED_KEY = "shelfmark_saved_v1";
  function loadSaved() {
    try { return JSON.parse(localStorage.getItem(SAVED_KEY)) || {}; } catch (e) { return {}; }
  }
  function storeSaved(m) { localStorage.setItem(SAVED_KEY, JSON.stringify(m)); }

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
      else if (ev.key === "Escape") { ev.preventDefault(); close(); }
    });
    document.addEventListener("click", function (ev) {
      if (!form.contains(ev.target)) close();
    });
  });

  // ---- share button ----
  document.querySelectorAll("[data-share]").forEach(function (btn) {
    btn.setAttribute("aria-live", "polite");
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
    btn.setAttribute("aria-live", "polite");
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
          note.textContent = "Almost done \u2014 check your inbox and click the confirmation link.";
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
      root.innerHTML = '<div class="rounded-2xl bg-white border border-ink-200 p-8 text-center"><svg viewBox="0 0 120 64" width="150" height="80" aria-hidden="true" class="mx-auto mb-3 text-ink-700/60"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 54h100"/><rect x="20" y="22" width="9" height="32" rx="1.5"/><rect x="31" y="16" width="9" height="38" rx="1.5"/><path d="M44 54l6-36 9 1.6-6 34.7z"/><rect x="62" y="20" width="9" height="34" rx="1.5"/><rect x="73" y="26" width="9" height="28" rx="1.5"/></g><path d="M89 24h10v22l-5-4.6-5 4.6z" fill="#c98a2e" opacity="0.85"/></svg><p class="font-display font-semibold text-xl text-ink-900">Your shelf is empty</p><p class="mt-2 text-ink-700">Find a series and tick off the books you\u2019ve read \u2014 they\u2019ll show up here.</p><p class="mt-4"><a href="/series" class="rounded-full bg-ink-900 text-ink-50 px-5 py-2.5 text-sm font-semibold">Browse series</a></p><p class="mt-5 text-sm text-ink-700/75">Popular starts: <a class="text-amber-accent underline" href="/series/discworld">Discworld</a> \u00b7 <a class="text-amber-accent underline" href="/series/mistborn">Mistborn</a> \u00b7 <a class="text-amber-accent underline" href="/series/the-murderbot-diaries">The Murderbot Diaries</a> \u00b7 <a class="text-amber-accent underline" href="/new">New releases</a></p></div>';
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
        statCard(entries.length, entries.length === 1 ? "book read" : "books read") +
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
        html += '<div class="rounded-2xl bg-white border border-ink-200 p-4 mb-8"><p class="text-sm font-medium text-ink-900">Reading pace — last 12 months</p><p class="text-xs text-ink-700/75 mt-0.5">Each bar is how many books you finished that month — taller bar, busier reading month.</p>' +
          '<div class="mt-3 flex items-end gap-1.5 h-24" role="img" aria-label="Books read per month over the last 12 months">' +
          months.map(function (mo) {
            var hpx = mo.n ? Math.max(6, Math.round((mo.n / maxN) * 84)) : 2;
            return '<div class="flex-1 flex flex-col items-center gap-1 min-w-0"><span class="text-[10px] tabular-nums text-ink-700/75">' + (mo.n || "") + '</span><div class="w-full rounded-t ' + (mo.n ? "bg-amber-accent" : "bg-ink-100") + '" style="height:' + hpx + 'px"></div><span class="text-[10px] text-ink-700/75 truncate">' + mo.label + "</span></div>";
          }).join("") + "</div></div>";
      }
      Object.keys(bySeries).map(function (k) {
        var g = bySeries[k];
        g.items.sort(function (a, b) { return a.t - b.t; });
        return g;
      }).sort(function (a, b) { return (b.items[0].t || 0) - (a.items[0].t || 0); }).forEach(function (g) {
        html += '<section class="mb-6"><h2 class="font-display font-semibold text-xl text-ink-900">' +
          (g.slug ? '<a class="hover:text-amber-accent" href="' + (g.slug.indexOf("standalone-") === 0 ? "/authors/" + g.slug.slice(11) : "/series/" + g.slug) + '">' : "") + escapeHtml(g.name) + (g.slug ? "</a>" : "") +
          ' <span class="text-sm font-sans font-normal text-ink-700/75">' + g.items.length + ' read</span>' +
          (g.slug && g.slug.indexOf("standalone-") !== 0 ? ' <span class="block sm:inline text-sm font-sans font-normal" data-upnext="' + escapeHtml(g.slug) + '"></span>' : '') +
          '</h2><ul class="mt-2 space-y-1">' +
          g.items.map(function (e) {
            return '<li class="flex items-center justify-between rounded-xl bg-white border border-ink-200 px-4 py-2.5 text-sm" data-bid="' + escapeHtml(String(e.id)) + '"><span class="font-medium text-ink-900">' + escapeHtml(e.title || e.id) + '</span><span class="text-ink-700/75">' + (e.t > 1e12 ? fmtDate(e.t) : "") + "</span></li>";
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
          // Re-sort the ticked list into series reading order.
          var ul = slot.closest("section") && slot.closest("section").querySelector("ul");
          if (ul) {
            var order = {};
            res.books.forEach(function (b, bi) { order[String(b.id)] = bi; });
            Array.prototype.slice.call(ul.children)
              .sort(function (la, lb) {
                var oa = order[la.getAttribute("data-bid")], ob = order[lb.getAttribute("data-bid")];
                return (oa == null ? 1e9 : oa) - (ob == null ? 1e9 : ob);
              })
              .forEach(function (li) { ul.appendChild(li); });
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
    var subline = (entries.length === 1 ? "book read \u00b7 " : "books read \u00b7 ") + Object.keys(bySeries).length + " series";
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

  // ---- Year in Books report (client-only, /year-in-books) ----
  var yearRoot = document.getElementById("year-root");
  if (yearRoot) {
    var allEntries = Object.keys(data).map(function (k) { var e = data[k]; e.id = k; return e; });
    var dated2 = allEntries.filter(function (e) { return e && e.t > 1e12; });
    var yearsSet = {};
    dated2.forEach(function (e) { yearsSet[new Date(e.t).getFullYear()] = true; });
    var years = Object.keys(yearsSet).map(Number).sort(function (a, b) { return b - a; });
    if (!years.length) {
      yearRoot.innerHTML = '<div class="rounded-2xl bg-white border border-ink-200 p-8 text-center max-w-xl"><p class="font-display font-semibold text-xl text-ink-900">No dated reads yet</p><p class="mt-2 text-ink-700">Tick books off on any series page and come back — your report builds itself as you read.</p><p class="mt-4"><a href="/series" class="rounded-full bg-ink-900 text-ink-50 px-5 py-2.5 text-sm font-semibold">Browse series</a></p></div>';
    } else {
      var reportYear = years[0];
      function renderYearReport(yr) {
        var ye = dated2.filter(function (e) { return new Date(e.t).getFullYear() === yr; });
        var bySer = {};
        ye.forEach(function (e) { var k = e.series || "Standalone"; bySer[k] = (bySer[k] || 0) + 1; });
        var topSer = Object.keys(bySer).map(function (k) { return [k, bySer[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);
        var monthly = [];
        for (var mm = 0; mm < 12; mm++) monthly.push(0);
        ye.forEach(function (e) { monthly[new Date(e.t).getMonth()]++; });
        var busiest = -1, busyN = 0;
        monthly.forEach(function (n, i) { if (n > busyN) { busyN = n; busiest = i; } });
        var monthNames = [];
        for (var mn = 0; mn < 12; mn++) monthNames.push(new Date(2000, mn, 1).toLocaleDateString(undefined, { month: "short" }));
        var goalY = parseInt(localStorage.getItem("shelfmark:goal:" + yr), 10) || 0;
        var sorted = ye.slice().sort(function (a, b) { return a.t - b.t; });
        var first = sorted[0], last = sorted[sorted.length - 1];
        function stat(num, label) {
          return '<div class="rounded-2xl bg-white border border-ink-200 p-5 text-center" data-reveal><p class="font-display font-bold text-3xl text-ink-900">' + num + '</p><p class="text-xs text-ink-700/80 mt-1">' + label + "</p></div>";
        }
        var html = "";
        if (years.length > 1) {
          html += '<div class="mb-6 flex flex-wrap gap-2 text-sm" role="group" aria-label="Choose report year">' + years.map(function (y2) {
            return '<button type="button" data-year-pick="' + y2 + '" aria-pressed="' + (y2 === yr) + '" class="rounded-full px-4 py-1.5 border cursor-pointer ' + (y2 === yr ? "bg-ink-900 text-ink-50 border-ink-900" : "bg-white border-ink-200 hover:border-amber-accent") + '">' + y2 + "</button>";
          }).join("") + "</div>";
        }
        html += '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">' +
          stat(ye.length, (ye.length === 1 ? "book read in " : "books read in ") + yr) +
          stat(Object.keys(bySer).length, "series") +
          stat(busiest >= 0 && busyN ? monthNames[busiest] : "—", "busiest month" + (busyN ? " (" + busyN + (busyN === 1 ? " book)" : " books)") : "")) +
          stat(goalY ? Math.min(100, Math.round((ye.length / goalY) * 100)) + "%" : "—", goalY ? "of your " + goalY + "-book goal" : "no goal set") +
          "</div>";
        html += '<div class="rounded-2xl bg-white border border-ink-200 p-5 mt-4" data-reveal><p class="text-sm font-medium text-ink-900">' + yr + ' month by month</p><div class="mt-3 flex items-end gap-1.5 h-28" role="img" aria-label="Books read per month in ' + yr + '">' +
          monthly.map(function (n, i) {
            var mx = Math.max.apply(null, monthly.concat([1]));
            var hpx = n ? Math.max(6, Math.round((n / mx) * 96)) : 2;
            return '<div class="flex-1 flex flex-col items-center gap-1 min-w-0"><span class="text-[10px] tabular-nums text-ink-700/75">' + (n || "") + '</span><div class="w-full rounded-t ' + (n ? "bg-amber-accent" : "bg-ink-100") + '" style="height:' + hpx + 'px"></div><span class="text-[10px] text-ink-700/75 truncate">' + monthNames[i] + "</span></div>";
          }).join("") + "</div></div>";
        if (topSer.length) {
          html += '<div class="rounded-2xl bg-white border border-ink-200 p-5 mt-4" data-reveal><p class="text-sm font-medium text-ink-900">Top series of ' + yr + '</p><ol class="mt-3 space-y-2">' +
            topSer.map(function (t, i) {
              return '<li class="flex items-baseline gap-3 text-sm"><span class="font-display font-bold text-amber-accent w-5 text-right shrink-0">' + (i + 1) + '</span><span class="font-medium text-ink-900 min-w-0 truncate">' + escapeHtml(t[0]) + '</span><span class="text-ink-700/75 shrink-0">' + t[1] + " book" + (t[1] === 1 ? "" : "s") + "</span></li>";
            }).join("") + "</ol></div>";
        }
        if (first) {
          html += '<div class="rounded-2xl bg-white border border-ink-200 p-5 mt-4 text-sm text-ink-700" data-reveal><p><span class="font-medium text-ink-900">First finish:</span> ' + escapeHtml(first.title || "") + " (" + fmtDate(first.t) + ')</p>' +
            (last && last !== first ? '<p class="mt-1.5"><span class="font-medium text-ink-900">Latest finish:</span> ' + escapeHtml(last.title || "") + " (" + fmtDate(last.t) + ")</p>" : "") + "</div>";
        }
        html += '<div class="mt-6 flex flex-wrap gap-3"><button type="button" id="year-card-btn" class="rounded-full bg-ink-900 text-ink-50 px-5 py-2.5 text-sm font-semibold hover:bg-ink-700 cursor-pointer">Download ' + yr + ' report card</button><a href="/shelf" class="rounded-full bg-white border border-ink-200 px-5 py-2.5 text-sm font-semibold hover:border-amber-accent">Back to My Shelf</a></div>';
        yearRoot.innerHTML = html;
        yearRoot.querySelectorAll("[data-year-pick]").forEach(function (b) {
          b.addEventListener("click", function () { renderYearReport(parseInt(b.getAttribute("data-year-pick"), 10)); });
        });
        var cardBtn = document.getElementById("year-card-btn");
        if (cardBtn) cardBtn.addEventListener("click", function () {
          drawYearCard(yr, ye.length, Object.keys(bySer).length, topSer, goalY, busiest >= 0 && busyN ? new Date(2000, busiest, 1).toLocaleDateString(undefined, { month: "long" }) : "");
        });
      }
      renderYearReport(reportYear);
    }
  }

  function drawYearCard(yr, nBooks, nSeries, topSer, goalY, busyMonth) {
    var canvas = document.getElementById("year-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var W = canvas.width, H = canvas.height;
    ctx.fillStyle = "#1a1916"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#c8842c"; ctx.fillRect(0, 0, W, 14);
    ctx.fillStyle = "#c8842c";
    ctx.font = "500 46px Georgia, serif";
    ctx.fillText("Year in Books", 80, 170);
    ctx.fillStyle = "#f7f6f3";
    ctx.font = "700 150px Georgia, serif";
    ctx.fillText(String(yr), 80, 320);
    ctx.font = "700 190px Georgia, serif";
    ctx.fillText(String(nBooks), 80, 570);
    ctx.font = "400 44px Arial, sans-serif";
    ctx.fillStyle = "#d9d5c8";
    var sub = "book" + (nBooks === 1 ? "" : "s") + " read \u00b7 " + nSeries + " series";
    if (goalY) sub += " \u00b7 goal " + Math.min(100, Math.round((nBooks / goalY) * 100)) + "%";
    ctx.fillText(sub, 80, 650);
    if (busyMonth) ctx.fillText("Busiest month: " + busyMonth, 80, 715);
    var y = 830;
    ctx.font = "400 40px Arial, sans-serif";
    topSer.slice(0, 5).forEach(function (t, i) {
      ctx.fillStyle = "#c8842c"; ctx.fillText(String(i + 1) + ".", 80, y);
      ctx.fillStyle = "#f7f6f3";
      var name = t[0].length > 32 ? t[0].slice(0, 31) + "\u2026" : t[0];
      ctx.fillText(name + "  \u00b7  " + t[1], 150, y);
      y += 78;
    });
    ctx.fillStyle = "#d9d5c8";
    ctx.font = "400 36px Arial, sans-serif";
    ctx.fillText("shelfmark.zalize.com/year-in-books", 80, H - 80);
    var a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "shelfmark-year-in-books-" + yr + ".png";
    a.click();
  }

  // ---- shared saved-list link (encode in URL fragment; nothing hits the server) ----
  function b64urlEncode(s) {
    return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function b64urlDecode(s) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    return decodeURIComponent(escape(atob(s)));
  }

  var sharedRoot = document.getElementById("shared-root");
  if (sharedRoot) {
    var items2 = null;
    try {
      var frag = location.hash.replace(/^#/, "");
      if (frag) {
        var parsed = JSON.parse(b64urlDecode(frag));
        if (Array.isArray(parsed)) {
          items2 = parsed.filter(function (it) {
            return Array.isArray(it) && typeof it[0] === "string" && /^[a-z0-9-]{1,80}$/.test(it[0]) && typeof it[1] === "string" && it[1].length <= 120;
          }).slice(0, 100);
        }
      }
    } catch (e) {}
    if (!items2 || !items2.length) {
      sharedRoot.innerHTML = '<div class="rounded-2xl bg-white border border-ink-200 p-8 text-center max-w-xl"><p class="font-display font-semibold text-xl text-ink-900">This link doesn\u2019t contain a list</p><p class="mt-2 text-ink-700">The share link may be incomplete \u2014 ask for it again, or start your own list.</p><p class="mt-4"><a href="/series" class="rounded-full bg-ink-900 text-ink-50 px-5 py-2.5 text-sm font-semibold">Browse series</a></p></div>';
    } else {
      var shtml = '<ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">' + items2.map(function (it) {
        return '<li><a href="/series/' + encodeURIComponent(it[0]) + '" class="card-lift block rounded-2xl bg-white border border-ink-200 p-4 hover:border-amber-accent"><span class="font-display font-semibold text-ink-900">' + escapeHtml(it[1] || it[0]) + '</span><span class="block text-xs text-ink-700/75 mt-1">view reading order \u2192</span></a></li>';
      }).join("") + "</ul>";
      shtml += '<div class="mt-6 flex flex-wrap gap-3 items-center"><button type="button" id="import-shared-btn" class="rounded-full bg-ink-900 text-ink-50 px-5 py-2.5 text-sm font-semibold hover:bg-ink-700 cursor-pointer">Add all to my saved list</button><span id="import-shared-status" role="status" class="text-sm text-amber-accent"></span></div>';
      sharedRoot.innerHTML = shtml;
      var impBtn = document.getElementById("import-shared-btn");
      if (impBtn) impBtn.addEventListener("click", function () {
        var m = loadSaved();
        var added = 0;
        items2.forEach(function (it) {
          if (!m[it[0]]) { m[it[0]] = { name: it[1] || it[0], t: Date.now() }; added++; }
        });
        storeSaved(m);
        var st = document.getElementById("import-shared-status");
        if (st) st.textContent = added ? "Added " + added + " to your saved list \u2713" : "Already all on your list \u2713";
      });
    }
  }

  // "Share list" button on My Shelf saved section
  if (savedRoot) {
    var savedMapForShare = loadSaved();
    var shareSlugs = Object.keys(savedMapForShare);
    if (shareSlugs.length) {
      var shareWrap = document.createElement("p");
      shareWrap.className = "mt-4";
      var shareListBtn = document.createElement("button");
      shareListBtn.type = "button";
      shareListBtn.className = "rounded-full bg-white border border-ink-200 px-4 py-2 text-sm font-semibold hover:border-amber-accent cursor-pointer";
      shareListBtn.textContent = "Share this list";
      shareListBtn.setAttribute("aria-live", "polite");
      shareListBtn.addEventListener("click", function () {
        var payload = shareSlugs.sort(function (a, b) { return savedMapForShare[b].t - savedMapForShare[a].t; })
          .slice(0, 100).map(function (slug) { return [slug, String(savedMapForShare[slug].name || slug).slice(0, 120)]; });
        var url = location.origin + "/saved#" + b64urlEncode(JSON.stringify(payload));
        if (navigator.share) {
          navigator.share({ title: "My Shelfmark reading list", url: url }).catch(function () {});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(function () {
            var old = shareListBtn.textContent;
            shareListBtn.textContent = "Link copied \u2713";
            setTimeout(function () { shareListBtn.textContent = old; }, 2000);
          }).catch(function () {});
        }
      });
      shareWrap.appendChild(shareListBtn);
      savedRoot.appendChild(shareWrap);
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

  // Scroll reveal: fade-up sections marked data-reveal (motion-safe users only)
  if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches && "IntersectionObserver" in window) {
    var revealEls = document.querySelectorAll("[data-reveal]");
    if (revealEls.length) {
      document.documentElement.classList.add("js-reveal");
      var ro = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("revealed");
            ro.unobserve(en.target);
          }
        });
      }, { rootMargin: "0px 0px -10% 0px" });
      revealEls.forEach(function (el) { ro.observe(el); });
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function fmtDate(t) {
    return new Date(t).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }
})();
