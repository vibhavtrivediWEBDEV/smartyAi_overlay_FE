"use client";

import Lenis from "lenis";
import type { ReactNode } from "react";
import { useRef } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/motion/gsap";

type HomeExperienceProps = {
  children: ReactNode;
};

export function HomeExperience({ children }: HomeExperienceProps) {
  const scope = useRef<HTMLDivElement>(null);
  const preloader = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const root = scope.current;
    if (!root) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let lenis: Lenis | undefined;
    let ticker: ((time: number) => void) | undefined;
    let split: SplitText | undefined;
    const cleanups: Array<() => void> = [];

    if (!reducedMotion) {
      lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 });
      const updateScrollTrigger = () => ScrollTrigger.update();
      ticker = (time: number) => lenis?.raf(time * 1000);
      lenis.on("scroll", updateScrollTrigger);
      gsap.ticker.add(ticker);
      gsap.ticker.lagSmoothing(0);
      cleanups.push(() => {
        lenis?.off("scroll", updateScrollTrigger);
        gsap.ticker.lagSmoothing(500, 33);
      });
    }

    const curtain = preloader.current;
    if (curtain) {
      if (reducedMotion || sessionStorage.getItem("smartyai-intro-seen")) {
        gsap.set(curtain, { autoAlpha: 0, pointerEvents: "none" });
      } else {
        document.documentElement.classList.add("is-loading-home");
        const intro = gsap.timeline({
          defaults: { ease: "expo.inOut" },
          onComplete: () => {
            sessionStorage.setItem("smartyai-intro-seen", "true");
            document.documentElement.classList.remove("is-loading-home");
            gsap.set(curtain, { display: "none", pointerEvents: "none" });
          },
        });
        intro
          .fromTo("[data-preloader-mark]", { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.55 })
          .fromTo("[data-preloader-rule]", { scaleX: 0 }, { scaleX: 1, duration: 0.55 }, "-=0.3")
          .to(curtain, { clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)", duration: 1 }, "+=0.08");
      }
    }

    const header = root.querySelector<HTMLElement>("[data-site-header]");
    const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 24);
    window.addEventListener("scroll", updateHeader, { passive: true });
    updateHeader();
    cleanups.push(() => window.removeEventListener("scroll", updateHeader));

    if (reducedMotion) {
      gsap.set("[data-reveal], [data-hero-copy], [data-hero-actions], [data-hero-proof], [data-hero-demo]", { clearProps: "all" });
      return () => cleanups.forEach((cleanup) => cleanup());
    }

    const heroTitle = root.querySelector<HTMLElement>("[data-hero-title]");
    if (heroTitle) {
      split = SplitText.create(heroTitle, { type: "lines,words,chars", mask: "lines" });
      const hero = gsap.timeline({ delay: 0.38 });
      hero
        .from(split.lines, { yPercent: 105, duration: 0.8, stagger: 0.08 })
        .from(split.words, { autoAlpha: 0, yPercent: 28, duration: 0.6, stagger: 0.06 }, "<0.12")
        .from(split.chars, { autoAlpha: 0, yPercent: 18, duration: 0.4, stagger: 0.008 }, "-=0.48")
        .from("[data-hero-copy]", { y: 22, autoAlpha: 0, duration: 0.65 }, "-=0.25")
        .from("[data-hero-actions]", { y: 18, autoAlpha: 0, duration: 0.55 }, "-=0.35")
        .from("[data-hero-proof] > *", { y: 16, autoAlpha: 0, stagger: 0.08, duration: 0.5 }, "-=0.25")
        .from("[data-hero-demo]", { xPercent: 5, scale: 0.965, autoAlpha: 0, duration: 0.9 }, "-=0.7");
    }

    gsap.to("[data-hero-monogram]", {
      yPercent: -8,
      scrollTrigger: { trigger: "[data-home-hero]", start: "top top", end: "bottom top", scrub: 1 },
    });
    gsap.to("[data-hero-demo]", {
      yPercent: 6,
      scrollTrigger: { trigger: "[data-home-hero]", start: "top top", end: "bottom top", scrub: 1 },
    });

    gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
      gsap.from(element, {
        y: 44,
        autoAlpha: 0,
        duration: 0.85,
        scrollTrigger: { trigger: element, start: "top 82%", toggleActions: "play none none reverse" },
      });
    });

    gsap.utils.toArray<HTMLElement>("[data-reveal-group]").forEach((group) => {
      gsap.from(group.children, {
        y: 36,
        autoAlpha: 0,
        stagger: { each: 0.08, from: "start" },
        duration: 0.7,
        scrollTrigger: { trigger: group, start: "top 80%", toggleActions: "play none none reverse" },
      });
    });

    const media = gsap.matchMedia();
    media.add("(min-width: 1024px)", () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-journey-card]");
      if (cards.length) {
        gsap.to(cards, {
          xPercent: -310,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-journey-stage]",
            start: "top top+=88",
            end: "+=1050",
            pin: true,
            scrub: 1,
            anticipatePin: 1,
          },
        });
      }
      gsap.fromTo("[data-code-panel]", { clipPath: "inset(0 100% 0 0)", scale: 1.035 }, {
        clipPath: "inset(0 0% 0 0)",
        scale: 1,
        scrollTrigger: { trigger: "[data-code-section]", start: "top 72%", end: "center 55%", scrub: 1 },
      });
    });
    cleanups.push(() => media.revert());

    if (finePointer) {
      const cursor = root.querySelector<HTMLElement>("[data-cursor]");
      const cursorLabel = cursor?.querySelector<HTMLElement>("span");
      if (cursor) {
        const cursorX = gsap.quickTo(cursor, "x", { duration: 0.22, ease: "power3.out" });
        const cursorY = gsap.quickTo(cursor, "y", { duration: 0.22, ease: "power3.out" });
        const moveCursor = (event: PointerEvent) => {
          cursorX(event.clientX);
          cursorY(event.clientY);
        };
        const enterInteractive = (event: PointerEvent) => {
          const overlay = (event.target as Element).closest(".overlay-demo");
          if (overlay) {
            cursor.style.opacity = "";
            cursor.dataset.active = "true";
            cursor.dataset.context = "overlay";
            if (cursorLabel) cursorLabel.textContent = (event.target as Element).closest("button, label") ? "CONTROL" : "TRY";
            return;
          }
          cursor.style.opacity = "";
          delete cursor.dataset.context;
          const target = (event.target as Element).closest<HTMLElement>("a, button, [data-cursor-label]");
          if (!target) return;
          cursor.dataset.active = "true";
          if (cursorLabel) cursorLabel.textContent = target.dataset.cursorLabel || "OPEN";
        };
        const leaveInteractive = (event: PointerEvent) => {
          const next = event.relatedTarget as Element | null;
          if (!next?.closest?.(".overlay-demo")) cursor.style.opacity = "";
          if (next?.closest?.("a, button, [data-cursor-label]")) return;
          delete cursor.dataset.active;
          delete cursor.dataset.context;
          if (cursorLabel) cursorLabel.textContent = "";
        };
        window.addEventListener("pointermove", moveCursor, { passive: true });
        root.addEventListener("pointerover", enterInteractive);
        root.addEventListener("pointerout", leaveInteractive);
        cleanups.push(() => {
          window.removeEventListener("pointermove", moveCursor);
          root.removeEventListener("pointerover", enterInteractive);
          root.removeEventListener("pointerout", leaveInteractive);
        });
      }

      gsap.utils.toArray<HTMLElement>("[data-magnetic]").forEach((element) => {
        const moveX = gsap.quickTo(element, "x", { duration: 0.28, ease: "power3.out" });
        const moveY = gsap.quickTo(element, "y", { duration: 0.28, ease: "power3.out" });
        const move = (event: PointerEvent) => {
          const bounds = element.getBoundingClientRect();
          moveX((event.clientX - bounds.left - bounds.width / 2) * 0.12);
          moveY((event.clientY - bounds.top - bounds.height / 2) * 0.16);
        };
        const reset = () => gsap.to(element, { x: 0, y: 0, duration: 0.75, ease: "elastic.out(1, 0.3)" });
        element.addEventListener("pointermove", move);
        element.addEventListener("pointerleave", reset);
        cleanups.push(() => {
          element.removeEventListener("pointermove", move);
          element.removeEventListener("pointerleave", reset);
        });
      });
    }

    let resizeTimer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 140);
    };
    window.addEventListener("resize", refresh, { passive: true });
    document.fonts.ready.then(() => ScrollTrigger.refresh());
    cleanups.push(() => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", refresh);
    });

    return () => {
      split?.revert();
      if (ticker) gsap.ticker.remove(ticker);
      lenis?.destroy();
      cleanups.forEach((cleanup) => cleanup());
    };
  }, { scope });

  return (
    <div ref={scope} className="home-experience">
      <div ref={preloader} className="home-preloader" aria-hidden="true">
        <div className="home-preloader-lockup">
          <span data-preloader-mark>SmartyAI</span>
          <i data-preloader-rule />
          <small>Private intelligence, on your terms.</small>
        </div>
      </div>
      <div className="home-cursor" data-cursor aria-hidden="true"><span /></div>
      {children}
    </div>
  );
}