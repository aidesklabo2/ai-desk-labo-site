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

// AI Desk Labo — shared site interactions. Vanilla JS, no dependencies.
(function () {
  "use strict";

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

  // Scroll-reveal: fade/slide elements in as they enter the viewport.
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

  // Ranking showcase: scroll-synced horizontal reveal (GSAP ScrollTrigger).
  // Progressive enhancement only — the CSS scroll-snap row above already
  // works as a plain swipeable carousel with zero JS, so if the GSAP CDN
  // is blocked/slow/unavailable, or the plugin fails to register, or the
  // viewport is narrow, or the user prefers reduced motion, this section
  // silently stays as that plain carousel instead of breaking.
  var showcaseOuter = document.querySelector(".showcase-track-outer");
  var showcaseTrack = document.getElementById("showcaseTrack");
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isWideEnough = window.matchMedia("(min-width: 900px)").matches;
  if (showcaseOuter && showcaseTrack && !prefersReducedMotion && isWideEnough) {
    window.addEventListener("load", function () {
      try {
        if (!window.gsap || !window.ScrollTrigger) return;
        gsap.registerPlugin(ScrollTrigger);
        var distance = showcaseTrack.scrollWidth - showcaseOuter.clientWidth;
        if (distance <= 0) return;
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
      } catch (err) {
        // Leave the plain scroll-snap carousel in place on any failure.
        if (showcaseOuter) showcaseOuter.classList.remove("js-driven");
      }
    });
  }
})();
