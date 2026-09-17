"use client";

import { Code2, FileText, GripVertical, Mic, ShieldCheck } from "lucide-react";
import { PointerEvent as ReactPointerEvent, KeyboardEvent, useRef, useState } from "react";
import { LiveOverlayDemo } from "@/components/live-overlay-demo";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";

const MIN_POSITION = 5;
const MAX_POSITION = 95;
const INITIAL_POSITION = 50;

function clampPosition(value: number) {
  return Math.min(MAX_POSITION, Math.max(MIN_POSITION, value));
}

export function DragCompareHero() {
  const scope = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const positionRef = useRef(INITIAL_POSITION);
  const motionRef = useRef({ value: INITIAL_POSITION });
  const reducedMotionRef = useRef(false);
  const draggingRef = useRef(false);
  const [position, setPosition] = useState(INITIAL_POSITION);

  const applyPosition = (nextPosition: number) => {
    const container = containerRef.current;
    const reveal = revealRef.current;
    const divider = dividerRef.current;
    const handle = handleRef.current;
    if (!container || !reveal || !divider || !handle) return;

    const clamped = clampPosition(nextPosition);
    const pixelPosition = container.clientWidth * (clamped / 100);
    positionRef.current = clamped;
    motionRef.current.value = clamped;
    gsap.set(reveal, { clipPath: `inset(0 0 0 ${clamped}%)` });
    gsap.set([divider, handle], { x: pixelPosition });
    setPosition(Math.round(clamped));
  };

  const settleTo = (nextPosition: number) => {
    const target = clampPosition(nextPosition);
    gsap.killTweensOf(motionRef.current);
    if (reducedMotionRef.current) {
      applyPosition(target);
      return;
    }
    gsap.to(motionRef.current, {
      value: target,
      duration: 0.4,
      ease: "power3.out",
      onUpdate: () => applyPosition(motionRef.current.value),
    });
  };

  useGSAP(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    applyPosition(INITIAL_POSITION);

    let refreshTimer: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(() => {
      applyPosition(positionRef.current);
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 120);
    });
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      clearTimeout(refreshTimer);
      observer.disconnect();
      gsap.killTweensOf(motionRef.current);
    };
  }, { scope });

  const updateFromPointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const bounds = container.getBoundingClientRect();
    applyPosition(((event.clientX - bounds.left) / bounds.width) * 100);
  };

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    gsap.killTweensOf(motionRef.current);
    draggingRef.current = true;
    revealRef.current?.classList.add("is-dragging");
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current) return;
    updateFromPointer(event);
  };

  const finishDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    revealRef.current?.classList.remove("is-dragging");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    settleTo(Math.round(positionRef.current));
  };

  const handleKeyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step = event.shiftKey ? 10 : 2;
    let nextPosition: number | undefined;
    if (event.key === "ArrowLeft") nextPosition = positionRef.current - step;
    if (event.key === "ArrowRight") nextPosition = positionRef.current + step;
    if (event.key === "Home") nextPosition = MIN_POSITION;
    if (event.key === "End") nextPosition = MAX_POSITION;
    if (nextPosition === undefined) return;
    event.preventDefault();
    settleTo(nextPosition);
  };

  return (
    <section ref={scope} className="drag-compare" aria-label="Compare your private SmartyAI workspace with the shared view">
      <div className="drag-compare-labels" aria-hidden="true">
        <span data-compare-label>Your screen</span>
        <span data-compare-label>What they see</span>
      </div>

      <div ref={containerRef} className="drag-compare-frame">
        <div className="drag-compare-panel drag-compare-private" aria-hidden="true">
          <div className="compare-workspace-bar">
            <span><i /> Interview workspace</span>
            <span>Question 01 / 05</span>
          </div>
          <div className="compare-workspace-tabs">
            <span className="active"><FileText size={13} /> Brief</span>
            <span><Code2 size={13} /> Code</span>
            <span><Mic size={13} /> Transcript</span>
          </div>
          <div className="compare-workspace-body">
            <div className="compare-question-pane">
              <small>Live interview prompt</small>
              <h3>Design a reliable notification service.</h3>
              <p>Explain delivery guarantees, retries, observability, and how you would evolve the system as volume grows.</p>
              <div><b>Constraints</b><span>10M events / day</span><span>Multi-region delivery</span><span>User preference controls</span></div>
            </div>
            <div className="compare-code-pane">
              <div><span>architecture.ts</span><span>TypeScript</span></div>
              <pre><code>{`type Delivery = {
  channel: "email" | "push";
  status: "queued" | "sent";
};

async function dispatch(job) {
  await queue.publish(job);
  return { accepted: true };
}`}</code></pre>
            </div>
          </div>
          <div className="compare-private-badge"><ShieldCheck size={14} /> Private overlay visible to you</div>
        </div>

        <div ref={revealRef} className="drag-compare-panel drag-compare-live">
          <LiveOverlayDemo />
        </div>

        <div ref={dividerRef} className="drag-compare-divider" aria-hidden="true" />
        <button
          ref={handleRef}
          type="button"
          className="drag-compare-handle"
          role="slider"
          tabIndex={0}
          aria-label="Comparison divider"
          aria-valuemin={MIN_POSITION}
          aria-valuemax={MAX_POSITION}
          aria-valuenow={position}
          aria-valuetext={`${100 - position}% live shared view visible`}
          aria-orientation="horizontal"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onLostPointerCapture={finishDrag}
          onKeyDown={handleKeyboard}
        >
          <GripVertical aria-hidden="true" />
        </button>
      </div>

      <p className="drag-compare-helper">Drag the handle or use arrow keys to compare</p>
    </section>
  );
}