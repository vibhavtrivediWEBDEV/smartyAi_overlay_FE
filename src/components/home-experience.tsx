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

    const heroDemo = root.querySelector<HTMLElement>("[data-hero-demo]");
    const overlayFrame = heroDemo?.querySelector<HTMLElement>(".overlay-demo");
    const productAxis = heroDemo?.querySelector<HTMLElement>(".home-product-axis");
    let activeLayout: "vertical" | "horizontal" | undefined;
    const syncProductLayout = (animate = false) => {
      if (!heroDemo || !overlayFrame || !productAxis) return;
      const nextLayout = overlayFrame.classList.contains("overlay-demo-horizontal") ? "horizontal" : "vertical";
      if (nextLayout === activeLayout) return;
      activeLayout = nextLayout;
      heroDemo.dataset.layout = nextLayout;
      if (!animate || reducedMotion) return;

      const direction = nextLayout === "horizontal" ? -1 : 1;
      gsap.timeline({ defaults: { overwrite: "auto" } })
        .fromTo(productAxis, { y: 12 * direction, rotate: 4 * direction }, { y: 0, rotate: 0, duration: 0.7, ease: "elastic.out(1, 0.55)", clearProps: "transform" })
        .fromTo(overlayFrame.querySelector(".overlay-demo-control-bar"), { scale: 0.965 }, { scale: 1, duration: 0.75, ease: "elastic.out(1, 0.45)", clearProps: "transform" }, 0)
        .fromTo(overlayFrame.querySelector(".overlay-demo-controls"), { x: nextLayout === "vertical" ? -10 : 0, y: nextLayout === "horizontal" ? -10 : 0 }, { x: 0, y: 0, duration: 0.65, ease: "back.out(2.4)", clearProps: "transform" }, 0.05);
    };
    syncProductLayout();
    if (overlayFrame) {
      const layoutObserver = new MutationObserver(() => syncProductLayout(true));
      layoutObserver.observe(overlayFrame, { attributes: true, attributeFilter: ["class"] });
      cleanups.push(() => layoutObserver.disconnect());
    }

    if (reducedMotion) {
      gsap.set("[data-reveal], [data-hero-copy], [data-hero-actions], [data-hero-proof], [data-hero-demo]", { clearProps: "all" });
      return () => cleanups.forEach((cleanup) => cleanup());
    }

    const heroTitle = root.querySelector<HTMLElement>("[data-hero-title]");
    if (heroTitle) {
      split = SplitText.create(heroTitle, { type: "lines,words,chars", mask: "lines" });
      const overlayWindow = heroDemo?.querySelector<HTMLElement>(".home-overlay-window");
      const overlayControls = heroDemo?.querySelectorAll<HTMLElement>(".overlay-demo-controls > *");
      const overlayStatus = heroDemo?.querySelectorAll<HTMLElement>(".overlay-demo-status > *");
      const overlayMessages = heroDemo?.querySelectorAll<HTMLElement>(".overlay-demo-message");
      const overlayComposer = heroDemo?.querySelector<HTMLElement>(".overlay-demo-input-area");
      const productDetails = heroDemo?.querySelectorAll<HTMLElement>("[data-product-detail]");
      const overlayWindowTarget = overlayWindow ? [overlayWindow] : [];
      const overlayFrameTarget = overlayFrame ? [overlayFrame] : [];
      const overlayComposerTarget = overlayComposer ? [overlayComposer] : [];
      const hero = gsap.timeline({ delay: 0.38, defaults: { ease: "power4.out" } });
      hero
        .from(split.lines, { yPercent: 105, duration: 0.9, stagger: 0.09 })
        .from(split.words, { autoAlpha: 0, yPercent: 28, duration: 0.65, stagger: 0.06 }, "<0.12")
        .from(split.chars, { autoAlpha: 0, yPercent: 18, duration: 0.45, stagger: 0.008 }, "-=0.52")
        .from("[data-hero-copy]", { y: 22, autoAlpha: 0, duration: 0.65 }, "-=0.25")
        .from("[data-hero-actions]", { y: 18, autoAlpha: 0, duration: 0.55 }, "-=0.35")
        .from("[data-hero-proof] > *", { y: 16, autoAlpha: 0, stagger: 0.08, duration: 0.5 }, "-=0.25")
        .from(heroDemo, { xPercent: 7, scale: 0.94, autoAlpha: 0, duration: 1.05 }, "-=0.72")
        .from(overlayWindowTarget, { rotateX: 8, rotateY: -10, transformPerspective: 1100, duration: 1.15, ease: "expo.out" }, "<")
        .from(overlayFrameTarget, { clipPath: "inset(0 0 100% 0 round 8px)", duration: 0.85, ease: "expo.inOut" }, "<0.08")
        .fromTo(productDetails || [], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.55, stagger: 0.1, immediateRender: false, clearProps: "opacity,visibility" }, "-=0.5")
        .fromTo(overlayControls || [], { x: -24, scale: 0.4, autoAlpha: 0 }, { x: 0, scale: 1, autoAlpha: 1, duration: 0.72, stagger: 0.035, ease: "elastic.out(1, 0.58)", immediateRender: false, clearProps: "transform,opacity,visibility" }, "-=0.42")
        .fromTo(overlayStatus || [], { y: -10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.055, immediateRender: false, clearProps: "transform,opacity,visibility" }, "-=0.5")
        .fromTo(overlayMessages || [], { y: 28, scale: 0.97, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.65, stagger: 0.1, immediateRender: false, clearProps: "transform,opacity,visibility" }, "-=0.36")
        .fromTo(overlayComposerTarget, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.55, immediateRender: false, clearProps: "transform,opacity,visibility" }, "-=0.42");
    }

    const productScan = heroDemo?.querySelector<HTMLElement>("[data-product-scan]");
    if (productScan) {
      gsap.fromTo(productScan, { yPercent: -120, autoAlpha: 0 }, {
        yPercent: 900,
        autoAlpha: 0.65,
        duration: 4.2,
        repeat: -1,
        repeatDelay: 1.4,
        ease: "none",
      });
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

    const sectionSplits = gsap.utils.toArray<HTMLElement>("[data-reveal] .display-type, [data-journey-stage] .display-type").map((heading) => {
      const headingSplit = SplitText.create(heading, { type: "lines,words", mask: "lines" });
      gsap.from(headingSplit.words, {
        yPercent: 105,
        rotate: 2,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.035,
        ease: "power4.out",
        scrollTrigger: { trigger: heading, start: "top 86%", toggleActions: "play none none reverse" },
      });
      return headingSplit;
    });
    cleanups.push(() => sectionSplits.forEach((headingSplit) => headingSplit.revert()));

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
      const overlayWindow = heroDemo?.querySelector<HTMLElement>(".home-overlay-window");
      if (heroDemo && overlayWindow) {
        const moveOverlay = (event: PointerEvent) => {
          const bounds = heroDemo.getBoundingClientRect();
          gsap.to(overlayWindow, {
            rotateX: ((event.clientY - bounds.top) / bounds.height - 0.5) * -3.2,
            rotateY: ((event.clientX - bounds.left) / bounds.width - 0.5) * 4.2,
            duration: 0.65,
            ease: "power3.out",
            overwrite: "auto",
          });
        };
        const resetOverlay = () => {
          gsap.to(overlayWindow, { rotateX: 0, rotateY: 0, duration: 0.65, ease: "power3.out", overwrite: "auto" });
        };
        heroDemo.addEventListener("pointermove", moveOverlay);
        heroDemo.addEventListener("pointerleave", resetOverlay);
        cleanups.push(() => {
          heroDemo.removeEventListener("pointermove", moveOverlay);
          heroDemo.removeEventListener("pointerleave", resetOverlay);
        });
      }

      const overlayControls = heroDemo?.querySelector<HTMLElement>(".overlay-demo-controls");
      if (overlayControls) {
        const animateControl = (event: PointerEvent, scale: number) => {
          const control = (event.target as Element).closest<HTMLElement>("button, label");
          if (!control || !overlayControls.contains(control)) return;
          gsap.to(control, {
            scale,
            duration: scale > 1 ? 0.22 : 0.7,
            ease: scale > 1 ? "power3.out" : "elastic.out(1, 0.45)",
            overwrite: "auto",
            ...(scale === 1 ? { clearProps: "transform" } : {}),
          });
        };
        const enterControl = (event: PointerEvent) => animateControl(event, 1.12);
        const leaveControl = (event: PointerEvent) => {
          const control = (event.target as Element).closest<HTMLElement>("button, label");
          if (control?.contains(event.relatedTarget as Node | null)) return;
          animateControl(event, 1);
        };
        overlayControls.addEventListener("pointerover", enterControl);
        overlayControls.addEventListener("pointerout", leaveControl);
        cleanups.push(() => {
          overlayControls.removeEventListener("pointerover", enterControl);
          overlayControls.removeEventListener("pointerout", leaveControl);
        });
      }

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