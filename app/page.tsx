"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const thoughts = [
  "Struttura DB per le US...",
  "Matrice di Harris → grafo diretto",
  "Plugin QGIS: tabs → modules → db",
  "Export PDF schede US",
  "class UnitaStratigrafica:",
  "Scavo → Dati → Analisi → Report",
  "GIS layer: fase cronologica",
  "def connection(self):",
  "from ..modules.db import Utility",
  "Periodizzazione automatica",
];

function ThoughtBubble({ text, index }: { text: string; index: number }) {
  const positions = [
    { left: "8%", bottom: "55%" },
    { left: "3%", bottom: "40%" },
    { left: "12%", bottom: "70%" },
    { right: "8%", bottom: "50%" },
    { right: "3%", bottom: "65%" },
    { right: "15%", bottom: "45%" },
    { left: "5%", bottom: "30%" },
    { right: "10%", bottom: "35%" },
  ];
  const pos = positions[index % positions.length];

  return (
    <div
      className="absolute animate-thought pointer-events-none"
      style={{
        ...pos,
        animationDelay: `${index * 3.5}s`,
        animationDuration: "8s",
      }}
    >
      {/* Cloud shape */}
      <div className="relative">
        <div className="bg-primary/80 backdrop-blur-md border border-teal/20 rounded-2xl px-5 py-3 shadow-lg shadow-teal/5 max-w-[220px]">
          <p className="text-sand/80 text-xs font-mono leading-relaxed whitespace-nowrap">
            {text}
          </p>
        </div>
        {/* Trailing dots */}
        <div className="absolute -bottom-3 left-8 w-3 h-3 rounded-full bg-primary/70 border border-teal/15" />
        <div className="absolute -bottom-6 left-5 w-2 h-2 rounded-full bg-primary/60 border border-teal/10" />
        <div className="absolute -bottom-8 left-3 w-1.5 h-1.5 rounded-full bg-primary/50 border border-teal/10" />
      </div>
    </div>
  );
}

function FloatingParticle({ delay, duration, left }: { delay: number; duration: number; left: string }) {
  return (
    <div
      className="absolute w-1 h-1 rounded-full animate-float-up pointer-events-none"
      style={{
        left,
        bottom: "-5%",
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        backgroundColor: delay % 3 === 0 ? "#00D4AA" : delay % 3 === 1 ? "#D4712A" : "#8B7355",
        opacity: 0.3 + Math.random() * 0.3,
      }}
    />
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [transitioning, setTransitioning] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleEnter = () => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => router.push("/home"), 1200);
  };

  // Generate stable particles
  const particles = Array.from({ length: 30 }, (_, i) => ({
    delay: i * 1.2 + Math.random() * 2,
    duration: 12 + Math.random() * 8,
    left: `${5 + (i * 3.1) % 90}%`,
  }));

  return (
    <div
      className="fixed inset-0 bg-primary overflow-hidden cursor-pointer"
      onClick={handleEnter}
      onWheel={handleEnter}
    >
      {/* Video background */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoadedData={() => setLoaded(true)}
      >
        <source src="/videos/pyarchinit_studio_grade.mp4" type="video/mp4" />
      </video>

      {/* Subtle overlay gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-primary/40" />

      {/* Floating particles */}
      {particles.map((p, i) => (
        <FloatingParticle key={i} {...p} />
      ))}

      {/* Thought bubbles */}
      {thoughts.map((text, i) => (
        <ThoughtBubble key={i} text={text} index={i} />
      ))}

      {/* Magnifier hint */}
      <div
        className={`absolute top-6 right-6 transition-all duration-1000 delay-[2s] ${
          loaded ? "opacity-60" : "opacity-0"
        }`}
      >
        <div className="flex items-center gap-2 text-sand/40 text-xs">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span className="font-mono">Passa il mouse per esplorare</span>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-10">
        <div
          className={`transition-all duration-1000 delay-[1s] ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* pyArchInit logo text */}
          <h1 className="text-3xl md:text-5xl font-mono font-bold text-sand mb-2 text-center tracking-tight">
            py<span className="text-teal">ArchInit</span>
          </h1>
          <p className="text-sand/50 text-sm md:text-base text-center mb-8 max-w-md mx-auto px-4">
            Piattaforma Open Source per l&apos;Archeologia Digitale
          </p>

          {/* Enter button */}
          <button
            onClick={handleEnter}
            className="group flex flex-col items-center gap-3"
          >
            <span className="text-sand/60 text-sm font-mono tracking-[0.3em] uppercase group-hover:text-teal transition-colors">
              Scopri
            </span>
            <div className="animate-bounce-slow">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-teal/60 group-hover:text-teal transition-colors"
              >
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* Transition overlay */}
      <div
        className={`fixed inset-0 bg-primary transition-all pointer-events-none ${
          transitioning
            ? "opacity-100 duration-1000"
            : "opacity-0 duration-500"
        }`}
      />

      {/* Custom animations */}
      <style jsx>{`
        @keyframes thought {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.8);
          }
          10% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          35% {
            opacity: 1;
            transform: translateY(-10px) scale(1);
          }
          45% {
            opacity: 0;
            transform: translateY(-30px) scale(0.9);
          }
          100% {
            opacity: 0;
            transform: translateY(-30px) scale(0.9);
          }
        }
        .animate-thought {
          animation: thought 8s ease-in-out infinite;
          opacity: 0;
        }
        @keyframes float-up {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.5;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(-110vh) translateX(30px);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: float-up linear infinite;
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(6px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
