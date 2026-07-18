import React, { useEffect, useRef } from "react";

export default function GoldDustParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle specification for ancient gold dust
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      fadeSpeed: number;
      angle: number;
      spinSpeed: number;
      pulseSpeed: number;
    }

    const particles: Particle[] = [];
    const maxParticles = 65;

    function createParticle(initial = false): Particle {
      return {
        x: Math.random() * width,
        y: initial ? Math.random() * height : height + 10, // spawn at bottom or offscreen initially
        size: Math.random() * 2 + 0.6, // fine mist/gold dust
        speedX: (Math.random() * 0.3 - 0.15), // very slow lateral drift
        speedY: -(Math.random() * 0.4 + 0.1), // slowly floating upwards
        opacity: Math.random() * 0.4 + 0.1,
        fadeSpeed: Math.random() * 0.002 + 0.001,
        angle: Math.random() * Math.PI * 2,
        spinSpeed: Math.random() * 0.02 - 0.01,
        pulseSpeed: Math.random() * 0.01 + 0.005,
      };
    }

    // Initialize particles across the viewport height initially
    for (let i = 0; i < maxParticles; i++) {
      particles.push(createParticle(true));
    }

    function handleResize() {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    window.addEventListener("resize", handleResize);

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Apply physics/drift
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.angle) * 0.15; // gentle wavering movement
        p.angle += p.spinSpeed;

        // Periodic glow pulsing
        const currentOpacity = p.opacity + Math.sin(p.angle * p.pulseSpeed) * 0.1;
        const clampedOpacity = Math.max(0.05, Math.min(0.65, currentOpacity));

        // Draw the golden dust particle with soft feathering
        const gradient = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          p.size * 2.5
        );
        // Rich imperial amber gold gradient
        gradient.addColorStop(0, `rgba(212, 175, 55, ${clampedOpacity})`);
        gradient.addColorStop(0.3, `rgba(245, 158, 11, ${clampedOpacity * 0.4})`);
        gradient.addColorStop(1, "rgba(245, 158, 11, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Recycle particles that float out of the top, sides, or fade completely
        if (p.y < -10 || p.x < -10 || p.x > width + 10) {
          particles[i] = createParticle(false);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-1 pointer-events-none opacity-80"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
