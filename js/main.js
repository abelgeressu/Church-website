/* The Light of God Church: small enhancements. The site works without this file;
   it adds the mobile menu, "next gathering", click-to-load map and videos, gallery viewer and forms. */
(function () {
  "use strict";

  var doc = document;
  var cfg = window.CHURCH_CONFIG || {};

  /* ---------- Mobile menu ---------- */
  var toggle = doc.querySelector(".nav-toggle");
  var nav = doc.getElementById("site-nav");
  if (toggle && nav) {
    var closeNav = function (returnFocus) {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      if (returnFocus) toggle.focus();
    };
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) closeNav(true);
    });
  }

  /* ---------- Footer year ---------- */
  doc.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Next gathering (times are Karlsruhe time) ---------- */
  var SERVICES = [
    { day: 0, from: "14:30", to: "16:30", name: "Sunday worship" },
    { day: 5, from: "19:00", to: "21:00", name: "Friday prayer" }
  ];
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var DAY_MIN = 1440;
  var WEEK_MIN = 7 * DAY_MIN;

  function toMinutes(hhmm) {
    var p = hhmm.split(":");
    return Number(p[0]) * 60 + Number(p[1]);
  }

  function berlinNow(date) {
    var parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Berlin", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(date);
    var pick = function (type) {
      for (var i = 0; i < parts.length; i++) if (parts[i].type === type) return parts[i].value;
      return "0";
    };
    return {
      day: SHORT_DAYS.indexOf(pick("weekday")),
      minutes: Number(pick("hour")) * 60 + Number(pick("minute"))
    };
  }

  function nextGathering(date) {
    var now = berlinNow(date);
    var nowAbs = now.day * DAY_MIN + now.minutes;
    var i, s, start, end;

    for (i = 0; i < SERVICES.length; i++) {
      s = SERVICES[i];
      start = s.day * DAY_MIN + toMinutes(s.from);
      end = s.day * DAY_MIN + toMinutes(s.to);
      if (nowAbs >= start && nowAbs < end) {
        return { live: true, title: s.name, when: "Happening now, until " + s.to };
      }
    }

    var best = null;
    for (i = 0; i < SERVICES.length; i++) {
      s = SERVICES[i];
      start = s.day * DAY_MIN + toMinutes(s.from);
      var wait = (start - nowAbs + WEEK_MIN) % WEEK_MIN;
      if (wait === 0) wait = WEEK_MIN;
      if (!best || wait < best.wait) best = { service: s, wait: wait };
    }

    var dayOffset = Math.floor((nowAbs + best.wait) / DAY_MIN) - Math.floor(nowAbs / DAY_MIN);
    var when;
    if (dayOffset === 0) when = "Today at " + best.service.from;
    else if (dayOffset === 1) when = "Tomorrow at " + best.service.from;
    else when = DAY_NAMES[best.service.day] + " at " + best.service.from;
    return { live: false, title: best.service.name, when: when };
  }

  var nextBox = doc.querySelector("[data-next]");
  if (nextBox) {
    try {
      var info = nextGathering(new Date());
      nextBox.querySelector("[data-next-label]").textContent = info.live ? "Happening now" : "Next gathering";
      nextBox.querySelector("[data-next-title]").textContent = info.title;
      nextBox.querySelector("[data-next-when]").textContent = info.when;
    } catch (err) {
      /* keep the static text that is already on the page */
    }
  }

  /* ---------- Hero mist (decorative video, desktop only, skipped for reduced motion) ---------- */
  var mistHost = doc.querySelector("[data-mist]");
  if (mistHost && window.matchMedia) {
    var wide = window.matchMedia("(min-width: 800px)").matches;
    var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (wide && !calm) {
      var video = doc.createElement("video");
      video.className = "hero__mist";
      video.src = "media/hero-mist.mp4";
      video.muted = true;
      video.defaultMuted = true;
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;
      video.setAttribute("aria-hidden", "true");
      video.setAttribute("tabindex", "-1");
      video.addEventListener("error", function () { video.remove(); });
      mistHost.appendChild(video);
      var started = video.play();
      if (started && started.catch) started.catch(function () { video.remove(); });
    }
  }

  /* ---------- Click-to-load embeds (Google Maps, YouTube) ---------- */
  doc.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-embed-src]");
    if (!btn) return;
    var holder = btn.closest("[data-embed]");
    var consent = holder && holder.querySelector(".consent");
    if (!consent) return;

    var frame = doc.createElement("iframe");
    frame.src = btn.getAttribute("data-embed-src");
    frame.title = btn.getAttribute("data-embed-title") || "Embedded content";
    frame.loading = "lazy";
    frame.allowFullscreen = true;
    if (btn.getAttribute("data-embed-kind") === "video") {
      frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      frame.referrerPolicy = "strict-origin-when-cross-origin";
    } else {
      frame.referrerPolicy = "no-referrer-when-downgrade";
    }
    consent.replaceWith(frame);
    frame.focus();
  });

  /* build a click-to-load video block with plain DOM calls */
  function videoConsent(opts) {
    var holder = doc.createElement("div");
    holder.className = "embed";
    holder.setAttribute("data-embed", "");
    var box = doc.createElement("div");
    box.className = "consent";
    var title = doc.createElement("p");
    title.className = "consent__title";
    title.textContent = opts.title;
    var text = doc.createElement("p");
    text.className = "consent__text";
    text.textContent = opts.text;
    var button = doc.createElement("button");
    button.type = "button";
    button.className = "btn btn--lamp";
    button.textContent = opts.button;
    button.setAttribute("data-embed-src", opts.src);
    button.setAttribute("data-embed-title", opts.title);
    button.setAttribute("data-embed-kind", "video");
    var note = doc.createElement("p");
    note.className = "consent__note";
    note.textContent = "Playing the video loads content from YouTube.";
    box.append(title, text, button, note);
    holder.appendChild(box);
    return holder;
  }

  var channelId = typeof cfg.youtubeChannelId === "string" ? cfg.youtubeChannelId.trim() : "";
  if (/^UC[\w-]{22}$/.test(channelId)) {
    var liveHost = doc.querySelector("[data-live]");
    if (liveHost) {
      liveHost.replaceChildren(videoConsent({
        title: "Live worship service",
        text: "When we are live, the stream plays here.",
        button: "Load live stream",
        src: "https://www.youtube-nocookie.com/embed/live_stream?channel=" + encodeURIComponent(channelId)
      }));
    }
    var videosHost = doc.querySelector("[data-videos]");
    if (videosHost) {
      videosHost.replaceChildren(videoConsent({
        title: "Latest services and sermons",
        text: "Watch our most recent uploads.",
        button: "Load videos",
        src: "https://www.youtube-nocookie.com/embed/videoseries?list=UU" + encodeURIComponent(channelId.slice(2))
      }));
    }
  }

  /* ---------- Copy address ---------- */
  doc.querySelectorAll("[data-copy]").forEach(function (btn) {
    var original = btn.textContent;
    btn.addEventListener("click", function () {
      var value = btn.getAttribute("data-copy");
      var done = function () {
        btn.textContent = "Address copied";
        setTimeout(function () { btn.textContent = original; }, 2200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done, function () { window.prompt("Copy the address:", value); });
      } else {
        window.prompt("Copy the address:", value);
      }
    });
  });

  /* ---------- Special events from site-config.js ---------- */
  var eventsHost = doc.querySelector("[data-events]");
  if (eventsHost && Array.isArray(cfg.events) && cfg.events.length) {
    var today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date());
    var upcoming = cfg.events
      .filter(function (ev) { return ev && /^\d{4}-\d{2}-\d{2}$/.test(ev.date) && ev.date >= today; })
      .sort(function (a, b) { return (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")); });

    if (upcoming.length) {
      var list = doc.createElement("div");
      list.className = "rows";
      upcoming.forEach(function (ev) {
        var row = doc.createElement("article");
        row.className = "row";

        var when = doc.createElement("p");
        when.className = "row__meta";
        when.textContent = new Date(ev.date + "T12:00:00").toLocaleDateString("en-GB", {
          weekday: "long", day: "numeric", month: "long", year: "numeric"
        });
        if (ev.time) {
          var small = doc.createElement("small");
          small.textContent = ev.time;
          when.appendChild(small);
        }

        var body = doc.createElement("div");
        var h = doc.createElement("h3");
        h.className = "row__title";
        h.textContent = ev.title || "Event";
        body.appendChild(h);
        if (ev.text) {
          var p = doc.createElement("p");
          p.className = "row__text";
          p.textContent = ev.text;
          body.appendChild(p);
        }

        var place = doc.createElement("p");
        place.className = "row__meta";
        place.textContent = ev.place || "";

        row.append(when, body, place);
        list.appendChild(row);
      });
      eventsHost.replaceChildren(list);
    }
  }

  /* ---------- Gallery viewer ---------- */
  var box = doc.getElementById("lightbox");
  var thumbs = doc.querySelectorAll("[data-full]");
  if (box && thumbs.length && typeof box.showModal === "function") {
    var big = box.querySelector(".lightbox__img");
    var count = box.querySelector(".lightbox__count");
    var current = 0;
    var show = function (i) {
      current = (i + thumbs.length) % thumbs.length;
      var t = thumbs[current];
      big.src = t.getAttribute("data-full");
      big.alt = t.getAttribute("data-alt") || "";
      count.textContent = (current + 1) + " of " + thumbs.length;
    };
    thumbs.forEach(function (t, i) {
      t.addEventListener("click", function () { show(i); box.showModal(); });
    });
    box.querySelector("[data-lb-prev]").addEventListener("click", function () { show(current - 1); });
    box.querySelector("[data-lb-next]").addEventListener("click", function () { show(current + 1); });
    box.querySelector("[data-lb-close]").addEventListener("click", function () { box.close(); });
    box.addEventListener("click", function (e) { if (e.target === box) box.close(); });
    box.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    });
  }

  /* ---------- Prayer request: opens the visitor's email app ---------- */
  var form = doc.querySelector("form[data-mailto]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var to = form.getAttribute("data-mailto");
      var name = form.elements["your-name"].value.trim();
      var request = form.elements["request"].value.trim();
      if (!request) return;
      var body = "Prayer request\n\n" + request + (name ? "\n\nFrom: " + name : "");
      window.location.href = "mailto:" + to + "?subject=" + encodeURIComponent("Prayer request") +
        "&body=" + encodeURIComponent(body);
      var status = doc.querySelector("[data-form-status]");
      if (status) {
        status.textContent = "Your email app should open with your request ready to send. If nothing opens, write to " + to + ".";
      }
    });
  }
})();
