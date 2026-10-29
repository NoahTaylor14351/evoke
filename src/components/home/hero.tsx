"use client";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { socials, trackerUrl } from "@/src/config/socials";
import { HERO_REPLAY_EVENT } from "@/src/components/layout/navigation-link";
export function Hero() {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const media = video.current;
    if (!media) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let active = true;
    let playbackRequest = 0;
    let seen = false;
    try {
      seen = sessionStorage.getItem("evoke-film-v2") === "seen";
      sessionStorage.setItem("evoke-film-v2", "seen");
    } catch {}
    if (!seen && !reduced.matches) {
      setAnimate(true);
    }
    const replay = () => {
      const request = ++playbackRequest;
      media.pause();
      media.currentTime = 0;
      setPlaying(false);
      if (reduced.matches) return;
      media
        .play()
        .then(() => {
          if (active && request === playbackRequest) setPlaying(true);
        })
        .catch(() => {
          if (active && request === playbackRequest) setPlaying(false);
        });
    };
    const stop = () => {
      if (reduced.matches) {
        playbackRequest++;
        media.pause();
        setPlaying(false);
        setAnimate(false);
      }
    };
    replay();
    window.addEventListener(HERO_REPLAY_EVENT, replay);
    reduced.addEventListener("change", stop);
    return () => {
      active = false;
      playbackRequest++;
      window.removeEventListener(HERO_REPLAY_EVENT, replay);
      reduced.removeEventListener("change", stop);
      media.pause();
    };
  }, []);
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-film" aria-hidden="true">
        <img
          src="/assets/evoke/hero-poster.webp"
          alt=""
          fetchPriority="high"
          width="3000"
          height="1000"
        />
        <video
          ref={video}
          muted
          playsInline
          preload="none"
          poster="/assets/evoke/hero-poster.webp"
          className={playing ? "is-playing" : ""}
          onEnded={() => setPlaying(false)}
          onError={() => setPlaying(false)}
        >
          <source src="/assets/evoke/hero.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="hero-shade" />
      <div className="hero-caption container">
        <div className="hero-heading-block">
          <span className="eyebrow">EVOKE ESPORTS / EST 2026</span>
          <h1
            id="hero-heading"
            className={
              animate ? "hero-heading animate-heading" : "hero-heading"
            }
          >
            <span>BUILT TO</span>
            <span>COMPETE.</span>
          </h1>
        </div>
        <div className="hero-aside">
          <p>
            A competitive mindset.
            <br />A community to call your own.
          </p>
          <div className="hero-buttons">
            <a
              className="button"
              href={socials.discord}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join Discord
              <ArrowUpRight size={17} />
            </a>
            <Link className="button glass" href={trackerUrl} target="_blank" rel="noopener noreferrer">
              Our roster
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
      </div>
      <div className="hero-bottom container">
        <a href="#organisation">
          <ArrowDown size={14} /> Discover Evoke
        </a>
        <span>FORTNITE / CONTENT / COMMUNITY</span>
        <span>#ONLYEVOKE</span>
      </div>
    </section>
  );
}
