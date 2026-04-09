"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";

import { BookingForm } from "@/components/booking-form";
import { ExperienceTitle } from "@/components/experience-title";
import { SectionGridImages } from "@/components/section-grid-images";
import { TextReveal } from "@/components/text-reveal";
import { estimateLineCount } from "@/lib/estimate-line-count";
import { revealAfterLines } from "@/lib/reveal-hierarchy";
import {
  EASE_TRANSFORM,
  GRID_IMAGE_INITIAL_BLUR_PX,
  GRID_IMAGE_INITIAL_SCALE,
  GRID_IMAGE_REVEAL_DURATION_S,
  GRID_REVEAL_TAIL_LINE_SLOTS,
} from "@/lib/reveal-motion";
import type { SiteContent, TopicKey } from "@/lib/site-content";

type ExperienceProps = {
  content: SiteContent;
  marqueeImages: string[];
  topicImages: Record<TopicKey, string[]>;
};

type ExperienceMode = "landing" | "signup" | TopicKey;
type HashMode = TopicKey | "register";

const MARQUEE_GROUP_COUNT = 7;
const MARQUEE_CENTER_GROUP_INDEX = Math.floor(MARQUEE_GROUP_COUNT / 2);
const MARQUEE_MAX_INTERACTION_VELOCITY = 5200;
const MARQUEE_INTERACTION_RESPONSE = 14.5;
const MARQUEE_INTERACTION_DAMPING = 7.8;
const MARQUEE_WHEEL_VELOCITY_GAIN = 10.25;
const MARQUEE_TOUCH_VELOCITY_GAIN = 12.5;

export function PastelMuseExperience({
  content,
  marqueeImages,
  topicImages,
}: ExperienceProps) {
  const [activeMode, setActiveMode] = useState<ExperienceMode>("landing");
  const [activeTopic, setActiveTopic] = useState<TopicKey | null>(null);
  const [isLandingInfoOpen, setIsLandingInfoOpen] = useState(false);
  const marqueeViewportRef = useRef<HTMLDivElement | null>(null);
  const marqueeGroupRef = useRef<HTMLDivElement | null>(null);
  const marqueeTrackRef = useRef<HTMLDivElement | null>(null);
  /** Phase inside one group width; repeated groups are positioned around the centered copy. */
  const marqueePhaseRef = useRef(0);
  const speedRef = useRef(26);
  const baseSpeedRef = useRef(26);
  const targetSpeedRef = useRef(26);
  const interactionVelocityRef = useRef(0);
  const interactionTargetVelocityRef = useRef(0);
  const isMarqueePausedRef = useRef(false);
  const prefersReducedMotionRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const [introState, setIntroState] = useState<"intro" | "reveal" | "idle">("intro");
  /** Bumps when returning to landing from a topic or signup so the marquee can re-enter in sync with line reveals. */
  const [marqueeLandingEnterSeq, setMarqueeLandingEnterSeq] = useState(0);
  const prevModeForMarqueeRef = useRef<ExperienceMode | null>(null);

  const activeContent = useMemo(
    () => content.topics.find((topic) => topic.key === activeTopic) ?? null,
    [activeTopic, content.topics],
  );
  const topicKeys = useMemo(() => new Set(content.topics.map((topic) => topic.key)), [content.topics]);

  const headerMetaReveal = useMemo(() => {
    let c = 0;
    const locationDelay = revealAfterLines(c);
    c += estimateLineCount(content.location);
    const dateDelay = revealAfterLines(c);
    return { locationDelay, dateDelay };
  }, [content.location]);

  const landingFooterReveal = useMemo(() => {
    /** One block so line breaks follow normal HTML flow (same joined string as the mobile info panel). */
    const introParagraph = content.introText.join(" ");
    const intro = [
      { paragraph: introParagraph, blockDelay: revealAfterLines(0) },
    ];
    let c = estimateLineCount(introParagraph);
    const registerDelay = revealAfterLines(c);
    c += estimateLineCount(content.registerLabel);
    const info: { line: string; blockDelay: number }[] = [];
    for (const line of content.infoLines) {
      info.push({ line, blockDelay: revealAfterLines(c) });
      c += estimateLineCount(line);
    }
    return { intro, registerDelay, info };
  }, [content.introText, content.registerLabel, content.infoLines]);

  const signupViewReveal = useMemo(() => {
    const introParagraph = content.signup.intro.join(" ");
    const intro = [
      { paragraph: introParagraph, blockDelay: revealAfterLines(0) },
    ];
    let c = estimateLineCount(introParagraph);
    const titleDelay = revealAfterLines(c);
    c += estimateLineCount(content.signup.title);
    const formBaseLines = c;
    return { intro, titleDelay, formBaseLines };
  }, [content.signup]);

  const topicReveal = useMemo(() => {
    if (!activeContent) {
      return null;
    }
    let c = 0;
    const personDelay = revealAfterLines(c);
    c += estimateLineCount(activeContent.person);
    const descriptions = activeContent.description.map((paragraph) => {
      const blockDelay = revealAfterLines(c);
      c += estimateLineCount(paragraph);
      return { paragraph, blockDelay };
    });
    const ctaDelay = revealAfterLines(c);
    c += estimateLineCount(activeContent.ctaLabel);
    const gridFirstLineIndex = c;
    const stickyLineIndex = gridFirstLineIndex + GRID_REVEAL_TAIL_LINE_SLOTS;
    return {
      personDelay,
      descriptions,
      ctaDelay,
      gridFirstLineIndex,
      stickyLineIndex,
    };
  }, [activeContent]);

  const landingInfoOverlayReveal = useMemo(() => {
    let c = 0;
    const introJoined = content.introText.join(" ");
    const panelIntroDelay = revealAfterLines(c);
    c += estimateLineCount(introJoined);
    const info: { line: string; blockDelay: number }[] = [];
    for (const line of content.infoLines) {
      const blockDelay = revealAfterLines(c);
      info.push({ line, blockDelay });
      c += estimateLineCount(line);
    }
    return { panelIntroDelay, info };
  }, [content.introText, content.infoLines]);

  const marqueeTrack = useMemo(() => {
    return marqueeImages.slice(0, 56);
  }, [marqueeImages]);

  const parseHashMode = useCallback(
    (hash: string): ExperienceMode => {
      const normalized = hash.replace(/^#/, "").trim().toLowerCase();

      if (normalized === "register") {
        return "signup";
      }

      if (topicKeys.has(normalized as TopicKey)) {
        return normalized as TopicKey;
      }

      return "landing";
    },
    [topicKeys],
  );

  /** Landing or topic to return to when leaving the registration view (Back / toggle). */
  const modeBeforeSignupRef = useRef<ExperienceMode>("landing");
  /** One register CTA for the whole experience — delay is fixed at first paint (landing vs topic hash). */
  const [registerCtaRevealDelay] = useState(() => {
    const initialMode =
      typeof window === "undefined" ? "landing" : parseHashMode(window.location.hash);

    return initialMode !== "landing" && initialMode !== "signup" && topicReveal
      ? revealAfterLines(topicReveal.stickyLineIndex)
      : landingFooterReveal.registerDelay;
  });

  const applyMode = useCallback(
    (
      mode: ExperienceMode,
      options: {
        updateUrl?: boolean;
        replace?: boolean;
      } = {},
    ) => {
      setActiveMode(mode);
      setActiveTopic(mode === "landing" || mode === "signup" ? null : mode);
      if (mode !== "landing") {
        setIntroState("idle");
      }

      if (!options.updateUrl || typeof window === "undefined") {
        return;
      }

      const hash: HashMode | "" =
        mode === "landing" ? "" : mode === "signup" ? "register" : mode;
      const nextUrl = hash
        ? `${window.location.pathname}${window.location.search}#${hash}`
        : `${window.location.pathname}${window.location.search}`;
      const historyMethod = options.replace ? "replaceState" : "pushState";

      window.history[historyMethod](null, "", nextUrl);
    },
    [],
  );

  const toggleRegisterMode = useCallback(() => {
    if (activeMode === "signup") {
      applyMode(modeBeforeSignupRef.current, { updateUrl: true });
    } else {
      modeBeforeSignupRef.current = activeMode;
      applyMode("signup", { updateUrl: true });
    }
  }, [activeMode, applyMode]);

  const handlePreloaderSnapComplete = useCallback(() => {
    setIntroState("reveal");
  }, []);

  const handleLandingTitleClick = useCallback(() => {
    applyMode("landing", { updateUrl: true });
  }, [applyMode]);

  const closeLandingInfo = useCallback(() => {
    setIsLandingInfoOpen(false);
  }, []);

  const toggleLandingInfo = useCallback(() => {
    setIsLandingInfoOpen((current) => !current);
  }, []);

  const syncMarqueeTargetSpeed = useCallback(() => {
    if (prefersReducedMotionRef.current) {
      targetSpeedRef.current = 0;
      return;
    }

    const ambientVelocity = isMarqueePausedRef.current ? 0 : baseSpeedRef.current;
    targetSpeedRef.current = ambientVelocity + interactionVelocityRef.current;
  }, []);

  useEffect(() => {
    if (introState !== "reveal") {
      return;
    }
    const durationMs = 900;
    const id = window.setTimeout(() => {
      setIntroState("idle");
    }, durationMs);
    return () => window.clearTimeout(id);
  }, [introState]);

  useEffect(() => {
    const prev = prevModeForMarqueeRef.current;
    prevModeForMarqueeRef.current = activeMode;
    if (prev === null) {
      return;
    }
    if (activeMode === "landing" && prev !== "landing") {
      setMarqueeLandingEnterSeq((n) => n + 1);
    }
  }, [activeMode]);

  useLayoutEffect(() => {
    if (activeMode !== "landing" || marqueeLandingEnterSeq === 0) {
      return;
    }

    const el = marqueeViewportRef.current;
    if (!el) {
      return;
    }

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.killTweensOf(el);

    if (reduceMotion) {
      gsap.fromTo(
        el,
        { opacity: 0 },
        { opacity: 1, duration: 0.32, ease: "power1.out" },
      );
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        {
          opacity: 0,
          y: 22,
          scale: GRID_IMAGE_INITIAL_SCALE,
          transformOrigin: "50% 50%",
          filter: `blur(${GRID_IMAGE_INITIAL_BLUR_PX}px)`,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: GRID_IMAGE_REVEAL_DURATION_S,
          ease: EASE_TRANSFORM,
        },
      );
    }, el);

    return () => {
      ctx.revert();
    };
  }, [activeMode, marqueeLandingEnterSeq]);

  useEffect(() => {
    if (activeMode === "landing") {
      return;
    }

    setIsLandingInfoOpen(false);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [activeMode]);

  useEffect(() => {
    if (!isLandingInfoOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLandingInfoOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLandingInfoOpen]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncFromHash = () => {
      applyMode(parseHashMode(window.location.hash));
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
    };
  }, [applyMode, parseHashMode]);

  useEffect(() => {
    if (activeMode !== "landing") {
      return;
    }

    const viewport = marqueeViewportRef.current;
    const group = marqueeGroupRef.current;
    const track = marqueeTrackRef.current;

    if (!viewport || !group || !track || marqueeTrack.length === 0) {
      return;
    }

    const normalizeMarqueePhase = (phase: number, width: number) => {
      if (width === 0) {
        return 0;
      }

      return ((phase % width) + width) % width;
    };

    const clampInteractionVelocity = (velocity: number) => {
      return Math.max(
        -MARQUEE_MAX_INTERACTION_VELOCITY,
        Math.min(MARQUEE_MAX_INTERACTION_VELOCITY, velocity),
      );
    };

    const normalizeWheelDelta = (event: WheelEvent) => {
      if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        return event.deltaY * 16;
      }

      if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        return event.deltaY * window.innerHeight;
      }

      return event.deltaY;
    };

    const applyInteractionVelocity = (deltaY: number, gain: number, elapsedMs: number) => {
      if (!Number.isFinite(deltaY) || deltaY === 0 || prefersReducedMotionRef.current) {
        return;
      }

      const boundedElapsedMs = Math.max(4, Math.min(elapsedMs, 180));
      const gestureSpeed = Math.abs(deltaY) / boundedElapsedMs;
      const speedBoost =
        1 + Math.min(12, Math.pow(Math.max(0, gestureSpeed - 0.82), 1.1) * 1.22);
      const distanceBoost =
        1 + Math.min(2.2, Math.pow(Math.abs(deltaY) / 140, 0.84) * 0.52);
      const impulse = -deltaY * gain * speedBoost * distanceBoost;

      interactionTargetVelocityRef.current = clampInteractionVelocity(
        interactionTargetVelocityRef.current + impulse,
      );
      syncMarqueeTargetSpeed();
    };

    const rootStyles = getComputedStyle(document.documentElement);
    baseSpeedRef.current = Number.parseFloat(rootStyles.getPropertyValue("--marquee-speed")) || 26;
    const easing = Number.parseFloat(rootStyles.getPropertyValue("--marquee-ease")) || 0.085;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let previousTime = performance.now();
    let groupWidth = 0;
    track.style.transform = "";

    const applyTransform = () => {
      if (groupWidth === 0) {
        return;
      }

      groups.forEach((groupEl, index) => {
        const x = (index - MARQUEE_CENTER_GROUP_INDEX) * groupWidth - marqueePhaseRef.current;
        groupEl.style.transform = `translate3d(${x}px, 0, 0)`;
      });
    };

    const groups = Array.from(track.querySelectorAll<HTMLElement>(".marquee__group"));

    const measure = () => {
      const measuredGroup = marqueeGroupRef.current;
      if (measuredGroup) {
        groupWidth = measuredGroup.getBoundingClientRect().width;
      } else {
        groupWidth = group.scrollWidth;
      }

      if (groupWidth === 0) {
        return;
      }

      track.style.height = `${group.getBoundingClientRect().height}px`;
      marqueePhaseRef.current = normalizeMarqueePhase(marqueePhaseRef.current, groupWidth);
      applyTransform();
    };

    const step = (time: number) => {
      const delta = Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;

      const interactionDelta =
        interactionTargetVelocityRef.current - interactionVelocityRef.current;
      const attraction = interactionDelta * MARQUEE_INTERACTION_RESPONSE;
      const damping = interactionVelocityRef.current * MARQUEE_INTERACTION_DAMPING;
      interactionVelocityRef.current += (attraction - damping) * delta;
      interactionTargetVelocityRef.current *= Math.exp(-MARQUEE_INTERACTION_DAMPING * 0.72 * delta);

      if (Math.abs(interactionTargetVelocityRef.current) < 0.01) {
        interactionTargetVelocityRef.current = 0;
      }
      if (Math.abs(interactionVelocityRef.current) < 0.01) {
        interactionVelocityRef.current = 0;
      }
      syncMarqueeTargetSpeed();
      speedRef.current += (targetSpeedRef.current - speedRef.current) * easing;

      if (Math.abs(speedRef.current) < 0.01 && targetSpeedRef.current === 0) {
        speedRef.current = 0;
      }

      if (groupWidth > 0 && speedRef.current !== 0) {
        marqueePhaseRef.current += speedRef.current * delta;
        marqueePhaseRef.current = normalizeMarqueePhase(marqueePhaseRef.current, groupWidth);
      }

      applyTransform();
      frameRef.current = window.requestAnimationFrame(step);
    };

    const syncMotionPreference = () => {
      prefersReducedMotionRef.current = reduceMotion.matches;

      if (prefersReducedMotionRef.current) {
        interactionVelocityRef.current = 0;
        interactionTargetVelocityRef.current = 0;
        syncMarqueeTargetSpeed();
        speedRef.current = 0;
        applyTransform();
      } else if (speedRef.current === 0 && !isMarqueePausedRef.current) {
        speedRef.current = baseSpeedRef.current;
        syncMarqueeTargetSpeed();
      } else {
        syncMarqueeTargetSpeed();
      }
    };

    prefersReducedMotionRef.current = reduceMotion.matches;
    interactionVelocityRef.current = 0;
    interactionTargetVelocityRef.current = 0;
    speedRef.current = prefersReducedMotionRef.current ? 0 : baseSpeedRef.current;
    syncMarqueeTargetSpeed();

    measure();
    frameRef.current = window.requestAnimationFrame(step);

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(viewport);
    resizeObserver.observe(group);
    reduceMotion.addEventListener("change", syncMotionPreference);

    const images = Array.from(group.querySelectorAll<HTMLImageElement>("img"));
    images.forEach((image) => {
      if (image.complete) {
        return;
      }

      image.addEventListener("load", measure);
      image.addEventListener("error", measure);
    });

    let touchY: number | null = null;
    let lastWheelEventAt = 0;
    let lastTouchMoveAt = 0;
    const nonPassiveListenerOptions: AddEventListenerOptions = { passive: false };
    const handleWheel: EventListener = (event) => {
      const wheelEvent = event as WheelEvent;
      if (wheelEvent.ctrlKey) {
        return;
      }

      const deltaY = normalizeWheelDelta(wheelEvent);
      if (deltaY === 0) {
        return;
      }

      if (wheelEvent.cancelable) {
        wheelEvent.preventDefault();
      }
      const now = performance.now();
      const elapsedMs = lastWheelEventAt === 0 ? 16 : now - lastWheelEventAt;
      lastWheelEventAt = now;
      applyInteractionVelocity(deltaY, MARQUEE_WHEEL_VELOCITY_GAIN, elapsedMs);
    };
    const handleTouchStart: EventListener = (event) => {
      const touchEvent = event as TouchEvent;
      touchY = touchEvent.touches.length === 1 ? touchEvent.touches[0]?.clientY ?? null : null;
      lastTouchMoveAt = performance.now();
    };
    const handleTouchMove: EventListener = (event) => {
      const touchEvent = event as TouchEvent;
      if (touchEvent.touches.length !== 1) {
        touchY = null;
        return;
      }

      const nextTouchY = touchEvent.touches[0]?.clientY ?? null;
      if (nextTouchY === null) {
        touchY = null;
        return;
      }

      if (touchY === null) {
        touchY = nextTouchY;
        return;
      }

      const deltaY = nextTouchY - touchY;
      touchY = nextTouchY;
      if (deltaY === 0) {
        return;
      }

      if (touchEvent.cancelable) {
        touchEvent.preventDefault();
      }
      const now = performance.now();
      const elapsedMs = lastTouchMoveAt === 0 ? 16 : now - lastTouchMoveAt;
      lastTouchMoveAt = now;
      applyInteractionVelocity(deltaY, MARQUEE_TOUCH_VELOCITY_GAIN, elapsedMs);
    };
    const clearTouchGesture: EventListener = () => {
      touchY = null;
      lastTouchMoveAt = 0;
    };

    window.addEventListener("wheel", handleWheel, nonPassiveListenerOptions);
    window.addEventListener("touchstart", handleTouchStart, nonPassiveListenerOptions);
    window.addEventListener("touchmove", handleTouchMove, nonPassiveListenerOptions);
    window.addEventListener("touchend", clearTouchGesture, nonPassiveListenerOptions);
    window.addEventListener("touchcancel", clearTouchGesture, nonPassiveListenerOptions);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      resizeObserver.disconnect();
      reduceMotion.removeEventListener("change", syncMotionPreference);
      images.forEach((image) => {
        image.removeEventListener("load", measure);
        image.removeEventListener("error", measure);
      });
      groups.forEach((groupEl) => {
        groupEl.style.transform = "";
      });
      track.style.height = "";
      window.removeEventListener("wheel", handleWheel, nonPassiveListenerOptions);
      window.removeEventListener("touchstart", handleTouchStart, nonPassiveListenerOptions);
      window.removeEventListener("touchmove", handleTouchMove, nonPassiveListenerOptions);
      window.removeEventListener("touchend", clearTouchGesture, nonPassiveListenerOptions);
      window.removeEventListener("touchcancel", clearTouchGesture, nonPassiveListenerOptions);
      interactionVelocityRef.current = 0;
      interactionTargetVelocityRef.current = 0;
      syncMarqueeTargetSpeed();
    };
  }, [activeMode, marqueeTrack.length, syncMarqueeTargetSpeed]);

  const onLanding = activeMode === "landing";
  const showTitleIntro = onLanding && introState === "intro";
  const showPreloaderShell = onLanding && introState !== "idle";

  const navRowRef = useRef<HTMLDivElement | null>(null);
  const navDockedRef = useRef(false);
  const pinScrollYRef = useRef(0);
  const [navDocked, setNavDocked] = useState(false);
  const [navRowPadHeight, setNavRowPadHeight] = useState(0);

  const syncNavDock = useCallback(() => {
    const el = navRowRef.current;
    if (!el) {
      return;
    }

    if (!navDockedRef.current) {
      pinScrollYRef.current = el.getBoundingClientRect().top + window.scrollY;
    }

    const shouldDock = window.scrollY >= pinScrollYRef.current - 1;
    if (shouldDock !== navDockedRef.current) {
      navDockedRef.current = shouldDock;
      setNavDocked(shouldDock);
    }
  }, []);

  useLayoutEffect(() => {
    navDockedRef.current = false;
    setNavDocked(false);

    const el = navRowRef.current;
    if (!el) {
      return;
    }

    pinScrollYRef.current = el.getBoundingClientRect().top + window.scrollY;
    setNavRowPadHeight(el.offsetHeight);

    const shouldDock = window.scrollY >= pinScrollYRef.current - 1;
    navDockedRef.current = shouldDock;
    setNavDocked(shouldDock);
  }, [activeMode, introState, showPreloaderShell]);

  useLayoutEffect(() => {
    const el = navRowRef.current;
    if (!el) {
      return;
    }

    const ro = new ResizeObserver(() => {
      setNavRowPadHeight(el.offsetHeight);
      if (!navDockedRef.current) {
        pinScrollYRef.current = el.getBoundingClientRect().top + window.scrollY;
      }
      syncNavDock();
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [syncNavDock]);

  useEffect(() => {
    const opts: AddEventListenerOptions = { passive: true };
    window.addEventListener("scroll", syncNavDock, opts);
    window.addEventListener("resize", syncNavDock);
    return () => {
      window.removeEventListener("scroll", syncNavDock, opts);
      window.removeEventListener("resize", syncNavDock);
    };
  }, [syncNavDock]);

  return (
    <>
      <main
        className={`experience ${
          activeMode === "landing" ? "experience--landing" : "experience--detail"
        }${showPreloaderShell ? " experience--preloader" : ""}${
          introState === "reveal" ? " experience--preloader-reveal" : ""
        }${introState === "intro" ? " experience--preloader-intro" : ""}`}
        aria-busy={showPreloaderShell}
      >
        {showPreloaderShell ? (
          <div className="experience__preloader-overlay" aria-hidden="true" />
        ) : null}
        <section className="experience__shell">
          <header className="experience__header">
            <ExperienceTitle
              label={content.projectTitle}
              preloader={showTitleIntro}
              onPreloaderComplete={handlePreloaderSnapComplete}
              onClick={handleLandingTitleClick}
            />
            {navDocked ? (
              <div
                className="experience__nav-row-placeholder"
                style={{ height: navRowPadHeight }}
                aria-hidden
              />
            ) : null}
            <div
              ref={navRowRef}
              className={`experience__nav-row${navDocked ? " experience__nav-row--docked" : ""}`}
            >
              <nav className="experience__nav" aria-label="Topic navigation">
                {content.topics.map((topic) => {
                  const selected = activeTopic === topic.key;

                  return (
                    <button
                      key={topic.key}
                      className={`experience__nav-item link-underline ${selected ? "is-active" : ""}`}
                      type="button"
                      onClick={() => {
                        applyMode(activeMode === topic.key ? "landing" : topic.key, {
                          updateUrl: true,
                        });
                      }}
                    >
                      {topic.label}
                    </button>
                  );
                })}
              </nav>

              <div className="experience__meta">
                <TextReveal
                  as="span"
                  text={content.location}
                  blockDelay={headerMetaReveal.locationDelay}
                />
                <TextReveal
                  as="span"
                  text={content.date}
                  blockDelay={headerMetaReveal.dateDelay}
                />
              </div>
            </div>
          </header>

          <section className="experience__main">
            {activeMode === "signup" ? (
              <article className="apply-view">
                <div className="apply-view__intro">
                  <div className="apply-view__copy">
                    {signupViewReveal.intro.map(({ paragraph, blockDelay }) => (
                      <TextReveal key={paragraph} text={paragraph} blockDelay={blockDelay} />
                    ))}
                  </div>
                  <TextReveal
                    as="h2"
                    text={content.signup.title}
                    blockDelay={signupViewReveal.titleDelay}
                  />
                </div>
                <div className="apply-view__form">
                  <BookingForm revealBaseLines={signupViewReveal.formBaseLines} />
                </div>
              </article>
            ) : activeContent && topicReveal ? (
              <article className="topic-detail">
                <div className="topic-detail__intro">
                  <div className="topic-detail__heading">
                    <TextReveal
                      as="h2"
                      text={activeContent.person}
                      blockDelay={topicReveal.personDelay}
                      renderLine={(line) => (
                        <a
                          href={activeContent.personUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="topic-detail__heading-link interactive interactive--accent"
                        >
                          {line}
                        </a>
                      )}
                    />
                  </div>

                  <div className="topic-detail__copy">
                    {topicReveal.descriptions.map(({ paragraph, blockDelay }) => (
                      <TextReveal key={paragraph} text={paragraph} blockDelay={blockDelay} />
                    ))}
                  </div>

                  <a
                    className="topic-detail__link interactive interactive--accent"
                    href={activeContent.ctaUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <TextReveal
                      as="span"
                      text={activeContent.ctaLabel}
                      blockDelay={topicReveal.ctaDelay}
                    />
                  </a>
                </div>

                <SectionGridImages
                  images={topicImages[activeContent.key]}
                  firstLineIndex={topicReveal.gridFirstLineIndex}
                />
              </article>
            ) : (
              <div className="landing-panel">
                <div
                  ref={marqueeViewportRef}
                  className="marquee"
                  aria-hidden="true"
                  onMouseEnter={() => {
                    isMarqueePausedRef.current = true;
                    syncMarqueeTargetSpeed();
                  }}
                  onMouseLeave={() => {
                    isMarqueePausedRef.current = false;
                    syncMarqueeTargetSpeed();
                  }}
                  onFocusCapture={() => {
                    isMarqueePausedRef.current = true;
                    syncMarqueeTargetSpeed();
                  }}
                  onBlurCapture={() => {
                    isMarqueePausedRef.current = false;
                    syncMarqueeTargetSpeed();
                  }}
                >
                  <div ref={marqueeTrackRef} className="marquee__track">
                    {Array.from({ length: MARQUEE_GROUP_COUNT }, (_, groupIndex) => (
                      <div
                        key={groupIndex}
                        ref={groupIndex === 0 ? marqueeGroupRef : undefined}
                        className="marquee__group"
                      >
                        {marqueeTrack.map((image, index) => (
                          <figure key={`${groupIndex}-${image}-${index}`} className="marquee__item">
                            <img src={image} alt="" />
                          </figure>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="landing-panel__footer">
                  <div className="landing-panel__description">
                    {landingFooterReveal.intro.map(({ paragraph, blockDelay }) => (
                      <TextReveal key={paragraph} text={paragraph} blockDelay={blockDelay} />
                    ))}
                  </div>

                  <div className="landing-panel__footer-sentinel" aria-hidden="true" />

                  <div className="landing-panel__info">
                    {landingFooterReveal.info.map(({ line, blockDelay }) => {
                      const ig = line.match(/^@([a-zA-Z0-9._]+)$/);
                      return (
                        <p key={line}>
                          <TextReveal
                            as="span"
                            text={line}
                            blockDelay={blockDelay}
                            {...(ig
                              ? {
                                  renderLine: (t: string) => (
                                    <a
                                      className="text-link text-link--drawn"
                                      href={`https://www.instagram.com/${ig[1]}/`}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      {t}
                                    </a>
                                  ),
                                }
                              : {})}
                          />
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>
        </section>

        <div className="landing-panel__cta sticky-register experience__register-cta">
          <button
            className={`sticky-register__button landing-panel__register-button interactive${
              activeMode === "signup" ? "" : " interactive--accent"
            }`}
            type="button"
            onClick={
              activeMode === "signup"
                ? () => applyMode(modeBeforeSignupRef.current, { updateUrl: true })
                : toggleRegisterMode
            }
          >
            {/* Keep register TextReveal mounted; hide on signup so Back does not replay the reveal or resize the label */}
            <span
              className={
                activeMode === "signup"
                  ? "experience__register-cta-layer experience__register-cta-layer--concealed"
                  : "experience__register-cta-layer"
              }
              aria-hidden={activeMode === "signup"}
            >
              <TextReveal
                playOnce
                as="span"
                text={content.registerLabel}
                blockDelay={registerCtaRevealDelay}
              />
            </span>
            {activeMode === "signup" ? (
              <span className="experience__register-cta-layer experience__register-cta-layer--back">
                Back
              </span>
            ) : null}
          </button>
        </div>
      </main>

      {onLanding ? (
        <div
          id="landing-info-panel"
          className={`landing-info-panel${isLandingInfoOpen ? " is-open" : ""}`}
          role="region"
          aria-label="Pastel Muse details"
        >
          <button
            className="landing-info-panel__toggle interactive"
            type="button"
            aria-label={isLandingInfoOpen ? "Collapse footer details" : "Expand footer details"}
            aria-controls="landing-info-panel-body"
            aria-expanded={isLandingInfoOpen}
            onClick={toggleLandingInfo}
          >
            <span className="landing-info-panel__toggle-icon" aria-hidden="true" />
          </button>

          {isLandingInfoOpen ? (
            <div id="landing-info-panel-body" className="landing-info-panel__body">
              <div className="landing-info-panel__description">
                <TextReveal
                  text={content.introText.join(" ")}
                  blockDelay={landingInfoOverlayReveal.panelIntroDelay}
                />
              </div>

              <div className="landing-info-panel__info">
                {landingInfoOverlayReveal.info.map(({ line, blockDelay }) => {
                  const ig = line.match(/^@([a-zA-Z0-9._]+)$/);

                  return (
                    <TextReveal
                      key={`overlay-${line}`}
                      as="p"
                      className="landing-info-panel__info-line"
                      text={line}
                      blockDelay={blockDelay}
                      {...(ig
                        ? {
                            renderLine: (t: string) => (
                              <a
                                className="text-link text-link--drawn landing-info-panel__info-link"
                                href={`https://www.instagram.com/${ig[1]}/`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {t}
                              </a>
                            ),
                          }
                        : {})}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
