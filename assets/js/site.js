// Amazon outbound intent; keep separate from enhanced measurement's click event.
(function () {
  "use strict";
  function trackAmazonClick(event) {
    if ((event.type === "click" && event.button !== 0) ||
        (event.type === "auxclick" && event.button !== 1)) return;
    var target = event.target;
    var link = target && target.closest && target.closest("a.btn-amazon");
    if (!link || typeof window.gtag !== "function") return;
    try {
      var url = new URL(link.href);
      if (url.protocol !== "https:" ||
          !/^(www\.)?amazon\.co\.jp$/.test(url.hostname)) return;
      var match = url.pathname.match(/^\/dp\/([A-Z0-9]{10})(?:\/|$)/);
      if (!match) return;
      var pagePath = window.location.pathname.replace(/\/index\.html$/, "/");
      var placement = "other";
      if (pagePath === "/" && link.closest("#showcaseTrack")) {
        placement = "home_ranking";
      } else if (pagePath === "/" && link.closest(".card")) {
        var section = link.closest("section");
        if (section && section.querySelector('a[href="rankings/budget-ai-desk-gear/"]')) {
          placement = "home_budget";
        }
      } else if (link.closest("article .card")) {
        placement = "article_product";
      }
      window.gtag("event", "amazon_click", {
        send_to: "G-M4L5M94YCB",
        product_asin: match[1],
        placement: placement,
        page_path: pagePath
      });
    } catch (err) {
      // Measurement must never interrupt the original link action.
    }
  }
  document.addEventListener("click", trackAmazonClick);
  document.addEventListener("auxclick", trackAmazonClick);
})();

// AI Desk Labo — shared site interactions. Vanilla JS + GSAP/Lenis (CDN,
// both free/open-source). Every enhancement below is progressive: if a
// CDN script is blocked or slow, the page still renders and reads fine
// with the plain CSS fallback already in place.
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Sticky header: add a class once the page scrolls past the hero.
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 12) header.classList.add("is-scrolled");
      else header.classList.remove("is-scrolled");
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Mobile nav toggle.
  var navToggle = document.querySelector(".nav-toggle");
  var siteNav = document.querySelector(".site-nav");
  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = siteNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    siteNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        siteNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Scroll-reveal fallback: fade/slide [data-reveal] sections in as they
  // enter the viewport. Always runs — GSAP's per-card stagger below is an
  // additional enhancement layered on top, not a replacement.
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length) {
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    }
  }

  // Homepage stat counters: count up from 0 to the target once visible.
  var counters = document.querySelectorAll("[data-count-to]");
  if (counters.length && "IntersectionObserver" in window) {
    var animateCount = function (el) {
      var target = parseInt(el.getAttribute("data-count-to"), 10) || 0;
      var duration = 900;
      var start = null;
      var step = function (ts) {
        if (start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target).toLocaleString("ja-JP");
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    var cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach(function (el) { cio.observe(el); });
  }

  // Back-to-top button.
  var topBtn = document.querySelector(".back-to-top");
  if (topBtn) {
    document.addEventListener(
      "scroll",
      function () {
        topBtn.classList.toggle("is-visible", window.scrollY > 600);
      },
      { passive: true }
    );
    topBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Scroll progress bar.
  var progressBar = document.querySelector(".progress-bar");
  if (progressBar) {
    var updateProgress = function () {
      var docEl = document.documentElement;
      var scrollTop = docEl.scrollTop || document.body.scrollTop;
      var scrollHeight = docEl.scrollHeight - docEl.clientHeight || 1;
      progressBar.style.width = Math.min(100, (scrollTop / scrollHeight) * 100) + "%";
    };
    document.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();
  }

  // Custom cursor: only ever enabled for a confirmed fine/hover pointer,
  // so touch visitors and no-JS visitors keep the native cursor untouched.
  if (isFinePointer) {
    var cursorDot = document.querySelector(".cursor-dot");
    var cursorRing = document.querySelector(".cursor-ring");
    if (cursorDot && cursorRing) {
      document.documentElement.classList.add("has-custom-cursor");
      document.addEventListener(
        "pointermove",
        function (e) {
          var t = "translate(" + e.clientX + "px," + e.clientY + "px) translate(-50%,-50%)";
          cursorDot.style.transform = t;
          cursorRing.style.transform = t;
        },
        { passive: true }
      );
      document.addEventListener("pointerdown", function () { cursorRing.classList.add("is-active"); });
      document.addEventListener("pointerup", function () { cursorRing.classList.remove("is-active"); });
      document.addEventListener("pointerover", function (e) {
        if (e.target.closest && e.target.closest("a, button, .card, .showcase-card, .chip")) {
          cursorRing.classList.add("is-active");
        }
      });
      document.addEventListener("pointerout", function (e) {
        if (e.target.closest && e.target.closest("a, button, .card, .showcase-card, .chip")) {
          cursorRing.classList.remove("is-active");
        }
      });
    }
  }

  // Hero: split-line headline reveal (vanilla-split, no paid plugin needed
  // — build.js already wraps each line in .split-line > span). Falls back
  // to the plain, fully visible heading if GSAP never loads.
  var heroLines = document.querySelectorAll(".hero h1 .split-line > span");
  if (heroLines.length && window.gsap && !reduceMotion) {
    try {
      gsap.fromTo(
        heroLines,
        { yPercent: 110 },
        { yPercent: 0, duration: 1, ease: "expo.out", stagger: 0.08, delay: 0.5 }
      );
    } catch (err) {
      heroLines.forEach(function (el) { el.style.transform = ""; });
    }
  }

  // Hero backdrop: three soft, slowly drifting gradient blobs drawn on a
  // <canvas> (blurred via CSS, cheap to draw). Paused while the hero is
  // off-screen; skipped entirely under reduced motion or without 2D canvas
  // support — the body's own CSS gradient is still there underneath.
  var heroCanvas = document.querySelector(".hero-canvas");
  if (heroCanvas && heroCanvas.getContext && !reduceMotion) {
    var ctx = heroCanvas.getContext("2d");
    var blobs = [
      { x: 0.26, y: 0.32, r: 0.3, color: "179,86,15" },
      { x: 0.74, y: 0.62, r: 0.26, color: "18,17,15" },
      { x: 0.56, y: 0.18, r: 0.19, color: "18,17,15" },
    ];
    var canvasRunning = false;
    var resizeCanvas = function () {
      heroCanvas.width = heroCanvas.offsetWidth;
      heroCanvas.height = heroCanvas.offsetHeight;
    };
    var frame = 0;
    var drawBlobs = function () {
      if (!canvasRunning) return;
      frame += 1;
      var w = heroCanvas.width;
      var h = heroCanvas.height;
      ctx.clearRect(0, 0, w, h);
      blobs.forEach(function (b, i) {
        var cx = (b.x + Math.sin(frame * 0.0032 + i * 2) * 0.09) * w;
        var cy = (b.y + Math.cos(frame * 0.0026 + i * 2) * 0.09) * h;
        var r = b.r * Math.max(w, h);
        var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, "rgba(" + b.color + ",0.16)");
        grad.addColorStop(1, "rgba(" + b.color + ",0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(drawBlobs);
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    if ("IntersectionObserver" in window) {
      var heroIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          canvasRunning = entry.isIntersecting;
          if (canvasRunning) requestAnimationFrame(drawBlobs);
        });
      });
      heroIo.observe(heroCanvas);
    } else {
      canvasRunning = true;
      requestAnimationFrame(drawBlobs);
    }
  }

  // Card / showcase-card tilt + spotlight: a fine pointer tilts the card in
  // 3D toward the cursor (inline transform, so it simply overrides the
  // plain CSS :hover lift while active) and drives the existing --mx/--my
  // radial spotlight. Resets on pointerleave, which is non-bubbling, so
  // each card gets its own listener rather than one delegated on document.
  if (isFinePointer) {
    document.addEventListener(
      "pointermove",
      function (e) {
        var el = e.target.closest && e.target.closest(".card, .showcase-card");
        if (!el) return;
        var rect = el.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        el.style.setProperty("--mx", px * 100 + "%");
        el.style.setProperty("--my", py * 100 + "%");
        var rx = (py - 0.5) * -8;
        var ry = (px - 0.5) * 8;
        el.style.transform = "perspective(1000px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) translateY(-6px)";
      },
      { passive: true }
    );
    document.querySelectorAll(".card, .showcase-card").forEach(function (el) {
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });

    // Magnetic buttons: the Amazon CTA is gently pulled toward the cursor
    // within its own bounds, and springs back via the existing CSS
    // transition on pointerleave.
    document.querySelectorAll(".btn-amazon").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var mx = (e.clientX - r.left - r.width / 2) * 0.3;
        var my = (e.clientY - r.top - r.height / 2) * 0.3;
        btn.style.transform = "translate(" + mx.toFixed(1) + "px," + my.toFixed(1) + "px)";
      });
      btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
    });
  }

  // Ranking showcase: scroll-synced horizontal reveal (GSAP ScrollTrigger).
  // Progressive enhancement only — the CSS scroll-snap row above already
  // works as a plain swipeable carousel with zero JS, so if the GSAP CDN
  // is blocked/slow/unavailable, or the plugin fails to register, or the
  // viewport is narrow, or the user prefers reduced motion, this section
  // silently stays as that plain carousel instead of breaking.
  var showcaseOuter = document.querySelector(".showcase-track-outer");
  var showcaseTrack = document.getElementById("showcaseTrack");
  var isWideEnough = window.matchMedia("(min-width: 900px)").matches;

  window.addEventListener("load", function () {
    var gsapReady = window.gsap && window.ScrollTrigger;
    if (gsapReady) {
      try {
        gsap.registerPlugin(ScrollTrigger);
      } catch (err) {
        gsapReady = false;
      }
    }

    if (showcaseOuter && showcaseTrack && gsapReady && !reduceMotion && isWideEnough) {
      try {
        var distance = showcaseTrack.scrollWidth - showcaseOuter.clientWidth;
        if (distance > 0) {
          showcaseOuter.classList.add("js-driven");
          gsap.to(showcaseTrack, {
            x: -distance,
            ease: "none",
            scrollTrigger: {
              trigger: showcaseOuter,
              start: "top center",
              end: "+=" + distance,
              scrub: 0.6,
              pin: true,
              invalidateOnRefresh: true,
            },
          });
        }
      } catch (err) {
        if (showcaseOuter) showcaseOuter.classList.remove("js-driven");
      }
    }

    // Per-card staggered reveal, layered on top of the section-level
    // [data-reveal] fade above. Guarded end-to-end: if anything throws
    // after cards are hidden, the catch blocks immediately restore them,
    // so a script error can never leave content invisible.
    if (gsapReady && !reduceMotion) {
      try {
        document.querySelectorAll(".card-grid").forEach(function (grid) {
          var cards = grid.querySelectorAll(".card");
          if (!cards.length) return;
          gsap.set(cards, { autoAlpha: 0, y: 24 });
          ScrollTrigger.batch(cards, {
            start: "top 90%",
            once: true,
            onEnter: function (batch) {
              try {
                gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 });
              } catch (err) {
                gsap.set(batch, { autoAlpha: 1, y: 0 });
              }
            },
          });
        });
      } catch (err) {
        document.querySelectorAll(".card-grid .card").forEach(function (c) {
          c.style.opacity = "";
          c.style.visibility = "";
          c.style.transform = "";
        });
      }
    }

    // Smooth inertia scrolling (Lenis, MIT-licensed, via CDN). Kept native
    // on touch (Lenis' default) and skipped under reduced motion; wired
    // into ScrollTrigger's own ticker per GSAP's documented integration so
    // the pinned showcase above keeps tracking scroll position correctly.
    if (!reduceMotion && window.Lenis) {
      try {
        var lenis = new Lenis({ duration: 1.1, smoothWheel: true });
        if (gsapReady) {
          lenis.on("scroll", ScrollTrigger.update);
          gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
          gsap.ticker.lagSmoothing(0);
        } else {
          (function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
          })();
        }
      } catch (err) {
        // Native scroll (html { scroll-behavior: smooth }) is already in place.
      }
    }
  });
})();
