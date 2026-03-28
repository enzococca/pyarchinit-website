"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LandingScene } from "@/canvas/scene";

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<LandingScene | null>(null);
  const router = useRouter();
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new LandingScene(canvasRef.current, () => {
      setTransitioning(true);
      setTimeout(() => router.push("/home"), 800);
    });

    sceneRef.current = scene;
    scene.start();

    return () => scene.stop();
  }, [router]);

  const handleEnter = () => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => router.push("/home"), 800);
  };

  return (
    <div className="fixed inset-0 bg-primary overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onClick={handleEnter}
        onWheel={handleEnter}
      />
      <div
        className={`fixed inset-0 bg-primary transition-opacity duration-700 pointer-events-none ${
          transitioning ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
