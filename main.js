/* ==========================================================
   AUREVO DYNAMICS — interaction layer
   ========================================================== */
(function(){
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     NAV: scrolled state + mobile toggle
  --------------------------------------------------------- */
  var nav = document.getElementById("site-nav");
  var navToggle = document.getElementById("navToggle");
  var mobileNav = document.getElementById("mobileNav");

  function onScroll(){
    if (window.scrollY > 8) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (navToggle){
    navToggle.addEventListener("click", function(){
      var open = mobileNav.classList.toggle("open");
      navToggle.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  mobileNav.querySelectorAll("a").forEach(function(a){
    a.addEventListener("click", function(){
      mobileNav.classList.remove("open");
      navToggle.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------------------------------------------------------
     SCROLL REVEAL — generic fade/rise for section content
  --------------------------------------------------------- */
  var revealTargets = document.querySelectorAll(
    ".section-head, .stat-grid, .roadmap-instrument, .problem-grid, " +
    ".advance-card, .cascade-diagram, .perf-table-wrap, .app-card, " +
    ".team-card, .citation-block, .contact-grid, .electrode-fig"
  );
  revealTargets.forEach(function(el){ el.classList.add("reveal"); });

  if ("IntersectionObserver" in window){
    var revealObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

    revealTargets.forEach(function(el){ revealObserver.observe(el); });
  } else {
    revealTargets.forEach(function(el){ el.classList.add("is-visible"); });
  }

  /* ---------------------------------------------------------
     TRACE DIVIDERS — draw left-to-right once, on scroll-into-view
  --------------------------------------------------------- */
  var tracePaths = document.querySelectorAll(".trace-path");

  // set dasharray to each path's real length so the draw is precise
  tracePaths.forEach(function(path){
    var len = path.getTotalLength ? path.getTotalLength() : 2000;
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
  });

  if ("IntersectionObserver" in window){
    var traceObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add("is-drawn");
          traceObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    tracePaths.forEach(function(path){ traceObserver.observe(path); });
  } else {
    tracePaths.forEach(function(path){ path.classList.add("is-drawn"); });
  }

  /* ---------------------------------------------------------
     HERO ELECTRODE DIAGRAM — interactive zone linking
     Clicking/hovering Zone A/B/C highlights:
       - that layer in the diagram
       - the matching stat in the stats strip
       - the matching curve + legend key in the cascade section
  --------------------------------------------------------- */
  var zoneButtons = document.querySelectorAll(".layer.zone");
  var statEls = document.querySelectorAll(".stat[data-zone]");
  var cascadeKeys = document.querySelectorAll(".cascade-key");
  var cascadeCurves = {
    a: document.querySelector(".curve-a"),
    b: document.querySelector(".curve-b"),
    c: document.querySelector(".curve-c")
  };
  var cascadeDiagram = document.getElementById("cascadeDiagram");

  function clearZoneState(){
    zoneButtons.forEach(function(b){
      b.classList.remove("is-active");
      b.setAttribute("aria-pressed", "false");
    });
    statEls.forEach(function(s){ s.classList.remove("is-active"); });
    cascadeKeys.forEach(function(k){
      k.classList.remove("is-active");
      k.setAttribute("aria-pressed", "false");
    });
    Object.keys(cascadeCurves).forEach(function(z){
      if (cascadeCurves[z]) cascadeCurves[z].classList.remove("is-active");
    });
  }

  function activateZone(zone){
    clearZoneState();
    if (!zone) return;

    var btn = document.getElementById("zoneBtn" + zone.toUpperCase());
    if (btn){ btn.classList.add("is-active"); btn.setAttribute("aria-pressed", "true"); }

    document.querySelectorAll('.stat[data-zone="' + zone + '"]').forEach(function(s){
      s.classList.add("is-active");
    });

    document.querySelectorAll('.cascade-key[data-zone="' + zone + '"]').forEach(function(k){
      k.classList.add("is-active");
      k.setAttribute("aria-pressed", "true");
    });

    if (cascadeCurves[zone]) cascadeCurves[zone].classList.add("is-active");
    if (cascadeDiagram) cascadeDiagram.classList.add("has-interacted");
  }

  var activeZone = null;

  function setActiveZone(zone, sticky){
    if (sticky){
      activeZone = (activeZone === zone) ? null : zone;
      activateZone(activeZone);
    } else if (!activeZone){
      activateZone(zone);
    }
  }

  zoneButtons.forEach(function(btn){
    var zone = btn.getAttribute("data-zone");
    btn.addEventListener("mouseenter", function(){ if (!activeZone) activateZone(zone); });
    btn.addEventListener("mouseleave", function(){ if (!activeZone) clearZoneState(); });
    btn.addEventListener("click", function(){ setActiveZone(zone, true); });
    btn.addEventListener("focus", function(){ if (!activeZone) activateZone(zone); });
    btn.addEventListener("blur", function(){ if (!activeZone) clearZoneState(); });
  });

  cascadeKeys.forEach(function(key){
    var zone = key.getAttribute("data-zone");
    key.addEventListener("mouseenter", function(){ if (!activeZone) activateZone(zone); });
    key.addEventListener("mouseleave", function(){ if (!activeZone) clearZoneState(); });
    key.addEventListener("click", function(){ setActiveZone(zone, true); });
  });

  /* ---------------------------------------------------------
     HERO MARGIN COORDS — a quiet oscilloscope-y cursor readout,
     desktop only, purely decorative instrument detail
  --------------------------------------------------------- */
  var coordsEl = document.getElementById("cursorCoords");
  var heroSection = document.getElementById("hero");

  if (coordsEl && heroSection && window.matchMedia("(min-width: 861px)").matches){
    heroSection.addEventListener("mousemove", function(e){
      var rect = heroSection.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      coordsEl.textContent =
        "X " + x.toFixed(1).padStart(5,"0") + " · Y " + y.toFixed(1).padStart(5,"0");
    });
    heroSection.addEventListener("mouseleave", function(){
      coordsEl.textContent = "X 000.0 · Y 000.0";
    });
  }

  /* ---------------------------------------------------------
     ROADMAP "now" marker — gentle pulse already handled in CSS;
     ensure reduced-motion users still see a clear current-stage cue
  --------------------------------------------------------- */
  if (reduceMotion){
    var nowMarker = document.querySelector(".rm-step.now .rm-marker");
    if (nowMarker) nowMarker.style.boxShadow = "0 0 0 4px rgba(196,87,26,.18)";
  }

})();
