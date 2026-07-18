/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { TRIGRAMS, HEXAGRAMS_DB } from "../data/ichingData";
import { Trigram } from "../types";
import { Compass, Sparkles, Wind, Droplets, Flame, Mountain, Eye } from "lucide-react";

const trigramVietnameseDetails: Record<string, {
  name: string;
  nature: string;
  element: string;
  attribute: string;
  direction: string;
  description: string;
}> = {
  qian: {
    name: "Quẻ Càn (Trời)",
    nature: "Thiên (Trời)",
    element: "Kim",
    attribute: "Cương kiện, Sáng tạo, Mạnh mẽ",
    direction: "Tây Bắc",
    description: "Sức mạnh Sáng tạo tối cao, đại diện cho bầu trời, người cha, sự dẫn dắt và năng lượng Dương thuần khiết."
  },
  kun: {
    name: "Quẻ Khôn (Đất)",
    nature: "Địa (Đất)",
    element: "Thổ",
    attribute: "Nhu thuận, Tiếp thu, Nuôi dưỡng",
    direction: "Tây Nam",
    description: "Sự Nâng đỡ vĩ đại, đại diện cho người mẹ, đất mẹ, sự bao dung và năng lượng Âm thuần khiết."
  },
  zhen: {
    name: "Quẻ Chấn (Sấm)",
    nature: "Lôi (Sấm sét)",
    element: "Lôi",
    attribute: "Chấn động, Khởi phát, Thức tỉnh",
    direction: "Đông",
    description: "Tiếng sấm khởi động sự đổi thay, mang đến sự sinh trưởng mới, đánh thức tâm thức tiềm ẩn."
  },
  xun: {
    name: "Quẻ Tốn (Gió)",
    nature: "Phong (Gió / Gỗ)",
    element: "Mộc",
    attribute: "Thâm nhập, Uyển chuyển, Nhẹ nhàng",
    direction: "Đông Nam",
    description: "Cơn gió dịu nhẹ nhưng sâu sắc, lan tỏa tầm ảnh hưởng liên tục, phát triển một cách tự nhiên và bền bỉ."
  },
  kan: {
    name: "Quẻ Khảm (Nước)",
    nature: "Thủy (Nước sâu / Hiểm nguy)",
    element: "Thủy",
    attribute: "Hiểm nguy, Thâm sâu, Trực giác",
    direction: "Bắc",
    description: "Vực nước thâm sâu, tượng trưng cho thử thách, cảm xúc nội tâm sâu sắc, dòng chảy trực giác và bí ẩn."
  },
  li: {
    name: "Quẻ Ly (Lửa)",
    nature: "Hỏa (Lửa / Mặt trời)",
    element: "Hỏa",
    attribute: "Sáng tỏ, Văn minh, Kết nối",
    direction: "Nam",
    description: "Ngọn lửa tỏa sáng rực rỡ, đại diện cho sự hiểu biết, trí tuệ soi sáng, đam mê và giác ngộ."
  },
  gen: {
    name: "Quẻ Cấn (Núi)",
    nature: "Sơn (Núi vững)",
    element: "Thổ",
    attribute: "Ngưng nghỉ, Tĩnh lặng, Vững vàng",
    direction: "Đông Bắc",
    description: "Ngọn núi tĩnh lặng, biểu thị sự dừng lại đúng lúc, thiền định, sự kiên định tĩnh tâm để tích lũy nội lực."
  },
  dui: {
    name: "Quẻ Đoài (Đầm)",
    nature: "Trạch (Đầm hồ phẳng lặng)",
    element: "Kim",
    attribute: "Vui vẻ, Đẹp đẽ, Trao đổi",
    direction: "Tây",
    description: "Hồ nước vui tươi, tượng trưng cho sự chia sẻ, giao tiếp ôn hòa, niềm vui thanh khiết và biểu đạt nghệ thuật."
  }
};

// High-performance self-contained Interactive Canvas Koi Pond
interface PondRipple {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  speed: number;
  color: string;
  width: number;
}

interface PondParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  color: string;
}

interface KoiFish {
  x: number;
  y: number;
  angle: number;
  targetX: number;
  targetY: number;
  speed: number;
  baseSpeed: number;
  maxSpeed: number;
  colorType: "crimson" | "tancho" | "calico" | "gold" | "black";
  history: { x: number; y: number }[];
  swimCycle: number;
  turnSpeed: number;
  opacity: number;
  wanderAngle: number;
  sizeMultiplier: number;
  idleTimer: number;
}

const BaguaPond = ({ 
  onPondClick, 
  activeAtmosphere, 
  isCeremonyActive 
}: { 
  onPondClick: () => void; 
  activeAtmosphere: string; 
  isCeremonyActive: boolean; 
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const mousePosRef = useRef({ x: -1000, y: -1000 });
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 });

  const ripplesRef = useRef<PondRipple[]>([]);
  const particlesRef = useRef<PondParticle[]>([]);
  const lastRippleTimeRef = useRef(0);
  const koiRef = useRef<KoiFish[]>([]);

  // Resize observer to scale canvas and keep drawing resolution crisp
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      const w = Math.floor(width || 300);
      const h = Math.floor(height || 300);
      setDimensions({ width: w, height: h });
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const spawnRipple = (x: number, y: number, startR: number, speed: number, color: string, width: number) => {
    ripplesRef.current.push({
      x,
      y,
      radius: startR,
      opacity: 1.0,
      speed,
      color,
      width
    });
  };

  const spawnParticle = (x: number, y: number, color: string) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 2.0;
    particlesRef.current.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 1.0 + Math.random() * 2.0,
      opacity: 0.8 + Math.random() * 0.2,
      color
    });
  };

  // Helper to retrieve exact segment positions spaced by a constant pixel distance
  const getSegmentPositions = (history: { x: number; y: number }[], spacings: number[]) => {
    const segments: { x: number; y: number; angle: number }[] = [];
    if (history.length === 0) return [];
    
    // Head segment
    segments.push({ x: history[0].x, y: history[0].y, angle: 0 });
    
    let historyIdx = 0;
    let currentPos = history[0];
    
    for (let i = 0; i < spacings.length; i++) {
      const targetDist = spacings[i];
      let accumulatedDist = 0;
      
      while (historyIdx < history.length - 1 && accumulatedDist < targetDist) {
        const p1 = history[historyIdx];
        const p2 = history[historyIdx + 1];
        const d = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        
        if (accumulatedDist + d >= targetDist) {
          const ratio = (targetDist - accumulatedDist) / d;
          currentPos = {
            x: p1.x + (p2.x - p1.x) * ratio,
            y: p1.y + (p2.y - p1.y) * ratio
          };
          accumulatedDist = targetDist;
          break;
        } else {
          accumulatedDist += d;
          historyIdx++;
          currentPos = history[historyIdx];
        }
      }
      
      const prevSeg = segments[segments.length - 1];
      const dx = prevSeg.x - currentPos.x;
      const dy = prevSeg.y - currentPos.y;
      const angle = Math.atan2(dy, dx);
      
      segments.push({ x: currentPos.x, y: currentPos.y, angle });
    }
    
    return segments;
  };

  // Track mouse coordinates relative to the canvas coordinate system
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    mousePosRef.current = { x, y };

    // Throttled hover wave ripple spawning
    const now = Date.now();
    if (now - lastRippleTimeRef.current > 180) {
      const isWaterElement = activeAtmosphere === "water" || activeAtmosphere === "lake";
      const rippleColor = isWaterElement ? "rgba(56, 189, 248, opacity)" : "rgba(212, 175, 55, opacity)";
      spawnRipple(x, y, 6, 1.2, rippleColor, 1.0);
      lastRippleTimeRef.current = now;
    }
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    mousePosRef.current = { x: -1000, y: -1000 };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // Powerful magic splash shockwaves
    const isWater = activeAtmosphere === "water" || activeAtmosphere === "lake";
    const primaryColor = isWater ? "rgba(56, 189, 248, opacity)" : "rgba(212, 175, 55, opacity)";
    const secondaryColor = "rgba(255, 255, 255, opacity)";

    spawnRipple(x, y, 5, 2.5, primaryColor, 2.0);
    setTimeout(() => spawnRipple(x, y, 5, 1.8, secondaryColor, 1.5), 140);
    setTimeout(() => spawnRipple(x, y, 5, 1.2, primaryColor, 1.0), 300);

    // Blast particles
    const particleColor = isWater ? "#38bdf8" : "#D4AF37";
    for (let i = 0; i < 15; i++) {
      spawnParticle(x, y, particleColor);
    }
    for (let i = 0; i < 8; i++) {
      spawnParticle(x, y, "#FFFFFF");
    }

    onPondClick();
  };

  // Main animation frame updater
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const updateAndDraw = () => {
      time += 16.67; // approx 60fps ticks

      // Virtual clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = dimensions.width / 2;
      const cy = dimensions.height / 2;
      const radiusOuter = dimensions.width / 2 - 2;

      // Initialize Koi fish once dimensions are ready and array is empty
      if (koiRef.current.length === 0 && dimensions.width > 10) {
        const colors: KoiFish["colorType"][] = ["crimson", "tancho", "calico", "gold", "black"];
        const count = 5;
        for (let i = 0; i < count; i++) {
          const angle = (i * Math.PI * 2) / count;
          const r = radiusOuter * 0.45 + Math.random() * radiusOuter * 0.15;
          const startX = cx + Math.cos(angle) * r;
          const startY = cy + Math.sin(angle) * r;
          koiRef.current.push({
            x: startX,
            y: startY,
            angle: angle + Math.PI / 2,
            targetX: startX,
            targetY: startY,
            speed: 0.6 + Math.random() * 0.4,
            baseSpeed: 0.5 + Math.random() * 0.3,
            maxSpeed: 2.2 + Math.random() * 0.5,
            colorType: colors[i],
            history: Array.from({ length: 55 }, () => ({ x: startX, y: startY })),
            swimCycle: Math.random() * 100,
            turnSpeed: 0.04 + Math.random() * 0.015,
            opacity: 1.0,
            wanderAngle: Math.random() * Math.PI * 2,
            sizeMultiplier: 0.8 + Math.random() * 0.3,
            idleTimer: Math.random() * 150
          });
        }
      }

      // --- 1. DRAW DEEP WATER OBSIDIAN BASIN BACKGROUND ---
      ctx.fillStyle = "#040405";
      ctx.beginPath();
      ctx.arc(cx, cy, radiusOuter, 0, Math.PI * 2);
      ctx.fill();

      // Subtle reflecting radial water gradient
      const radGrad = ctx.createRadialGradient(cx, cy, radiusOuter * 0.2, cx, cy, radiusOuter);
      radGrad.addColorStop(0, "rgba(10, 10, 12, 0.0)");
      radGrad.addColorStop(0.7, "rgba(12, 12, 16, 0.25)");
      radGrad.addColorStop(1.0, "rgba(0, 0, 0, 0.95)");
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radiusOuter, 0, Math.PI * 2);
      ctx.fill();

      // Ancient circular golden runes engraved on the pond floor
      ctx.strokeStyle = "rgba(212, 175, 55, 0.045)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radiusOuter * 0.7, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(212, 175, 55, 0.025)";
      ctx.beginPath();
      ctx.arc(cx, cy, radiusOuter * 0.5, 0, Math.PI * 2);
      ctx.stroke();

      const mouse = mousePosRef.current;

      // --- 2. UPDATE KOI FISH SIMULATION STATE ---
      koiRef.current.forEach((fish) => {
        // Opacity fade logic based on ritual state
        if (isCeremonyActive) {
          fish.opacity = Math.max(0, fish.opacity - 0.012);
        } else {
          fish.opacity = Math.min(1.0, fish.opacity + 0.02);
        }

        if (isCeremonyActive) {
          // Divination Ceremony swirl: swim toward the center and circle clockwise around the Taiji
          const distanceToCenter = Math.hypot(fish.x - cx, fish.y - cy);
          if (distanceToCenter > radiusOuter * 0.45) {
            // Steer towards center circle orbit
            fish.targetX = cx;
            fish.targetY = cy;
            fish.speed = Math.max(0.4, fish.speed - 0.02);
          } else {
            // In orbital range, swirl beautifully
            const orbitAngle = Math.atan2(fish.y - cy, fish.x - cx) + 0.022; // clockwise step
            const swirlRadius = radiusOuter * 0.38;
            fish.targetX = cx + Math.cos(orbitAngle) * swirlRadius;
            fish.targetY = cy + Math.sin(orbitAngle) * swirlRadius;
            fish.speed = 0.55;
          }
        } else {
          // Default AI wandering & behavior
          const dx = fish.targetX - fish.x;
          const dy = fish.targetY - fish.y;
          const distToTarget = Math.hypot(dx, dy);

          if (distToTarget < 20 || fish.idleTimer <= 0) {
            // Choose new random wander heading
            fish.wanderAngle += (Math.random() - 0.5) * 1.6;
            const wanderDist = 50 + Math.random() * 60;
            const tx = fish.x + Math.cos(fish.angle) * wanderDist + Math.cos(fish.wanderAngle) * 35;
            const ty = fish.y + Math.sin(fish.angle) * wanderDist + Math.sin(fish.wanderAngle) * 35;

            // Clamp wander target strictly within boundary safety ring
            const distFromCenter = Math.hypot(tx - cx, ty - cy);
            if (distFromCenter > radiusOuter * 0.75) {
              const angleToCenter = Math.atan2(cy - fish.y, cx - fish.x);
              fish.targetX = cx + Math.cos(angleToCenter) * (radiusOuter * 0.45);
              fish.targetY = cy + Math.sin(angleToCenter) * (radiusOuter * 0.45);
            } else {
              fish.targetX = tx;
              fish.targetY = ty;
            }

            // Fluctuate speed naturally and reset timer
            fish.speed = fish.baseSpeed * (0.85 + Math.random() * 0.4);
            fish.idleTimer = 120 + Math.random() * 220;
          } else {
            fish.idleTimer--;
          }

          // Cursor interaction: Flee if approaching cursor
          const distToMouse = Math.hypot(fish.x - mouse.x, fish.y - mouse.y);
          if (distToMouse < 60 && isHovered) {
            const escapeAngle = Math.atan2(fish.y - mouse.y, fish.x - mouse.x);
            fish.targetX = fish.x + Math.cos(escapeAngle) * 120;
            fish.targetY = fish.y + Math.sin(escapeAngle) * 120;
            fish.speed = Math.min(fish.maxSpeed, fish.speed + 0.18);

            // Fast splash escape ripple
            if (Math.random() < 0.18) {
              const isWater = activeAtmosphere === "water" || activeAtmosphere === "lake";
              const ripCol = isWater ? "rgba(56, 189, 248, opacity)" : "rgba(212, 175, 55, opacity)";
              spawnRipple(fish.x, fish.y, 5, 2.0, ripCol, 0.8);
            }
          } else {
            // Smooth deceleration back to normal cruising speed
            if (fish.speed > fish.baseSpeed * 1.5) {
              fish.speed -= 0.05;
            }
          }

          // Boundary forcefield: Keep inside water basin under all circumstances
          const distFromCenter = Math.hypot(fish.x - cx, fish.y - cy);
          if (distFromCenter > radiusOuter * 0.82) {
            const angleToCenter = Math.atan2(cy - fish.y, cx - fish.x);
            fish.targetX = cx + Math.cos(angleToCenter) * (radiusOuter * 0.4);
            fish.targetY = cy + Math.sin(angleToCenter) * (radiusOuter * 0.4);
            fish.speed = Math.min(fish.maxSpeed, fish.speed + 0.1);
          }
        }

        // Apply smooth target angle tracking
        const targetHeading = Math.atan2(fish.targetY - fish.y, fish.targetX - fish.x);
        let diff = targetHeading - fish.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        fish.angle += diff * fish.turnSpeed;

        // Apply translation step
        fish.x += Math.cos(fish.angle) * fish.speed;
        fish.y += Math.sin(fish.angle) * fish.speed;

        // Commit head position to history queue
        fish.history.unshift({ x: fish.x, y: fish.y });
        if (fish.history.length > 55) {
          fish.history.pop();
        }

        // Oscillation counters
        fish.swimCycle += fish.speed * 0.13;
      });

      // --- 3. DRAW SHIMMERING LIGHT CAUSTICS ON WATER FLOOR ---
      ctx.save();
      ctx.strokeStyle = "rgba(212, 175, 55, 0.03)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const offset = i * (Math.PI / 3);
        const waveX1 = cx - radiusOuter + Math.sin(time * 0.0012 + offset) * 15;
        const waveY1 = cy + Math.sin(time * 0.0015 + offset) * radiusOuter;
        const waveX2 = cx + radiusOuter - Math.sin(time * 0.0012 + offset) * 15;
        const waveY2 = cy - Math.sin(time * 0.0015 + offset) * radiusOuter;
        const ctrlX = cx + Math.cos(time * 0.0009 + offset) * (radiusOuter * 0.5);
        const ctrlY = cy + Math.sin(time * 0.0009 + offset) * (radiusOuter * 0.5);
        
        ctx.beginPath();
        ctx.moveTo(waveX1, waveY1);
        ctx.quadraticCurveTo(ctrlX, ctrlY, waveX2, waveY2);
        ctx.stroke();
      }
      ctx.restore();

      // --- 4. DRAW ROTATING, SHIMMERING TAIJI WATER REFLECTION ---
      ctx.save();
      ctx.globalAlpha = 0.09 + Math.sin(time * 0.0018) * 0.025; // shimmering mirrored water opacity
      ctx.translate(cx, cy);
      ctx.rotate(-time * 0.0004); // rotate counter to Taiji centerpiece for realistic reflection depth
      
      const rRef = radiusOuter * 0.42;
      // White Yin Reflection
      ctx.fillStyle = "rgba(251, 251, 242, 0.45)";
      ctx.beginPath();
      ctx.arc(0, 0, rRef, -Math.PI/2, Math.PI/2, false);
      ctx.fill();
      
      // Black Yang Reflection
      ctx.fillStyle = "rgba(12, 10, 9, 0.45)";
      ctx.beginPath();
      ctx.arc(0, 0, rRef, Math.PI/2, -Math.PI/2, false);
      ctx.fill();
      
      // Reflection Eyes
      ctx.fillStyle = "rgba(12, 10, 9, 0.35)";
      ctx.beginPath();
      ctx.arc(0, -rRef/2, rRef * 0.15, 0, Math.PI*2);
      ctx.fill();
      
      ctx.fillStyle = "rgba(251, 251, 242, 0.35)";
      ctx.beginPath();
      ctx.arc(0, rRef/2, rRef * 0.15, 0, Math.PI*2);
      ctx.fill();
      
      ctx.restore();
      ctx.globalAlpha = 1.0; // reset

      // --- 5. DRAW SOFT UNDERWATER KOI SHADOWS (DEPTH EFFECT) ---
      koiRef.current.forEach((fish) => {
        if (fish.opacity <= 0.01) return;

        const baseSpacings = [10, 9, 8, 8, 7];
        const spacings = baseSpacings.map((s) => s * fish.sizeMultiplier);
        const segments = getSegmentPositions(fish.history, spacings);
        if (segments.length < 6) return;

        const baseRadii = [7.5, 6.5, 5.5, 4.2, 3.2, 2.0];
        const radii = baseRadii.map((r) => r * fish.sizeMultiplier);

        const shadowDx = 5;
        const shadowDy = 9;

        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
        ctx.globalAlpha = fish.opacity * 0.5;

        // Shadow overlap segments
        for (let j = segments.length - 1; j >= 0; j--) {
          const seg = segments[j];
          const r = radii[j];
          ctx.beginPath();
          ctx.arc(seg.x + shadowDx, seg.y + shadowDy, r * 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // --- 6. DRAW POLISHED KOI FISH BODY SKIN & FINS ---
      koiRef.current.forEach((fish) => {
        if (fish.opacity <= 0.01) return;

        const baseSpacings = [10, 9, 8, 8, 7];
        const spacings = baseSpacings.map((s) => s * fish.sizeMultiplier);
        const segments = getSegmentPositions(fish.history, spacings);
        if (segments.length < 6) return;

        const baseRadii = [7.5, 6.5, 5.5, 4.2, 3.2, 2.0];
        const radii = baseRadii.map((r) => r * fish.sizeMultiplier);

        // Draw pectoral fins attached to segment 1 (Upper Body)
        const s1 = segments[1];
        if (s1) {
          ctx.save();
          ctx.translate(s1.x, s1.y);
          ctx.rotate(s1.angle);
          
          const finSway = Math.sin(fish.swimCycle) * 0.16;
          
          // Left pectoral fin (flowing translucent feather shape)
          ctx.save();
          ctx.rotate(-Math.PI / 3.2 + finSway);
          ctx.fillStyle = fish.colorType === "black" ? "rgba(45, 45, 50, 0.45)" : "rgba(255, 255, 255, 0.55)";
          ctx.beginPath();
          ctx.ellipse(0, -radii[1]*1.2, radii[1]*1.8, radii[1]*0.75, -Math.PI/6, 0, Math.PI*2);
          ctx.fill();
          ctx.restore();
          
          // Right pectoral fin
          ctx.save();
          ctx.rotate(Math.PI / 3.2 - finSway);
          ctx.fillStyle = fish.colorType === "black" ? "rgba(45, 45, 50, 0.45)" : "rgba(255, 255, 255, 0.55)";
          ctx.beginPath();
          ctx.ellipse(0, radii[1]*1.2, radii[1]*1.8, radii[1]*0.75, Math.PI/6, 0, Math.PI*2);
          ctx.fill();
          ctx.restore();
          
          ctx.restore();
        }

        // Draw flowing tail fin attached to segment 5 (Tail Base)
        const s5 = segments[5];
        if (s5) {
          ctx.save();
          ctx.translate(s5.x, s5.y);
          const tailSway = Math.sin(fish.swimCycle * 1.15) * 0.38;
          ctx.rotate(s5.angle + tailSway);
          
          // Tail fin style (flowing veil)
          ctx.fillStyle = fish.colorType === "crimson" 
            ? `rgba(239, 68, 68, ${0.48 * fish.opacity})` 
            : fish.colorType === "gold"
            ? `rgba(245, 158, 11, ${0.48 * fish.opacity})`
            : fish.colorType === "black"
            ? `rgba(32, 32, 36, ${0.48 * fish.opacity})`
            : `rgba(255, 255, 255, ${0.48 * fish.opacity})`;
          
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(-14 * fish.sizeMultiplier, -7 * fish.sizeMultiplier, -24 * fish.sizeMultiplier, -4 * fish.sizeMultiplier, -32 * fish.sizeMultiplier, 0);
          ctx.bezierCurveTo(-24 * fish.sizeMultiplier, 4 * fish.sizeMultiplier, -14 * fish.sizeMultiplier, 7 * fish.sizeMultiplier, 0, 0);
          ctx.fill();
          ctx.restore();
        }

        // Draw overlapping three-dimensional body skin segments
        for (let j = segments.length - 1; j >= 0; j--) {
          const seg = segments[j];
          const r = radii[j];
          
          ctx.save();
          ctx.translate(seg.x, seg.y);
          
          let col = "rgba(255, 255, 255, 1)";
          if (fish.colorType === "crimson") {
            col = `rgba(220, 38, 38, ${fish.opacity})`;
          } else if (fish.colorType === "gold") {
            col = `rgba(245, 158, 11, ${fish.opacity})`;
          } else if (fish.colorType === "black") {
            col = `rgba(24, 24, 27, ${fish.opacity})`;
          } else if (fish.colorType === "tancho") {
            if (j === 0) {
              col = `rgba(220, 38, 38, ${fish.opacity})`; // Tancho red crown dot
            } else {
              col = `rgba(245, 245, 244, ${fish.opacity})`;
            }
          } else if (fish.colorType === "calico") {
            if (j === 0 || j === 3) {
              col = `rgba(245, 158, 11, ${fish.opacity})`; // Orange markings
            } else if (j === 2 || j === 4) {
              col = `rgba(28, 25, 23, ${fish.opacity})`; // Black spots
            } else {
              col = `rgba(245, 245, 244, ${fish.opacity})`; // White core
            }
          }
          
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
          
          // Ambient shine overlay to carve 3D depth of wet gemstones (Jade/Obsidian feel)
          const shineGrad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.08, 0, 0, r);
          shineGrad.addColorStop(0, `rgba(255, 255, 255, ${0.16 * fish.opacity})`);
          shineGrad.addColorStop(0.5, `rgba(255, 255, 255, 0)`);
          shineGrad.addColorStop(1, `rgba(0, 0, 0, ${0.14 * fish.opacity})`);
          ctx.fillStyle = shineGrad;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }
      });

      // --- 7. UPDATE & DRAW DUST PARTICLES (Rising during ceremony) ---
      if (isCeremonyActive) {
        // Spawn sacred rising golden dust particles around the pond centerpiece
        if (Math.random() < 0.26) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * radiusOuter * 0.55;
          const px = cx + Math.cos(angle) * r;
          const py = cy + Math.sin(angle) * r;
          particlesRef.current.push({
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -0.6 - Math.random() * 1.2, // rise up
            radius: 1.0 + Math.random() * 1.5,
            opacity: 0.85 + Math.random() * 0.15,
            color: "#D4AF37"
          });
        }
      }

      const particles = particlesRef.current;
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= 0.012;
        if (p.opacity <= 0) {
          particles.splice(idx, 1);
          return;
        }
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0; // reset
      });

      // --- 8. UPDATE & DRAW SURFACE WATER RIPPLES ---
      const ripples = ripplesRef.current;
      ripples.forEach((rip, idx) => {
        rip.radius += rip.speed;
        rip.opacity -= 0.015; // fade out
        if (rip.opacity <= 0) {
          ripples.splice(idx, 1);
          return;
        }

        ctx.save();
        ctx.strokeStyle = rip.color.replace("opacity", rip.opacity.toString());
        ctx.lineWidth = rip.width;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // --- 9. DRAW HOVER CURSOR MAGIC LIGHT RINGS ---
      if (isHovered && mouse.x > 0 && mouse.y > 0) {
        ctx.save();
        const glowColor = activeAtmosphere === "water" || activeAtmosphere === "lake" ? "#38bdf8" : "#D4AF37";
        ctx.strokeStyle = `rgba(212, 175, 55, ${0.12 + Math.sin(time / 200) * 0.04})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 16 + Math.sin(time / 250) * 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = `${glowColor}05`;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 16 + Math.sin(time / 250) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(updateAndDraw);
    };

    // Begin loop
    animId = requestAnimationFrame(updateAndDraw);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isHovered, activeAtmosphere, dimensions, isCeremonyActive]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full rounded-full overflow-hidden pointer-events-auto">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleCanvasClick}
        className="w-full h-full block cursor-pointer"
        style={{ width: dimensions.width, height: dimensions.height }}
      />
    </div>
  );
};

interface BaguaHallProps {
  activeAtmosphere: "temple" | "sky" | "earth" | "water" | "fire" | "thunder" | "wind" | "mountain" | "lake";
  setAtmosphere: (atm: any) => void;
  onSelectTrigram: (trigram: Trigram) => void;
  onEnterDivination: () => void;
}

export default function BaguaHall({
  activeAtmosphere,
  setAtmosphere,
  onSelectTrigram,
  onEnterDivination,
}: BaguaHallProps) {
  const [hoveredTrigram, setHoveredTrigram] = useState<Trigram | null>(null);
  const [selectedTrigram, setSelectedTrigram] = useState<Trigram | null>(null);
  const [hoveredHex, setHoveredHex] = useState<any | null>(null);
  const [selectedHex, setSelectedHex] = useState<any | null>(null);
  const [isTaijiHovered, setIsTaijiHovered] = useState(false);
  const [isCeremonyActive, setIsCeremonyActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleStartCeremony = () => {
    if (isCeremonyActive) return;
    setIsCeremonyActive(true);
    // 2.8 seconds of luxurious swirling koi fish and rising golden particles before entering the divination chamber
    setTimeout(() => {
      onEnterDivination();
    }, 2800);
  };

  // Real-time Day/Night and Earthly Branch systems
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [timeModeOverride, setTimeModeOverride] = useState<"auto" | "dawn" | "day" | "dusk" | "night">("auto");
  const [windowWidth, setWindowWidth] = useState(() => typeof window !== "undefined" ? window.innerWidth : 1200);

  // Keep clock running
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentSeconds = currentTime.getSeconds();

  const getActivePeriod = () => {
    if (timeModeOverride !== "auto") return timeModeOverride;
    if (currentHour >= 5 && currentHour < 9) return "dawn";
    if (currentHour >= 9 && currentHour < 17) return "day";
    if (currentHour >= 17 && currentHour < 19) return "dusk";
    return "night";
  };
  const activePeriod = getActivePeriod();

  const getEarthlyBranch = (hour: number) => {
    if (hour >= 23 || hour < 1) return { name: "Giờ Tý", desc: "Năng lượng Thủy cực thịnh, khởi nguồn ngày mới (23h00 - 01h00)" };
    if (hour >= 1 && hour < 3) return { name: "Giờ Sửu", desc: "Tĩnh lặng dưỡng thần, vạn vật nảy nở (01h00 - 03h00)" };
    if (hour >= 3 && hour < 5) return { name: "Giờ Dần", desc: "Dương khí chớm nở, hổ rình mồi đêm lạnh (03h00 - 05h00)" };
    if (hour >= 5 && hour < 7) return { name: "Giờ Mão", desc: "Bình minh hé rạng, trăng tàn đón mặt trời (05h00 - 07h00)" };
    if (hour >= 7 && hour < 9) return { name: "Giờ Thìn", desc: "Rồng phun mây mịt, sinh cơ dồi dào (07h00 - 09h00)" };
    if (hour >= 9 && hour < 11) return { name: "Giờ Tỵ", desc: "Rắn ngủ trong hang, dương quang rực rỡ (09h00 - 11h00)" };
    if (hour >= 11 && hour < 13) return { name: "Giờ Ngọ", desc: "Cực Dương thái thịnh, mặt trời đỉnh ngọn tre (11h00 - 13h00)" };
    if (hour >= 13 && hour < 15) return { name: "Giờ Mùi", desc: "Dương khí dịu mát, dê thong thả gặm cỏ (13h00 - 15h00)" };
    if (hour >= 15 && hour < 17) return { name: "Giờ Thân", desc: "Nắng xế chiều tà, khỉ đột hú rừng sâu (15h00 - 17h00)" };
    if (hour >= 17 && hour < 19) return { name: "Giờ Dậu", desc: "Hoàng hôn buông lơi, gà về tổ ấm (17h00 - 19h00)" };
    if (hour >= 19 && hour < 21) return { name: "Giờ Tuất", desc: "Đèn thắp canh sương, năng lượng Thổ quy gia (19h00 - 21h00)" };
    return { name: "Giờ Hợi", desc: "Đêm khuya tăm tối, vạn sự yên nghỉ (21h00 - 23h00)" };
  };

  const branch = getEarthlyBranch(currentHour);

  const PERIOD_DATA = {
    dawn: {
      title: "Khắc Bình Minh",
      desc: "Sương sớm giăng lối, Thái Cực khởi sinh dòng năng lượng tươi mới.",
      bgGradient: "bg-gradient-to-b from-[#1d1217] via-[#0a080d] to-[#030305]",
      accent: "text-[#e29578]",
      textGlow: "glow-rose",
      glow: "rgba(226, 149, 120, 0.08)",
      beamColors: ["#e29578", "#ea580c", "#f59e0b"]
    },
    day: {
      title: "Thanh Thiên Cực Dương",
      desc: "Chính Dương tỏa sáng, hào quang thái cực soi rọi bát quái đài rực rỡ.",
      bgGradient: "bg-gradient-to-b from-[#161510] via-[#080705] to-[#020201]",
      accent: "text-[#D4AF37]",
      textGlow: "glow-gold",
      glow: "rgba(212, 175, 55, 0.12)",
      beamColors: ["#D4AF37", "#ea580c", "#f59e0b"]
    },
    dusk: {
      title: "Hoàng Hôn Tịch Dương",
      desc: "Ánh tà dương buông xuống, hào quang đỏ tía trầm mặc nhu hòa.",
      bgGradient: "bg-gradient-to-b from-[#25120a] via-[#100805] to-[#040202]",
      accent: "text-[#ea580c]",
      textGlow: "glow-gold",
      glow: "rgba(234, 88, 12, 0.08)",
      beamColors: ["#ea580c", "#c2410c", "#7f1d1d"]
    },
    night: {
      title: "Dạ Điện Thiên Tinh",
      desc: "Bầu trời sao huyền diệu, cõi điện chìm vào tĩnh mịch thần bí.",
      bgGradient: "bg-gradient-to-b from-[#070914] via-[#030408] to-[#010102]",
      accent: "text-[#818cf8]",
      textGlow: "glow-gold",
      glow: "rgba(99, 102, 241, 0.06)",
      beamColors: ["#6366f1", "#4f46e5", "#1e1b4b"]
    }
  };

  const activeData = PERIOD_DATA[activePeriod];

  const formatDigitalTime = (h: number, m: number, s: number) => {
    const pad = (num: number) => String(num).padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${pad(displayHour)}:${pad(m)}:${pad(s)} ${ampm}`;
  };

  // Particle simulation loop for environmental reactions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Mouse/Touch Interaction Coordinates
    const mouse = { x: -1000, y: -1000, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.touches[0].clientX - rect.left;
        mouse.y = e.touches[0].clientY - rect.top;
        mouse.active = true;
      }
    };

    const handleTouchEnd = () => {
      mouse.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    // Particle class definition
    class Particle {
      x = Math.random() * width;
      y = Math.random() * height;
      size = Math.random() * 2 + 1;
      speedX = 0;
      speedY = 0;
      color = "rgba(255, 255, 255, 0.5)";
      opacity = Math.random() * 0.5 + 0.3;
      isSpirit = false;
      angle = Math.random() * Math.PI * 2;
      spiritWobble = Math.random() * 0.02 + 0.01;

      constructor(type: string) {
        this.reset(type);
      }

      reset(type: string) {
        // If mouse is active, there is a chance the particle resets right at the cursor to form a magic trailing spark
        if (mouse.active && Math.random() < 0.25) {
          this.x = mouse.x + (Math.random() * 50 - 25);
          this.y = mouse.y + (Math.random() * 50 - 25);
          this.isSpirit = Math.random() > 0.45; // high chance of being spirit sparks
        } else {
          this.x = Math.random() * width;
          this.isSpirit = Math.random() > 0.8; // 20% default spirit lights
        }

        this.size = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.6 + 0.2;
        this.angle = Math.random() * Math.PI * 2;
        this.spiritWobble = Math.random() * 0.03 + 0.01;

        if (type === "water") {
          this.y = -10;
          this.speedY = Math.random() * 6 + 4; // fast falling rain
          this.speedX = Math.random() * 0.5 - 0.25;
          this.color = `rgba(14, 116, 144, ${this.opacity})`; // cyan-700
          this.size = Math.random() * 1.5 + 1;
        } else if (type === "fire") {
          this.y = height + 10;
          this.speedY = -(Math.random() * 2 + 1); // rising embers
          this.speedX = Math.random() * 1.5 - 0.75;
          this.color = `rgba(${Math.floor(Math.random() * 100 + 155)}, ${Math.floor(Math.random() * 80 + 20)}, 10, ${this.opacity})`;
          this.size = Math.random() * 3 + 1;
        } else if (type === "wind") {
          this.y = Math.random() * height;
          this.speedX = Math.random() * 4 + 2; // blowing leaves / air
          this.speedY = Math.random() * 1.5 - 0.75;
          this.color = `rgba(16, 185, 129, ${this.opacity * 0.8})`; // emerald green
          this.size = Math.random() * 4 + 2;
        } else if (type === "mountain") {
          this.y = -10;
          this.speedY = Math.random() * 1.5 + 0.5; // drifting snow
          this.speedX = Math.random() * 1 - 0.5;
          this.color = `rgba(241, 245, 249, ${this.opacity})`; // slate snow
          this.size = Math.random() * 4 + 1.5;
        } else if (type === "thunder") {
          this.y = Math.random() * height;
          this.speedY = (Math.random() * 2 - 1);
          this.speedX = (Math.random() * 2 - 1);
          this.color = Math.random() > 0.5
            ? `rgba(167, 139, 250, ${this.opacity})` // light purple
            : `rgba(129, 140, 248, ${this.opacity})`; // light blue-violet
          this.size = Math.random() * 1.8 + 0.6;
        } else {
          // Temple particles based on time-of-day
          this.y = Math.random() * height;
          this.speedY = (Math.random() * 0.4 - 0.2);
          this.speedX = (Math.random() * 0.4 - 0.2);
          
          let colorString = "245, 158, 11"; // Default amber
          if (activePeriod === "dawn") colorString = "226, 149, 120"; // Coral rose
          else if (activePeriod === "day") colorString = "212, 175, 55"; // Bright gold
          else if (activePeriod === "dusk") colorString = "234, 88, 12"; // Deep orange
          else if (activePeriod === "night") colorString = "99, 102, 241"; // Mystical indigo

          this.color = `rgba(${colorString}, ${this.opacity * 0.5})`;
          this.size = Math.random() * 2 + 0.5;
        }

        if (this.isSpirit) {
          // Set to golden spirit light
          this.size = Math.random() * 3 + 2.5;
          this.color = "rgba(212, 175, 55, 0.75)";
        }
      }

      update(type: string) {
        // Handle mouse gravity and orbit swirl effects
        if (mouse.active) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 280) {
            const force = (280 - dist) / 280; // stronger closer to cursor

            if (this.isSpirit) {
              // Spirit lights swirl around and gravitate strongly
              this.x += (dx / dist) * force * 2.8;
              this.y += (dy / dist) * force * 2.8;

              // Swirl tangent component
              this.x += (-dy / dist) * force * 1.6;
              this.y += (dx / dist) * force * 1.6;

              this.angle += this.spiritWobble * 1.5;
            } else {
              // Regular particles get gentle pull
              this.x += (dx / dist) * force * 1.4;
              this.y += (dy / dist) * force * 1.4;
            }
          }
        }

        if (this.isSpirit) {
          // Spirit particles sway side to side and float up
          this.angle += this.spiritWobble;
          this.x += Math.sin(this.angle) * 0.5;
          this.y -= 0.35 + Math.abs(Math.sin(this.angle * 0.5)) * 0.2;
          
          // breathe opacity gently
          this.opacity = (Math.sin(this.angle) * 0.25 + 0.55) * 0.7;

          if (this.y < -15 || this.x < -15 || this.x > width + 15) {
            this.reset(type);
            this.y = height + 10;
          }
        } else {
          if (type === "thunder") {
            // Erratic zig-zag redirection
            if (Math.random() < 0.12) {
              this.speedX = (Math.random() * 4 - 2);
              this.speedY = (Math.random() * 4 - 2);
            }
          }

          this.x += this.speedX;
          this.y += this.speedY;

          // Wrap around bounds or reset
          if (type === "water" && this.y > height) this.reset(type);
          else if (type === "fire" && this.y < -10) this.reset(type);
          else if (type === "wind" && this.x > width) this.reset(type);
          else if (type === "mountain" && this.y > height) this.reset(type);
          else if (type === "thunder" && (this.x < 0 || this.x > width || this.y < 0 || this.y > height)) {
            this.reset(type);
          }
          else if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
            this.reset(type);
          }
        }
      }

      draw() {
        ctx.beginPath();
        if (this.isSpirit) {
          // Spirit particles have a soft glowing halo
          const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3.5);
          gradient.addColorStop(0, `rgba(212, 175, 55, ${this.opacity * 0.95})`);
          gradient.addColorStop(0.3, `rgba(234, 88, 12, ${this.opacity * 0.4})`);
          gradient.addColorStop(1, "rgba(212, 175, 55, 0)");
          ctx.fillStyle = gradient;
          ctx.arc(this.x, this.y, this.size * 3.5, 0, Math.PI * 2);
          ctx.fill();

          // White-gold core
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = "#FFFFFF";
          ctx.fill();
        } else {
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.fill();
        }
      }
    }

    const particles: Particle[] = [];
    const count = 120;
    
    // Determine the particle type based on active atmosphere
    let type = "temple";
    if (activeAtmosphere === "water") type = "water";
    else if (activeAtmosphere === "fire") type = "fire";
    else if (activeAtmosphere === "wind") type = "wind";
    else if (activeAtmosphere === "mountain") type = "mountain";
    else if (activeAtmosphere === "thunder") type = "thunder";

    for (let i = 0; i < count; i++) {
      particles.push(new Particle(type));
    }

    // Procedural Lightning state
    interface LightningSegment {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }

    interface LightningBolt {
      segments: LightningSegment[];
      opacity: number;
      width: number;
      color: string;
    }

    let activeLightning: LightningBolt | null = null;
    let lightningCooldown = 60; // short initial cooldown

    const generateLightning = () => {
      const segments: LightningSegment[] = [];
      const startX = Math.random() * width;
      const startY = 0;

      // Draw lightning bolt towards a target (mouse or random bottom area)
      let targetX = Math.random() * width;
      if (mouse.active && Math.random() > 0.3) {
        targetX = mouse.x + (Math.random() * 80 - 40);
      } else {
        targetX = width / 2 + (Math.random() * 300 - 150);
      }
      const targetY = height * (0.55 + Math.random() * 0.35);

      let currentX = startX;
      let currentY = startY;
      const steps = 14 + Math.floor(Math.random() * 10);

      for (let i = 0; i < steps; i++) {
        const t = (i + 1) / steps;
        const nextTargetX = startX + (targetX - startX) * t;
        const nextTargetY = startY + (targetY - startY) * t;

        // Add perpendicular jitter that reduces as it nears the ground
        const jitter = (1 - t) * 30 + 10;
        const nextX = nextTargetX + (Math.random() * jitter * 2 - jitter);
        const nextY = nextTargetY + (Math.random() * 16 - 6);

        segments.push({ x1: currentX, y1: currentY, x2: nextX, y2: nextY });

        // Branching secondary discharge
        if (Math.random() < 0.18 && i < steps - 3) {
          let bx = nextX;
          let by = nextY;
          const branchSteps = 4 + Math.floor(Math.random() * 5);
          for (let b = 0; b < branchSteps; b++) {
            const bNextX = bx + (Math.random() * 36 - 18) + (targetX - startX) * 0.05;
            const bNextY = by + (Math.random() * 20 + 8);
            segments.push({ x1: bx, y1: by, x2: bNextX, y2: bNextY });
            bx = bNextX;
            by = bNextY;
          }
        }

        currentX = nextX;
        currentY = nextY;
      }

      const color = Math.random() > 0.4
        ? "rgba(167, 139, 250, 0.95)" // violet
        : "rgba(129, 140, 248, 0.95)"; // indigo

      activeLightning = {
        segments,
        opacity: 0.9 + Math.random() * 0.1,
        width: Math.random() * 1.5 + 1.1,
        color
      };
    };

    const loop = () => {
      ctx.clearRect(0, 0, width, height);

      // Render regular particles
      particles.forEach((p) => {
        p.update(type);
        p.draw();
      });

      // Render procedural lightning bolt
      if (activeAtmosphere === "thunder") {
        if (activeLightning) {
          ctx.save();
          ctx.strokeStyle = activeLightning.color;
          ctx.lineWidth = activeLightning.width;
          ctx.shadowBlur = 20;
          ctx.shadowColor = activeLightning.color;
          ctx.globalAlpha = activeLightning.opacity;

          ctx.beginPath();
          activeLightning.segments.forEach((seg) => {
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
          });
          ctx.stroke();
          ctx.restore();

          // Smoothly fade out the bolt
          activeLightning.opacity -= 0.06;
          if (activeLightning.opacity <= 0) {
            activeLightning = null;
          }
        } else {
          if (lightningCooldown > 0) {
            lightningCooldown--;
          } else {
            // Strike has a chance to trigger
            if (Math.random() < 0.016) {
              generateLightning();
              lightningCooldown = 90 + Math.floor(Math.random() * 180); // variable delay
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [activeAtmosphere, activePeriod]);

  // Click handler to enter a Trigram's elemental realm
  const handleTrigramClick = (trigram: Trigram) => {
    setSelectedHex(null);
    setHoveredHex(null);
    setSelectedTrigram(trigram);
    setAtmosphere(trigram.id === "kan" ? "water" : trigram.id === "li" ? "fire" : trigram.id === "xun" ? "wind" : trigram.id === "gen" ? "mountain" : trigram.id === "qian" ? "sky" : trigram.id === "kun" ? "earth" : trigram.id === "zhen" ? "thunder" : "lake");
    onSelectTrigram(trigram);
  };

  const handleHexagramClick = (hex: any) => {
    setSelectedTrigram(null);
    setHoveredTrigram(null);
    setSelectedHex(hex);
  };

  const handleResetAtmosphere = () => {
    setSelectedTrigram(null);
    setSelectedHex(null);
    setHoveredHex(null);
    setAtmosphere("temple");
  };

  // Trigrams arranged in a physical circular orbit (Bagua order)
  const trigramList = Object.values(TRIGRAMS);
  
  // 64 Hexagrams of I Ching arranged sequentially
  const hexagramsList = Object.entries(HEXAGRAMS_DB).map(([num, hex]) => ({
    ...hex,
    number: parseInt(num),
  }));
  
  return (
    <div
      id="bagua-hall-viewport"
      className={`relative flex min-h-screen w-full flex-col items-center justify-between overflow-hidden text-[#E0E0E0] py-12 px-6 transition-all duration-1000 ${activeData.bgGradient}`}
    >
      {/* Absolute particle simulation canvas (environmental react) */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Embedded CSS Animations for Swimming Koi Fish */}
      <style>{`
        @keyframes koi-swim-orbit {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes koi-wag {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(10deg); }
        }
        @keyframes koi-fin-l {
          0%, 100% { transform: rotate(-8deg); }
          50% { transform: rotate(12deg); }
        }
        @keyframes koi-fin-r {
          0%, 100% { transform: rotate(8deg); }
          50% { transform: rotate(-12deg); }
        }
        @keyframes orbit-rotation {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes counter-orbit-rotation {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes spirit-beam-slow-1 {
          0%, 100% { transform: rotate(-35deg) scale(0.9); opacity: 0.6; }
          50% { transform: rotate(-28deg) scale(1.15); opacity: 0.95; }
        }
        @keyframes spirit-beam-slow-2 {
          0%, 100% { transform: rotate(35deg) scale(0.9); opacity: 0.5; }
          50% { transform: rotate(28deg) scale(1.2); opacity: 0.85; }
        }
        @keyframes spirit-beam-slow-3 {
          0%, 100% { transform: translateX(-5%) skewX(-5deg) scaleY(0.9); opacity: 0.4; }
          50% { transform: translateX(5%) skewX(5deg) scaleY(1.15); opacity: 0.75; }
        }
        .la-kinh-ring {
          --radius: -158px;
        }
        @media (min-width: 640px) {
          .la-kinh-ring {
            --radius: -188px;
          }
        }
        @media (min-width: 768px) {
          .la-kinh-ring {
            --radius: -245px;
          }
        }
        @media (min-width: 1024px) {
          .la-kinh-ring {
            --radius: -268px;
          }
        }
        @media (min-width: 1280px) {
          .la-kinh-ring {
            --radius: -296px;
          }
        }
      `}</style>

      {/* Spirit Beams Overlay (Tia tinh linh sáng ấm) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40 mix-blend-screen transition-all duration-1000">
        {/* Beam 1: Top Left to Bottom Right */}
        <div 
          className="absolute top-[-40%] left-[-20%] w-[50%] h-[180%] blur-[90px] transition-all duration-1000" 
          style={{
            background: `linear-gradient(to bottom, ${activeData.beamColors[0]}1d, ${activeData.beamColors[1]}08, transparent)`,
            transformOrigin: "top left",
            animation: "spirit-beam-slow-1 22s ease-in-out infinite",
          }}
        />
        {/* Beam 2: Top Right to Bottom Left */}
        <div 
          className="absolute top-[-40%] right-[-20%] w-[45%] h-[180%] blur-[100px] transition-all duration-1000" 
          style={{
            background: `linear-gradient(to bottom, ${activeData.beamColors[1]}15, ${activeData.beamColors[2]}04, transparent)`,
            transformOrigin: "top right",
            animation: "spirit-beam-slow-2 26s ease-in-out infinite",
          }}
        />
        {/* Beam 3: Center top down */}
        <div 
          className="absolute top-[-50%] left-[25%] w-[50%] h-[160%] blur-[110px] transition-all duration-1000" 
          style={{
            background: `linear-gradient(to bottom, ${activeData.beamColors[0]}0a, ${activeData.beamColors[2]}02, transparent)`,
            transformOrigin: "top center",
            animation: "spirit-beam-slow-3 30s ease-in-out infinite",
          }}
        />
      </div>

      {/* Atmospheric lighting filter */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none transition-all duration-1000 mix-blend-overlay"
        style={{
          background: activeAtmosphere === "water" 
            ? "radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 80%)"
            : activeAtmosphere === "fire"
            ? "radial-gradient(circle, rgba(239,68,68,0.1) 0%, transparent 80%)"
            : activeAtmosphere === "wind"
            ? "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 80%)"
            : `radial-gradient(circle, ${activeData.glow} 0%, transparent 80%)`
        }}
      />

      {/* Top Header Controls */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-between border-b border-white/5 pb-4 select-none">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
          <span className="font-cinzel text-sm tracking-[0.3em] text-[#D4AF37] font-semibold glow-gold">
            ĐÀN THÁI CỰC BÁT QUÁI
          </span>
        </div>

        {selectedTrigram && (
          <button
            id="btn-return-pavilion"
            onClick={handleResetAtmosphere}
            className="text-[10px] font-cinzel tracking-widest text-[#D4AF37] border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 rounded-full px-4 py-1.5 bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10 backdrop-blur-sm transition-all cursor-pointer"
          >
            ← Quay Lại Đền Thờ
          </button>
        )}
      </div>

      {/* Real-time Sun Dial & Earthly Branch Watch Bar */}
      <div className="relative z-10 w-full max-w-5xl mt-4 flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0A0A0B]/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-cinzel font-bold uppercase tracking-widest ${activeData.accent} glow-gold`}>
              {branch.name}
            </span>
            <span className="text-[10px] font-mono text-stone-400 bg-black/40 px-2 py-0.5 rounded border border-white/5">
              {formatDigitalTime(currentHour, currentMinutes, currentSeconds)}
            </span>
          </div>
          <span className="hidden md:inline text-stone-600 text-xs">|</span>
          <p className="text-[11px] font-playfair text-stone-300 italic tracking-wide">
            &ldquo;{branch.desc}&rdquo;
          </p>
        </div>

        {/* Time override quick-tabs */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-full border border-white/5 select-none">
          <span className="text-[9px] font-cinzel text-stone-400 px-2">Kính Nhật Quỹ:</span>
          {(["auto", "dawn", "day", "dusk", "night"] as const).map((mode) => {
            const isActive = timeModeOverride === mode;
            return (
              <button
                key={mode}
                onClick={() => setTimeModeOverride(mode)}
                className={`text-[9px] font-cinzel uppercase tracking-wider px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 glow-gold-box-sm"
                    : "text-stone-500 hover:text-stone-300"
                }`}
              >
                {mode === "auto" ? "Tự Động" : mode === "dawn" ? "Bình Minh" : mode === "day" ? "Thanh Thiên" : mode === "dusk" ? "Hoàng Hôn" : "Dạ Điện"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Altar Area */}
      <div className="relative z-10 flex flex-1 w-full max-w-6xl flex-col lg:flex-row items-center justify-center gap-12 my-6">
        
        {/* Left Side: Circular Bagua & Taiji Orbit */}
        <div className="relative flex items-center justify-center h-[370px] w-[370px] sm:h-[450px] sm:w-[450px] md:h-[580px] md:w-[580px] lg:h-[640px] lg:w-[640px] xl:h-[700px] xl:w-[700px] rounded-full border border-white/5 bg-[#0A0A0B]/20 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
          
          {/* Subtle spinning circular compass guidelines */}
          <div className="absolute inset-2 border border-dashed border-[#D4AF37]/10 rounded-full animate-spin" style={{ animationDuration: "120s" }} />
          <div className="absolute inset-10 border border-[#D4AF37]/5 rounded-full animate-spin" style={{ animationDuration: "90s", animationDirection: "reverse" }} />
          
          {/* 64-Hexagram Sacred Compass Ring (La Kinh) */}
          <div className="absolute w-[332px] h-[332px] sm:w-[410px] sm:h-[410px] md:w-[510px] md:h-[510px] lg:w-[570px] lg:h-[570px] xl:w-[630px] xl:h-[630px] rounded-full border border-[#D4AF37]/10 flex items-center justify-center pointer-events-none select-none la-kinh-ring">
            {hexagramsList.map((hex, idx) => {
              const angle = idx * (360 / 64);
              const isThisHovered = hoveredHex?.number === hex.number;
              const isThisSelected = selectedHex?.number === hex.number;
              return (
                <div
                  key={hex.number}
                  style={{
                    transform: `rotate(${angle}deg) translateY(var(--radius)) rotate(-${angle}deg)`,
                  }}
                  className="absolute flex flex-col items-center justify-center select-none font-sans transition-all duration-300 pointer-events-auto cursor-pointer group"
                  title={`Quẻ ${hex.number}: ${hex.vietnamese}`}
                  onMouseEnter={() => setHoveredHex(hex)}
                  onMouseLeave={() => setHoveredHex(null)}
                  onClick={() => handleHexagramClick(hex)}
                >
                  {/* Subtle back glowing aura for active items */}
                  <div className={`absolute w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#D4AF37]/0 blur-[2px] scale-100 transition-all duration-300 ease-out pointer-events-none border border-amber-500/0 ${
                    isThisHovered || isThisSelected ? "bg-[#D4AF37]/15 border-[#D4AF37]/20 scale-125 shadow-[0_0_8px_rgba(212,175,55,0.4)]" : ""
                  }`} />
                  
                  <span className={`relative z-10 text-[9px] md:text-xs transition-all duration-300 ease-out font-medium
                    ${isThisHovered || isThisSelected ? "scale-125 text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.95)]" : "text-[#D4AF37]/35 group-hover:text-[#D4AF37]/75"}`}
                  >
                    {hex.chinese}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Outer Ring of Trigrams (Orbits) with slow rotation */}
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              animation: "orbit-rotation 90s linear infinite",
              transformOrigin: "center center"
            }}
          >
            {trigramList.map((trigram, index) => {
              const angle = (index * 2 * Math.PI) / 8; // 8 sectors of circle
              const getTrigramRadius = (width: number) => {
                if (width < 640) return 114;
                if (width < 768) return 136;
                if (width < 1024) return 180;
                if (width < 1280) return 198;
                return 218;
              };
              const radius = getTrigramRadius(windowWidth);
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              const isHovered = hoveredTrigram?.id === trigram.id;
              const isSelected = selectedTrigram?.id === trigram.id;
              const trigramVI = trigramVietnameseDetails[trigram.id] || { element: "Thổ" };
              const elementColors: Record<string, { bg: string, text: string, border: string, glow: string, borderHover: string }> = {
                "Kim": { bg: "bg-amber-500/10", text: "text-[#D4AF37]", border: "border-[#D4AF37]/30", borderHover: "hover:border-[#D4AF37]", glow: "shadow-[0_0_10px_rgba(212,175,55,0.3)]" },
                "Mộc": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", borderHover: "hover:border-emerald-400", glow: "shadow-[0_0_10px_rgba(16,185,129,0.3)]" },
                "Thủy": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", borderHover: "hover:border-blue-400", glow: "shadow-[0_0_10px_rgba(59,130,246,0.3)]" },
                "Hỏa": { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30", borderHover: "hover:border-rose-400", glow: "shadow-[0_0_10px_rgba(244,63,94,0.3)]" },
                "Thổ": { bg: "bg-stone-500/10", text: "text-stone-300", border: "border-stone-500/30", borderHover: "hover:border-stone-400", glow: "shadow-[0_0_10px_rgba(120,113,108,0.3)]" }
              };
              const ec = elementColors[trigramVI.element] || elementColors["Thổ"];

              return (
                <div
                  key={trigram.id}
                  className="absolute pointer-events-auto"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                  }}
                >
                  <motion.button
                    id={`trigram-node-${trigram.id}`}
                    onMouseEnter={() => setHoveredTrigram(trigram)}
                    onMouseLeave={() => setHoveredTrigram(null)}
                    onClick={() => handleTrigramClick(trigram)}
                    style={{
                      animation: "counter-orbit-rotation 90s linear infinite",
                      transformOrigin: "center center"
                    }}
                    className={`relative flex flex-col items-center justify-center h-14 w-14 sm:h-16 sm:w-16 md:h-[92px] md:w-[92px] rounded-full border bg-[#0A0A0B] transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? "border-[#D4AF37] text-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.2)] bg-gradient-to-b from-[#161618] to-[#D4AF37]/10 glow-gold"
                        : isHovered
                        ? `text-white scale-110 border-white/20 ${ec.glow}`
                        : "border-white/5 text-stone-400 hover:text-[#D4AF37]"
                    }`}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Visual Trigram Lines representation */}
                    <div className="text-xl sm:text-2xl md:text-3xl font-noto font-light mb-0.5 filter drop-shadow-md leading-none">
                      {trigram.symbol}
                    </div>
                    <div className="text-[8px] sm:text-[10px] md:text-xs font-cinzel uppercase tracking-widest text-stone-200 group-hover:text-[#D4AF37]">
                      {trigram.vietnamese}
                    </div>
                    
                    {/* Element badge (Ngũ Hành) */}
                    <span className={`text-[7px] sm:text-[8px] md:text-[9px] font-cinzel tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full mt-0.5 sm:mt-1 border ${ec.bg} ${ec.text} ${ec.border} ${ec.glow}`}>
                      {trigramVI.element}
                    </span>

                    {/* Micro ink pulse dot */}
                    {isSelected && (
                      <span className="absolute -top-1 left-1/2 -translate-x-1/2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
                      </span>
                    )}
                  </motion.button>
                </div>
              );
            })}
          </div>

          {/* Centerpiece: Premium Rotating Liquid Taiji Symbol */}
          <div 
            id="centerpiece-taiji-click-div"
            className={`relative h-24 w-24 sm:h-28 sm:w-28 md:h-36 md:w-36 lg:h-40 lg:w-40 xl:h-44 xl:w-44 rounded-full border flex flex-col items-center justify-center p-0.5 z-10 transition-all duration-700 cursor-pointer ${
              isTaijiHovered 
                ? "border-[#D4AF37]/90 shadow-[0_0_60px_rgba(212,175,55,0.7)] bg-stone-950 scale-105" 
                : "border-white/5 bg-[#070708] shadow-[0_12px_30px_rgba(0,0,0,0.65)]"
            }`}
            onMouseEnter={() => setIsTaijiHovered(true)}
            onMouseLeave={() => setIsTaijiHovered(false)}
            onTouchStart={() => setIsTaijiHovered(true)}
            onTouchEnd={() => setIsTaijiHovered(false)}
            onClick={handleStartCeremony}
          >
            {/* Centerpiece hover tooltip directly on the Taiji */}
            {isTaijiHovered && !isCeremonyActive && (
              <div className="absolute -top-12 bg-black/95 text-[#D4AF37] text-[10px] font-cinzel border border-[#D4AF37]/40 px-3 py-1.5 rounded-md whitespace-nowrap shadow-[0_4px_12px_rgba(0,0,0,0.8)] z-30 animate-bounce pointer-events-none tracking-widest">
                Nhấp Để Gieo Quẻ ✦
              </div>
            )}

            {/* High-intensity Background Glow on Hover */}
            {isTaijiHovered && !isCeremonyActive && (
              <>
                <div className="absolute inset-0 rounded-full bg-[#D4AF37]/25 filter blur-2xl animate-pulse scale-125 pointer-events-none" />
                <div className="absolute inset-2 rounded-full bg-white/15 filter blur-xl animate-ping pointer-events-none" style={{ animationDuration: "2s" }} />
              </>
            )}

            {/* Shadow/Echo Layers (Motion Blur Trails) - Trailing behind the main Taiji */}
            {/* Trail 3 (Furthest, most blurred) */}
            <div className={`absolute inset-0.5 rounded-full pointer-events-none filter blur-[5px] scale-[0.98] transition-opacity duration-700 animate-variable-spin-delay-3 ${
              isTaijiHovered ? "opacity-40 scale-100" : "opacity-12 scale-95"
            }`} style={{ aspectRatio: "1/1" }}>
              <svg viewBox="0 0 100 100" className="w-full h-full select-none" style={{ aspectRatio: "1/1" }}>
                <path d="M 50 0 A 50 50 0 0 1 50 100 A 25 25 0 0 1 50 50 A 25 25 0 0 0 50 0 Z" fill="#FBFBF2" opacity="0.4" />
                <path d="M 50 100 A 50 50 0 0 1 50 0 A 25 25 0 0 1 50 50 A 25 25 0 0 0 50 100 Z" fill="#0C0A09" opacity="0.4" />
                <circle cx="50" cy="25" r="8" fill="#FFFFFF" stroke="#D4AF37" strokeWidth="1.2" opacity="0.4" />
                <circle cx="50" cy="75" r="8" fill="#0C0A09" stroke="#D4AF37" strokeWidth="1.2" opacity="0.4" />
              </svg>
            </div>

            {/* Trail 2 (Medium) */}
            <div className={`absolute inset-0.5 rounded-full pointer-events-none filter blur-[3px] scale-[1.01] transition-opacity duration-700 animate-variable-spin-delay-2 ${
              isTaijiHovered ? "opacity-60 scale-[1.02]" : "opacity-20 scale-[0.98]"
            }`} style={{ aspectRatio: "1/1" }}>
              <svg viewBox="0 0 100 100" className="w-full h-full select-none" style={{ aspectRatio: "1/1" }}>
                <path d="M 50 0 A 50 50 0 0 1 50 100 A 25 25 0 0 1 50 50 A 25 25 0 0 0 50 0 Z" fill="#FBFBF2" opacity="0.65" />
                <path d="M 50 100 A 50 50 0 0 1 50 0 A 25 25 0 0 1 50 50 A 25 25 0 0 0 50 100 Z" fill="#0C0A09" opacity="0.65" />
                <circle cx="50" cy="25" r="8" fill="#FFFFFF" stroke="#D4AF37" strokeWidth="1.2" opacity="0.65" />
                <circle cx="50" cy="75" r="8" fill="#0C0A09" stroke="#D4AF37" strokeWidth="1.2" opacity="0.65" />
              </svg>
            </div>

            {/* Trail 1 (Closest) */}
            <div className={`absolute inset-0.5 rounded-full pointer-events-none filter blur-[1px] scale-[1.03] transition-opacity duration-700 animate-variable-spin-delay-1 ${
              isTaijiHovered ? "opacity-80 scale-[1.04]" : "opacity-35 scale-[1.01]"
            }`} style={{ aspectRatio: "1/1" }}>
              <svg viewBox="0 0 100 100" className="w-full h-full select-none" style={{ aspectRatio: "1/1" }}>
                <path d="M 50 0 A 50 50 0 0 1 50 100 A 25 25 0 0 1 50 50 A 25 25 0 0 0 50 0 Z" fill="#FBFBF2" opacity="0.8" />
                <path d="M 50 100 A 50 50 0 0 1 50 0 A 25 25 0 0 1 50 50 A 25 25 0 0 0 50 100 Z" fill="#0C0A09" opacity="0.8" />
                <circle cx="50" cy="25" r="8" fill="#FFFFFF" stroke="#D4AF37" strokeWidth="1.2" opacity="0.8" />
                <circle cx="50" cy="75" r="8" fill="#0C0A09" stroke="#D4AF37" strokeWidth="1.2" opacity="0.8" />
              </svg>
            </div>

            {/* Main Foreground Taiji Layer (Sharp, fully opaque) */}
            <div className="absolute inset-0.5 rounded-full z-10 animate-variable-spin" style={{ aspectRatio: "1/1" }}>
              <svg viewBox="0 0 100 100" className="w-full h-full select-none filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)]" style={{ aspectRatio: "1/1" }}>
                <defs>
                  {/* Jade (White) texture using multiple gradient stops for translucent polished gemstone appearance */}
                  <radialGradient id="jadeGloss" cx="35%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="30%" stopColor="#fafbf8" />
                    <stop offset="70%" stopColor="#ebe9df" />
                    <stop offset="92%" stopColor="#d3cebc" />
                    <stop offset="100%" stopColor="#b2ac98" />
                  </radialGradient>

                  {/* Obsidian (Black) texture using multiple gradients for high specular polished volcanic glass appearance */}
                  <radialGradient id="obsidianGloss" cx="30%" cy="25%" r="75%">
                    <stop offset="0%" stopColor="#3d3b3b" />
                    <stop offset="15%" stopColor="#222020" />
                    <stop offset="45%" stopColor="#0f0e0e" />
                    <stop offset="100%" stopColor="#010101" />
                  </radialGradient>

                  {/* Luxurious Gold Metallic rim gradient with multiple luster highlights */}
                  <linearGradient id="luxuryGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fff8e7" />
                    <stop offset="20%" stopColor="#edd082" />
                    <stop offset="40%" stopColor="#d4af37" />
                    <stop offset="60%" stopColor="#aa8421" />
                    <stop offset="80%" stopColor="#d4af37" />
                    <stop offset="100%" stopColor="#574411" />
                  </linearGradient>

                  {/* Soft specular/reflection glossy overlay (curved window-pane reflection) */}
                  <linearGradient id="softGloss" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                    <stop offset="35%" stopColor="#ffffff" stopOpacity="0.12" />
                    <stop offset="70%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* White Yin (Jade) side */}
                <path d="M 50 0 A 50 50 0 0 1 50 100 A 25 25 0 0 1 50 50 A 25 25 0 0 0 50 0 Z" fill="url(#jadeGloss)" />
                
                {/* Black Yang (Obsidian) side */}
                <path d="M 50 100 A 50 50 0 0 1 50 0 A 25 25 0 0 1 50 50 A 25 25 0 0 0 50 100 Z" fill="url(#obsidianGloss)" />
                
                {/* Nested eyes (Yin in Yang, Yang in Yin) - Styled with luxury golden stroke frames and dual-texture cores */}
                {/* Inside Obsidian side (top at cy=25): White Jade eye */}
                <circle cx="50" cy="25" r="8" fill="url(#jadeGloss)" stroke="url(#luxuryGold)" strokeWidth="1.2" />
                {/* Inside Jade side (bottom at cy=75): Black Obsidian eye */}
                <circle cx="50" cy="75" r="8" fill="url(#obsidianGloss)" stroke="url(#luxuryGold)" strokeWidth="1.2" />
                
                {/* Luxury gold rim light outline inside the perimeter */}
                <circle cx="50" cy="50" r="49.2" fill="none" stroke="url(#luxuryGold)" strokeWidth="0.8" opacity="0.95" />
                <circle cx="50" cy="50" r="48" fill="none" stroke="url(#luxuryGold)" strokeWidth="0.4" strokeDasharray="2 3" opacity="0.4" />

                {/* Highly polished 3D glass cabochon reflection overlay */}
                <path d="M 13 25 A 48 48 0 0 1 87 25 A 49 42 0 0 0 13 25 Z" fill="url(#softGloss)" opacity="0.85" pointerEvents="none" />
              </svg>
            </div>
            
            {/* Pulsing ring underneath */}
            <div 
              className={`absolute inset-0 rounded-full border-4 transition-all duration-700 animate-ping ${
                isTaijiHovered ? "border-[#D4AF37]/40 scale-125" : "border-[#D4AF37]/10"
              }`} 
              style={{ animationDuration: isTaijiHovered ? "1.5s" : "3s" }} 
            />
          </div>

          {/* Interactive Canvas Koi Pond (Self-contained Yin & Yang koi chasing each other with water physics) */}
          <div className="absolute h-40 w-40 sm:h-48 sm:w-48 md:h-[256px] md:w-[256px] lg:h-[288px] lg:w-[288px] xl:h-[320px] xl:w-[320px] rounded-full z-0 overflow-hidden">
            <BaguaPond 
              onPondClick={handleStartCeremony} 
              activeAtmosphere={activeAtmosphere} 
              isCeremonyActive={isCeremonyActive}
            />
          </div>

        </div>

        {/* Right Side: Elegant Informational Parchment Card */}
        <div className="flex-1 w-full max-w-md">
          <motion.div
            key={hoveredTrigram?.id || selectedTrigram?.id || "default"}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-white/5 bg-gradient-to-b from-[#161618] to-[#0A0A0B] p-8 shadow-[0_15px_35px_rgba(0,0,0,0.8)] backdrop-blur-md relative overflow-hidden"
          >
            {/* Soft background elemental glow */}
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full blur-[80px] bg-[#D4AF37]/5 pointer-events-none" />

            {/* Display Hexagram details, Trigram details or Default Guide */}
            {hoveredHex || selectedHex ? (
              (() => {
                const hex = hoveredHex || selectedHex!;
                return (
                  <div>
                    {/* Character and Symbol Header */}
                    <div className="flex items-end justify-between mb-4">
                      <div>
                        <div className="text-[9px] font-cinzel tracking-[0.15em] text-[#D4AF37] uppercase mb-1 glow-gold">
                          CHI TIẾT QUẺ DỊCH (LA KINH)
                        </div>
                        <h3 className="font-cinzel text-xl font-bold text-white flex items-center gap-2 leading-none">
                          Quẻ {hex.number}: {hex.vietnamese}
                        </h3>
                        <span className="text-stone-400 font-cinzel text-[11px] tracking-wider uppercase mt-1 block">
                          {hex.english}
                        </span>
                      </div>
                      <div className="flex flex-col items-center leading-none">
                        <span className="text-4xl font-noto text-[#D4AF37] font-light select-none glow-gold">
                          {hex.chinese}
                        </span>
                        <span className="text-[10px] font-mono text-stone-400 mt-1 select-none">
                          {hex.pinyin}
                        </span>
                      </div>
                    </div>

                    <div className="h-[1px] w-full bg-gradient-to-r from-white/5 via-white/10 to-transparent mb-4" />

                    {/* Meta stats grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-lg bg-black/25 p-2 border border-white/5">
                        <div className="text-[9px] font-cinzel uppercase tracking-widest text-stone-400 mb-1">
                          Thượng Quái (Ngoại)
                        </div>
                        <div className="text-xs font-cinzel text-[#D4AF37] flex items-center gap-1.5">
                          <span className="text-base leading-none font-noto">{TRIGRAMS[hex.upperTrigram]?.symbol || "☰"}</span>
                          <span>{TRIGRAMS[hex.upperTrigram]?.vietnamese || hex.upperTrigram}</span>
                        </div>
                      </div>
                      <div className="rounded-lg bg-black/25 p-2 border border-white/5">
                        <div className="text-[9px] font-cinzel uppercase tracking-widest text-stone-400 mb-1">
                          Hạ Quái (Nội)
                        </div>
                        <div className="text-xs font-cinzel text-[#D4AF37] flex items-center gap-1.5">
                          <span className="text-base leading-none font-noto">{TRIGRAMS[hex.lowerTrigram]?.symbol || "☰"}</span>
                          <span>{TRIGRAMS[hex.lowerTrigram]?.vietnamese || hex.lowerTrigram}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 text-stone-300 max-h-[220px] overflow-y-auto pr-1">
                      <div>
                        <h4 className="text-[9px] font-cinzel uppercase tracking-wider text-[#D4AF37] mb-0.5">Lời Thoán (Judgment)</h4>
                        <p className="text-xs leading-relaxed italic bg-black/15 p-2 rounded border border-white/5 text-stone-300">{hex.judgment}</p>
                      </div>

                      <div>
                        <h4 className="text-[9px] font-cinzel uppercase tracking-wider text-[#D4AF37] mb-0.5">Tượng Quẻ (Images)</h4>
                        <p className="text-xs leading-relaxed text-stone-400">{hex.imagesText}</p>
                      </div>

                      <div>
                        <h4 className="text-[9px] font-cinzel uppercase tracking-wider text-[#D4AF37] mb-0.5">Ý Nghĩa Chỉ Dẫn</h4>
                        <p className="text-xs leading-relaxed text-stone-200">{hex.meaning}</p>
                      </div>
                    </div>
                    
                    <div className="text-[9px] font-cinzel text-[#D4AF37]/70 border-l border-[#D4AF37]/30 pl-3 py-1 italic mt-4">
                      Quay bánh xe La Kinh để khám phá 64 quẻ biến dịch. Nhấp vào quẻ để ghim thông tin.
                    </div>
                  </div>
                );
              })()
            ) : hoveredTrigram || selectedTrigram ? (
              (() => {
                const item = hoveredTrigram || selectedTrigram!;
                const itemVI = trigramVietnameseDetails[item.id] || {
                  name: item.name,
                  nature: item.nature,
                  element: item.element,
                  attribute: item.attribute,
                  direction: item.direction,
                  description: item.description,
                };
                return (
                  <div>
                    {/* Character and Symbol Header */}
                    <div className="flex items-end justify-between mb-6">
                      <div>
                        <div className="text-[10px] font-cinzel tracking-[0.2em] text-[#D4AF37] uppercase mb-1 glow-gold">
                          CÕI BÁT QUÁI
                        </div>
                        <h3 className="font-cinzel text-3xl font-bold text-white flex items-center gap-3 leading-none">
                          {itemVI.name}
                        </h3>
                        <span className="text-stone-400 font-cinzel text-xs tracking-wider uppercase mt-1 block">
                          ({item.vietnamese})
                        </span>
                      </div>
                      <div className="flex flex-col items-center leading-none">
                        <span className="text-4xl font-noto text-[#D4AF37] font-light select-none glow-gold">
                          {item.chinese}
                        </span>
                        <span className="text-2xl font-noto text-stone-400 mt-1 select-none">
                          {item.symbol}
                        </span>
                      </div>
                    </div>

                    <div className="h-[1px] w-full bg-gradient-to-r from-white/5 via-white/10 to-transparent mb-6" />

                    {/* Meta stats bento grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="rounded-lg bg-black/25 p-3 border border-white/5">
                        <div className="text-[10px] font-cinzel uppercase tracking-widest text-stone-400 mb-1">
                          Hiện Thân
                        </div>
                        <div className="text-sm font-cinzel text-[#D4AF37]">
                          {itemVI.nature}
                        </div>
                      </div>
                      <div className="rounded-lg bg-black/25 p-3 border border-white/5">
                        <div className="text-[10px] font-cinzel uppercase tracking-widest text-stone-400 mb-1">
                          Ngũ Hành
                        </div>
                        <div className="text-sm font-cinzel text-[#D4AF37]">
                          {itemVI.element}
                        </div>
                      </div>
                      <div className="rounded-lg bg-black/25 p-3 border border-white/5">
                        <div className="text-[10px] font-cinzel uppercase tracking-widest text-stone-400 mb-1">
                          Thuộc Tính
                        </div>
                        <div className="text-xs font-cinzel text-[#D4AF37]">
                          {itemVI.attribute}
                        </div>
                      </div>
                      <div className="rounded-lg bg-black/25 p-3 border border-white/5">
                        <div className="text-[10px] font-cinzel uppercase tracking-widest text-stone-400 mb-1">
                          Phương Hướng
                        </div>
                        <div className="text-xs font-cinzel text-[#D4AF37]">
                          {itemVI.direction}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="font-playfair text-sm text-[#E0E0E0] leading-relaxed tracking-wide mb-6 italic">
                      &ldquo;{itemVI.description}&rdquo;
                    </p>

                    <div className="text-[10px] font-cinzel text-[#D4AF37]/70 border-l border-[#D4AF37]/30 pl-3 py-1 italic mb-2">
                      Di chuột để xem năng lượng. Nhấp để thay đổi không gian điện thờ.
                    </div>
                  </div>
                );
              })()
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Compass className="h-5 w-5 text-[#D4AF37] animate-spin glow-gold" style={{ animationDuration: "20s" }} />
                  <h3 className="font-cinzel text-xl tracking-widest text-white uppercase font-bold">
                    Đại Đàn Bát Quái
                  </h3>
                </div>
                
                <p className="font-playfair text-sm text-stone-300 leading-relaxed tracking-wide mb-6 italic">
                  &ldquo;Bạn đang đứng tại trung tâm của Điện Biến Dịch. Vòng xoay Thái Cực tạo nên vũ điệu không ngừng của Âm và Dương, phân chia thành Bát Quái (Tám Quẻ chính).&rdquo;
                </p>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                    <p className="text-xs text-stone-300">
                      <strong>Tương tác</strong>: Di chuột lên các quẻ bát quái bên ngoài để tìm hiểu về Ngũ hành, Phương hướng và Thuộc tính.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                    <p className="text-xs text-stone-300">
                      <strong>Triệu hồi cảnh giới</strong>: Nhấp vào một quẻ bất kỳ để thay đổi ánh sáng, dòng hạt năng lượng và nhạc nền của không gian.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                    <p className="text-xs text-stone-300">
                      <strong>Thỉnh ý Quẻ dịch</strong>: Gieo ba đồng tiền đồng cổ để thỉnh vấn dòng chảy vũ trụ và gieo quẻ dịch tìm giải đáp.
                    </p>
                  </div>
                </div>

                <div className="h-[1px] w-full bg-white/5 mb-6" />

                <div className="flex items-center gap-2 text-xs font-cinzel text-[#D4AF37]/60 uppercase tracking-widest animate-pulse">
                  <Sparkles className="h-3 w-3" />
                  Hãy chọn một quẻ để bắt đầu
                </div>
              </div>
            )}
          </motion.div>
        </div>

      </div>

      {/* Bottom Main Call to Action: Divination Ceremony */}


    </div>
  );
}
