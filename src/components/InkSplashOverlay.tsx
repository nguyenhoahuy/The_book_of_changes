import React from "react";
import { motion } from "motion/react";

interface InkSplashOverlayProps {
  isSplashing: boolean;
  key?: React.Key;
}

export default function InkSplashOverlay({ isSplashing }: InkSplashOverlayProps) {
  if (!isSplashing) return null;

  // Splatter configurations: position, size, delay, and splash duration
  const splatters = [
    // Main central ink pool
    { cx: "50%", cy: "50%", r: "28vw", delay: 0.0, duration: 0.8, rotate: 12 },
    // Top-left supporting splash
    { cx: "25%", cy: "30%", r: "14vw", delay: 0.05, duration: 0.7, rotate: -45 },
    // Bottom-right supporting splash
    { cx: "75%", cy: "70%", r: "16vw", delay: 0.08, duration: 0.75, rotate: 30 },
    // Top-right minor splash
    { cx: "80%", cy: "25%", r: "10vw", delay: 0.12, duration: 0.65, rotate: 15 },
    // Bottom-left minor splash
    { cx: "20%", cy: "75%", r: "12vw", delay: 0.1, duration: 0.7, rotate: -20 },
    // Tiny dynamic droplets for splat realism
    { cx: "42%", cy: "35%", r: "4vw", delay: 0.15, duration: 0.5, rotate: 60 },
    { cx: "58%", cy: "65%", r: "5vw", delay: 0.18, duration: 0.5, rotate: -80 },
    { cx: "35%", cy: "60%", r: "3vw", delay: 0.22, duration: 0.45, rotate: 110 },
    { cx: "65%", cy: "40%", r: "4vw", delay: 0.2, duration: 0.5, rotate: -15 },
  ];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden">
      {/* SVG Filter definitions for the organic ink bleed & rough fibers look */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="ink-bleed-transition" x="-20%" y="-20%" width="140%" height="140%">
            {/* Generates organic fractal noise */}
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.045" 
              numOctaves="5" 
              result="noise" 
            />
            {/* Distorts the clean circles using the noise, creating ragged, bleeding edges */}
            <feDisplacementMap 
              in="SourceGraphic" 
              in2="noise" 
              scale="65" 
              xChannelSelector="R" 
              yChannelSelector="G" 
              result="displaced"
            />
            {/* Slightly blurs and sharpens to make the edges blend like wet ink on paper */}
            <feGaussianBlur in="displaced" stdDeviation="4" result="blurred" />
            <feComponentTransfer in="blurred" result="ink-edge">
              <feFuncA type="linear" slope="1.1" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      {/* Full-screen SVG canvas for the ink splatters */}
      <motion.svg
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 1, 0] }}
        transition={{ 
          times: [0, 0.5, 1],
          duration: 1.3, 
          ease: "easeInOut" 
        }}
        className="absolute inset-0 w-full h-full"
        style={{ 
          filter: "url(#ink-bleed-transition)",
          mixBlendMode: "multiply" // Darkens and blends perfectly with background texture
        }}
      >
        {splatters.map((s, idx) => (
          <motion.circle
            key={idx}
            cx={s.cx}
            cy={s.cy}
            // Animate radius to simulate brush impact and fast ink absorption
            initial={{ r: 0 }}
            animate={{ r: s.r }}
            transition={{
              duration: s.duration,
              delay: s.delay,
              ease: [0.1, 0.8, 0.2, 1] // Fast impact, slow settling
            }}
            fill="#09090a" // Ultra-dark charcoal ink color
            opacity={0.96}
          />
        ))}

        {/* Artistic paint streaks/lines to simulate quick brush strokes */}
        <motion.path
          d="M 20% 35% Q 40% 48% 80% 65%"
          fill="none"
          stroke="#09090a"
          strokeLinecap="round"
          initial={{ strokeWidth: 0, pathLength: 0, opacity: 0 }}
          animate={{ strokeWidth: "3.5vw", pathLength: 1, opacity: 0.9 }}
          transition={{
            duration: 0.8,
            delay: 0.05,
            ease: [0.16, 1, 0.3, 1]
          }}
        />
        <motion.path
          d="M 85% 20% Q 60% 50% 15% 80%"
          fill="none"
          stroke="#09090a"
          strokeLinecap="round"
          initial={{ strokeWidth: 0, pathLength: 0, opacity: 0 }}
          animate={{ strokeWidth: "2vw", pathLength: 1, opacity: 0.85 }}
          transition={{
            duration: 0.9,
            delay: 0.1,
            ease: [0.16, 1, 0.3, 1]
          }}
        />
      </motion.svg>

      {/* Subtle screen flash overlay to soften transition contrast */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.45, 0] }}
        transition={{ 
          times: [0, 0.4, 1],
          duration: 1.2,
          ease: "easeInOut"
        }}
        className="absolute inset-0 bg-black/60 mix-blend-overlay z-10"
      />
    </div>
  );
}
