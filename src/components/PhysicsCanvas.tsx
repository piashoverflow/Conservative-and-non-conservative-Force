import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Repeat,
  Move,
  Info,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { ForceCategory, Language, Point2D, SimulationParams, TelemetryState, Vector2D } from '../types';
import { calculateForceVector, getPointOnPath } from '../utils/physicsEngine';

interface PhysicsCanvasProps {
  lang: Language;
  forceCategory: ForceCategory;
  params: SimulationParams;
  telemetry: TelemetryState;
  setTelemetry: React.Dispatch<React.SetStateAction<TelemetryState>>;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onStepForward: () => void;
  onResetAnim: () => void;
  pathProgress: number;
  setPathProgress: (p: number) => void;
  pointA: Point2D;
  setPointA: (pt: Point2D) => void;
  pointB: Point2D;
  setPointB: (pt: Point2D) => void;
  pointC: Point2D;
  setPointC: (pt: Point2D) => void;
  isLargeCanvas?: boolean;
  onToggleLargeCanvas?: () => void;
  theme?: 'dark' | 'light';
}

const PhysicsCanvasComponent: React.FC<PhysicsCanvasProps> = ({
  lang,
  forceCategory,
  params,
  telemetry,
  setTelemetry,
  isPlaying,
  setIsPlaying,
  onStepForward,
  onResetAnim,
  pathProgress,
  setPathProgress,
  pointA,
  setPointA,
  pointB,
  setPointB,
  pointC,
  setPointC,
  isLargeCanvas = false,
  onToggleLargeCanvas,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [draggingPoint, setDraggingPoint] = useState<'A' | 'B' | 'C' | null>(null);
  const trailPointsRef = useRef<Point2D[]>([]);

  // Canvas coordinate conversion setup
  const scale = 32; // 32 pixels = 1 meter in physical space

  // Convert physical (x, y) to canvas (cx, cy)
  const toCanvasCoords = (pt: Point2D, width: number, height: number): { cx: number; cy: number } => {
    const x0 = width / 2;
    const y0 = height / 2;
    return {
      cx: x0 + pt.x * scale,
      cy: y0 - pt.y * scale, // Flip y-axis for standard math Cartesian plane
    };
  };

  // Convert canvas (cx, cy) back to physical (x, y)
  const toPhysicalCoords = (cx: number, cy: number, width: number, height: number): Point2D => {
    const x0 = width / 2;
    const y0 = height / 2;
    return {
      x: (cx - x0) / scale,
      y: (y0 - cy) / scale,
    };
  };

  // Clear trail points whenever path shape, parameters, or force category changes
  useEffect(() => {
    trailPointsRef.current = [];
  }, [pointA, pointB, pointC, params.pathType, forceCategory]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI crisp drawing
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const x0 = width / 2;
    const y0 = height / 2;

    // Clear canvas with theme background
    ctx.fillStyle = isDark ? '#020617' : '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // 1. Draw Background & Coordinate Grid
    if (params.showGrid) {
      ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
      ctx.lineWidth = 1;

      // Vertical grid lines
      for (let x = x0 % scale; x < width; x += scale) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      // Horizontal grid lines
      for (let y = y0 % scale; y < height; y += scale) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Main Axes (X & Y)
      ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
      ctx.lineWidth = 2;

      // X-Axis
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(width, y0);
      ctx.stroke();

      // Y-Axis
      ctx.beginPath();
      ctx.moveTo(x0, 0);
      ctx.lineTo(x0, height);
      ctx.stroke();

      // Axis Labels
      ctx.fillStyle = isDark ? '#64748b' : '#64748b';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.fillText('X (m)', width - 40, y0 - 8);
      ctx.fillText('Y (m)', x0 + 8, 20);
      ctx.fillText('(0,0)', x0 + 6, y0 + 16);
    }

    // 2. Draw Potential Energy Contour Map & Gradient Field (if enabled)
    if (params.showPotentialMap) {
      const isConservative =
        forceCategory === 'gravity' ||
        forceCategory === 'spring' ||
        forceCategory === 'coulomb' ||
        forceCategory === 'electrostatic' ||
        forceCategory === 'buoyant';

      if (isConservative) {
        ctx.save();

        // A. Gravity: Horizontal Equipotential Isolines y = const (U = m*g*y)
        if (forceCategory === 'gravity') {
          const yLevels = [-8, -6, -4, -2, 0, 2, 4, 6, 8];
          yLevels.forEach((yPhys) => {
            const cy = y0 - yPhys * scale;
            if (cy >= 0 && cy <= height) {
              const uVal = params.mass * params.gravity * yPhys;
              ctx.strokeStyle = isDark ? 'rgba(168, 85, 247, 0.45)' : 'rgba(147, 51, 234, 0.4)';
              ctx.lineWidth = 1.5;
              ctx.setLineDash([6, 5]);
              ctx.beginPath();
              ctx.moveTo(0, cy);
              ctx.lineTo(width, cy);
              ctx.stroke();

              // Contour label badge
              ctx.fillStyle = isDark ? 'rgba(216, 180, 254, 0.95)' : 'rgba(107, 33, 168, 0.95)';
              ctx.font = 'bold 10px JetBrains Mono, monospace';
              const sign = uVal > 0 ? '+' : '';
              ctx.fillText(`U = ${sign}${uVal.toFixed(0)} J`, 16, cy - 4);
            }
          });

          // Draw small force field gradient arrows F = -m*g*j pointing DOWN
          ctx.setLineDash([]);
          const arrowSpacing = scale * 3.5;
          ctx.strokeStyle = isDark ? 'rgba(192, 132, 252, 0.35)' : 'rgba(147, 51, 234, 0.3)';
          ctx.lineWidth = 1.2;
          for (let ax = x0 % arrowSpacing; ax < width; ax += arrowSpacing) {
            for (let ay = y0 % arrowSpacing; ay < height; ay += arrowSpacing) {
              ctx.beginPath();
              ctx.moveTo(ax, ay - 6);
              ctx.lineTo(ax, ay + 6);
              ctx.lineTo(ax - 3, ay + 2);
              ctx.moveTo(ax, ay + 6);
              ctx.lineTo(ax + 3, ay + 2);
              ctx.stroke();
            }
          }
        } else if (forceCategory === 'spring') {
          // B. Spring: Concentric Circular Equipotential Rings r = const (U = 1/2 k r^2)
          const radii = [1.5, 3.0, 4.5, 6.0, 7.5, 9.0];
          radii.forEach((rPhys) => {
            const rPx = rPhys * scale;
            const uVal = 0.5 * params.springK * rPhys * rPhys;
            ctx.strokeStyle = isDark ? 'rgba(168, 85, 247, 0.45)' : 'rgba(147, 51, 234, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 5]);
            ctx.beginPath();
            ctx.arc(x0, y0, rPx, 0, 2 * Math.PI);
            ctx.stroke();

            // Ring label at 45 degrees
            const ang = Math.PI / 4;
            const lx = x0 + rPx * Math.cos(ang);
            const ly = y0 - rPx * Math.sin(ang);
            ctx.fillStyle = isDark ? 'rgba(216, 180, 254, 0.95)' : 'rgba(107, 33, 168, 0.95)';
            ctx.font = 'bold 10px JetBrains Mono, monospace';
            ctx.fillText(`U = ${uVal.toFixed(0)} J`, lx + 4, ly);
          });
        } else if (forceCategory === 'coulomb' || forceCategory === 'electrostatic') {
          // C. Coulomb: Concentric Circular Equipotential Rings around central charge
          const q1 = params.coulombQ1 ?? 5;
          const q2 = params.coulombQ2 ?? 1;
          const ke = params.coulombKe ?? 50;
          const radii = [1.5, 2.5, 4.0, 6.0, 8.5];
          radii.forEach((rPhys) => {
            const rPx = rPhys * scale;
            const uVal = (ke * q1 * q2) / rPhys;
            ctx.strokeStyle = isDark ? 'rgba(168, 85, 247, 0.45)' : 'rgba(147, 51, 234, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 5]);
            ctx.beginPath();
            ctx.arc(x0, y0, rPx, 0, 2 * Math.PI);
            ctx.stroke();

            const ang = Math.PI / 4;
            const lx = x0 + rPx * Math.cos(ang);
            const ly = y0 - rPx * Math.sin(ang);
            ctx.fillStyle = isDark ? 'rgba(216, 180, 254, 0.95)' : 'rgba(107, 33, 168, 0.95)';
            ctx.font = 'bold 10px JetBrains Mono, monospace';
            ctx.fillText(`U = ${uVal.toFixed(0)} J`, lx + 4, ly);
          });
        } else if (forceCategory === 'buoyant') {
          // D. Buoyant: Horizontal Isolines
          const rho = params.fluidDensity ?? 1000;
          const vSub = params.submergedVolume ?? 0.01;
          const g = params.gravity ?? 9.8;
          const fBuoyant = rho * vSub * g * 0.1;
          const yLevels = [-6, -3, 0, 3, 6];
          yLevels.forEach((yPhys) => {
            const cy = y0 - yPhys * scale;
            const uVal = -fBuoyant * yPhys;
            ctx.strokeStyle = isDark ? 'rgba(168, 85, 247, 0.45)' : 'rgba(147, 51, 234, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 5]);
            ctx.beginPath();
            ctx.moveTo(0, cy);
            ctx.lineTo(width, cy);
            ctx.stroke();

            ctx.fillStyle = isDark ? 'rgba(216, 180, 254, 0.95)' : 'rgba(107, 33, 168, 0.95)';
            ctx.font = 'bold 10px JetBrains Mono, monospace';
            ctx.fillText(`U = ${uVal.toFixed(0)} J`, 16, cy - 4);
          });
        }

        // Equipotential Legend badge on canvas top right
        ctx.setLineDash([]);
        const legendTxt =
          lang === 'bn'
            ? '⚡ সমবিভব রেখাচিত্র (Equipotential: U = ধ্রুবক • F⃗ = -∇U)'
            : '⚡ Equipotential Isolines: U = const • F⃗ = -∇U';
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        const txtWidth = ctx.measureText(legendTxt).width;
        const lx = width - txtWidth - 24;
        const ly = 20;
        ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.92)';
        ctx.strokeStyle = isDark ? 'rgba(168, 85, 247, 0.6)' : 'rgba(147, 51, 234, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(lx - 8, ly - 12, txtWidth + 16, 20, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isDark ? '#d8b4fe' : '#7e22ce';
        ctx.fillText(legendTxt, lx, ly + 2);

        ctx.restore();
      } else {
        // Non-conservative forces (Friction, Viscous, Drag, etc.)
        // Scalar potential U is strictly undefined (curl != 0).
        ctx.save();
        const bannerW = Math.min(width - 32, 540);
        const bannerH = 48;
        const bx = (width - bannerW) / 2;
        const by = 20;

        ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(bx, by, bannerW, bannerH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isDark ? '#fbbf24' : '#b45309';
        ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
        ctx.fillText(
          lang === 'bn'
            ? '⚠️ অসংরক্ষণশীল বল: কোনো বিভব শক্তি (U) সংজ্ঞায়িত নেই (∇ × F⃗ ≠ 0)'
            : '⚠️ Non-Conservative Force: No scalar potential U exists (∇ × F⃗ ≠ 0)',
          bx + 14,
          by + 18
        );

        ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillText(
          lang === 'bn'
            ? 'কাজ পথের ওপর নির্ভরশীল (∮ F·dr ≠ 0); যান্ত্রিক শক্তি তাপে (Thermal Loss) অপচয় হয়।'
            : 'Work is path-dependent (∮ F·dr ≠ 0); mechanical energy is dissipated as heat.',
          bx + 14,
          by + 34
        );
        ctx.restore();
      }
    }

    // 3. Render Motion Path Curve
    const pathPointsCount = 120;
    const pathPoints: { cx: number; cy: number }[] = [];

    for (let i = 0; i <= pathPointsCount; i++) {
      const t = i / pathPointsCount;
      const pt = getPointOnPath(params.pathType, t, pointA, pointB, pointC);
      pathPoints.push(toCanvasCoords(pt, width, height));
    }

    // Draw path outer glow
    ctx.strokeStyle =
      forceCategory === 'friction' || forceCategory === 'viscous'
        ? isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(217, 119, 6, 0.25)'
        : isDark ? 'rgba(6, 182, 212, 0.35)' : 'rgba(2, 132, 199, 0.25)';
    ctx.lineWidth = 9;
    ctx.beginPath();
    pathPoints.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.cx, pt.cy);
      else ctx.lineTo(pt.cx, pt.cy);
    });
    ctx.stroke();

    // Draw main solid trajectory path line
    ctx.strokeStyle =
      forceCategory === 'friction' || forceCategory === 'viscous'
        ? isDark ? '#fbbf24' : '#d97706'
        : isDark ? '#22d3ee' : '#0284c7';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([]); // Strictly solid line
    ctx.beginPath();
    pathPoints.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.cx, pt.cy);
      else ctx.lineTo(pt.cx, pt.cy);
    });
    ctx.stroke();

    // 4. Render Particle Motion Trail
    if (params.showTrails && trailPointsRef.current.length > 1) {
      ctx.lineWidth = 2;
      for (let i = 1; i < trailPointsRef.current.length; i++) {
        const p1 = toCanvasCoords(trailPointsRef.current[i - 1], width, height);
        const p2 = toCanvasCoords(trailPointsRef.current[i], width, height);
        const alpha = i / trailPointsRef.current.length;

        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.moveTo(p1.cx, p1.cy);
        ctx.lineTo(p2.cx, p2.cy);
        ctx.stroke();
      }
    }

    // 5. Render Waypoints A, B, and C (Draggable handles)
    const posA = toCanvasCoords(pointA, width, height);
    const posB = toCanvasCoords(pointB, width, height);
    const posC = toCanvasCoords(pointC, width, height);

    // Waypoint A (Start - Emerald)
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(posA.cx, posA.cy, 9, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
    ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
    ctx.fillText('A (Start)', posA.cx - 24, posA.cy - 14);

    // Waypoint B (End - Rose)
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(posB.cx, posB.cy, 9, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
    ctx.fillText('B (End)', posB.cx - 20, posB.cy - 14);

    // Waypoint C (Control Handle to Drag Curve Shape - Purple)
    ctx.fillStyle = '#a855f7';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(posC.cx, posC.cy, 9, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = isDark ? '#f3e8ff' : '#0f172a';
    ctx.font = 'extrabold 12px Plus Jakarta Sans, sans-serif';
    ctx.fillText('C (Curve Shape)', posC.cx - 38, posC.cy - 14);

    // 6. Render Active Object (Solid Orange Ball without glow aura)
    const currentPhysPt = getPointOnPath(params.pathType, pathProgress, pointA, pointB, pointC);
    const currentCanvasPt = toCanvasCoords(currentPhysPt, width, height);

    // Compute instantaneous velocity and force vectors
    const dt = 0.002;
    const nextPhysPt = getPointOnPath(
      params.pathType,
      Math.min(1, pathProgress + dt),
      pointA,
      pointB,
      pointC
    );
    const vx = (nextPhysPt.x - currentPhysPt.x) / dt;
    const vy = (nextPhysPt.y - currentPhysPt.y) / dt;
    const currentVel: Vector2D = { x: vx, y: vy };

    const { force } = calculateForceVector(forceCategory, currentPhysPt, currentVel, params);

    // Solid Orange Ball (No radial gradient blur or glow aura)
    const particleRadius = 13 + Math.sqrt(params.mass) * 1.5;

    ctx.fillStyle = '#ea580c'; // Crisp Solid Orange
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(currentCanvasPt.cx, currentCanvasPt.cy, particleRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Mass label inside solid orange ball
    ctx.fillStyle = '#ffffff';
    ctx.font = 'extrabold 11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${params.mass}kg`, currentCanvasPt.cx, currentCanvasPt.cy);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // 7. Draw Vector Arrows (Force, Velocity, Parallel/Perp Components)
    if (params.showVectors) {
      const vScale = 3.5;
      const fScale = 1.8;

      // Draw Force Vector F (Cyan / Amber)
      if (Math.hypot(force.x, force.y) > 0.1) {
        const fEndCanvas = {
          cx: currentCanvasPt.cx + force.x * fScale,
          cy: currentCanvasPt.cy - force.y * fScale, // Invert y for canvas
        };

        const fColor =
          forceCategory === 'friction' || forceCategory === 'viscous' ? '#f59e0b' : '#06b6d4';
        drawVectorArrow(ctx, currentCanvasPt, fEndCanvas, fColor, 3, 'F');
      }

      // Draw Velocity Vector v (Yellow)
      if (Math.hypot(vx, vy) > 0.1) {
        const vEndCanvas = {
          cx: currentCanvasPt.cx + vx * vScale,
          cy: currentCanvasPt.cy - vy * vScale,
        };
        drawVectorArrow(ctx, currentCanvasPt, vEndCanvas, '#eab308', 2.5, 'v');
      }

      // Draw Force Components (F_parallel & F_perp) if enabled
      if (params.showComponents && Math.hypot(vx, vy) > 0.1) {
        const speed = Math.hypot(vx, vy);
        const ux = vx / speed;
        const uy = vy / speed;

        // F_parallel = (F · u) u
        const fDotU = force.x * ux + force.y * uy;
        const fParX = fDotU * ux;
        const fParY = fDotU * uy;

        // F_perp = F - F_parallel
        const fPerpX = force.x - fParX;
        const fPerpY = force.y - fParY;

        // Draw F_parallel (Emerald Green)
        if (Math.hypot(fParX, fParY) > 0.1) {
          const parEnd = {
            cx: currentCanvasPt.cx + fParX * fScale,
            cy: currentCanvasPt.cy - fParY * fScale,
          };
          drawVectorArrow(ctx, currentCanvasPt, parEnd, '#10b981', 2, 'F_par');
        }

        // Draw F_perp (Purple)
        if (Math.hypot(fPerpX, fPerpY) > 0.1) {
          const perpEnd = {
            cx: currentCanvasPt.cx + fPerpX * fScale,
            cy: currentCanvasPt.cy - fPerpY * fScale,
          };
          drawVectorArrow(ctx, currentCanvasPt, perpEnd, '#a855f7', 1.8, 'F_perp');
        }
      }
    }

    // Update trail
    if (isPlaying) {
      trailPointsRef.current.push(currentPhysPt);
      if (trailPointsRef.current.length > 80) trailPointsRef.current.shift();
    }
  }, [
    params,
    forceCategory,
    pathProgress,
    pointA,
    pointB,
    pointC,
    isPlaying,
  ]);

  // Helper to draw Arrow Vector
  const drawVectorArrow = (
    ctx: CanvasRenderingContext2D,
    from: { cx: number; cy: number },
    to: { cx: number; cy: number },
    color: string,
    lineWidth: number,
    label: string
  ) => {
    const headLen = 10;
    const dx = to.cx - from.cx;
    const dy = to.cy - from.cy;
    const angle = Math.atan2(dy, dx);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;

    ctx.beginPath();
    ctx.moveTo(from.cx, from.cy);
    ctx.lineTo(to.cx, to.cy);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(to.cx, to.cy);
    ctx.lineTo(to.cx - headLen * Math.cos(angle - Math.PI / 6), to.cy - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(to.cx - headLen * Math.cos(angle + Math.PI / 6), to.cy - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    // Label
    ctx.font = 'bold 12px JetBrains Mono, monospace';
    ctx.fillText(label, to.cx + 8, to.cy + 4);
  };

  // Drag handles logic for Waypoints A, B, and C
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const posA = toCanvasCoords(pointA, canvas.width, canvas.height);
    const posB = toCanvasCoords(pointB, canvas.width, canvas.height);
    const posC = toCanvasCoords(pointC, canvas.width, canvas.height);

    if (Math.hypot(cx - posA.cx, cy - posA.cy) < 18) {
      setDraggingPoint('A');
    } else if (Math.hypot(cx - posB.cx, cy - posB.cy) < 18) {
      setDraggingPoint('B');
    } else if (Math.hypot(cx - posC.cx, cy - posC.cy) < 18) {
      setDraggingPoint('C');
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingPoint) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const physPt = toPhysicalCoords(cx, cy, canvas.width, canvas.height);
    // Clamp inside canvas boundary
    physPt.x = Math.max(-10, Math.min(10, physPt.x));
    physPt.y = Math.max(-7, Math.min(7, physPt.y));

    if (draggingPoint === 'A') setPointA(physPt);
    if (draggingPoint === 'B') setPointB(physPt);
    if (draggingPoint === 'C') setPointC(physPt);
    trailPointsRef.current = []; // Clear trail lines during active dragging
  };

  const handleMouseUp = () => setDraggingPoint(null);

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 flex flex-col gap-3 border shadow-xl relative transition-colors duration-200 ${
        isDark
          ? 'bg-slate-900/80 border-slate-800 text-slate-100 backdrop-blur-md'
          : 'bg-white border-slate-300 text-slate-900 shadow-lg'
      }`}
    >
      {/* Canvas Top Bar: Play, Step, Reset, Large Canvas Toggle and Vector Legend */}
      <div className={`flex flex-wrap items-center justify-between gap-2.5 border-b pb-2.5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center flex-wrap gap-2">
          {/* Play / Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-sm active:scale-95 ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-extrabold hover:brightness-110'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-amber-500" /> : <Play className="w-3.5 h-3.5 fill-slate-950" />}
            <span>{isPlaying ? (lang === 'bn' ? 'পজ' : 'Pause') : lang === 'bn' ? 'চালু করুন' : 'Simulate'}</span>
          </button>

          {/* Step Forward */}
          <button
            onClick={onStepForward}
            className={`p-1.5 border rounded-xl transition-all active:scale-95 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
            title="Step Forward"
          >
            <SkipForward className="w-3.5 h-3.5 text-cyan-500" />
          </button>

          {/* Reset Motion */}
          <button
            onClick={onResetAnim}
            className={`p-1.5 border rounded-xl transition-all active:scale-95 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
            title="Reset Motion"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
          </button>

          {/* Large Canvas / Focus View Toggle Button */}
          {onToggleLargeCanvas && (
            <button
              onClick={onToggleLargeCanvas}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all active:scale-95 ${
                isLargeCanvas
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                  : isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-cyan-900 border-slate-300'
              }`}
              title={isLargeCanvas ? 'Exit Large Canvas' : 'View in Large Canvas Mode'}
            >
              {isLargeCanvas ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5 text-cyan-500" />}
              <span>{isLargeCanvas ? (lang === 'bn' ? 'স্বাভাবিক ভিউ' : 'Normal') : (lang === 'bn' ? 'বড় ক্যানভাস' : 'Large Canvas')}</span>
            </button>
          )}
        </div>

        {/* Vector Legend */}
        <div className={`flex items-center gap-3 sm:gap-4 text-xs font-mono font-extrabold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0"></span>
            <span>F (Force)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
            <span>v (Velocity)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span>F_∥ (Parallel)</span>
          </span>
        </div>
      </div>

      {/* Main Canvas View (Expands to large height when in large canvas mode) */}
      <div className={`relative w-full ${
        isLargeCanvas
          ? 'h-[600px] sm:h-[660px] lg:h-[720px]'
          : 'h-[480px] sm:h-[540px] lg:h-[580px]'
      } rounded-xl overflow-hidden border shadow-inner transition-all duration-300 ${
        isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-300'
      }`}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`w-full h-full block ${draggingPoint ? 'cursor-grabbing' : 'cursor-crosshair'}`}
        />

        {/* Floating Instruction overlay inside canvas */}
        <div className={`absolute top-3 left-3 border rounded-lg px-3 py-1.5 text-xs font-mono shadow-md ${
          isDark ? 'bg-slate-900/95 border-slate-800 text-slate-200' : 'bg-white/95 border-slate-300 text-slate-950 font-black'
        }`}>
          {lang === 'bn'
            ? `বিন্দু A(${pointA.x.toFixed(1)}, ${pointA.y.toFixed(1)}) → B(${pointB.x.toFixed(1)}, ${pointB.y.toFixed(1)}) • C(${pointC.x.toFixed(1)}, ${pointC.y.toFixed(1)}) (A, B ও C ড্র্যাগ করে পথ পরিবর্তন করুন)`
            : `Waypoints: A(${pointA.x.toFixed(1)}, ${pointA.y.toFixed(1)}) → B(${pointB.x.toFixed(1)}, ${pointB.y.toFixed(1)}) • Drag A, B & C handles to reshape curve`}
        </div>

        {/* Floating Live Telemetry HUD inside canvas (Especially rich and helpful in Large Canvas Mode) */}
        {isLargeCanvas && (
          <div className={`absolute bottom-3 left-3 right-3 sm:right-auto border rounded-xl p-2.5 text-xs font-mono shadow-2xl backdrop-blur-md flex flex-wrap items-center gap-3 animate-fade-in ${
            isDark ? 'bg-slate-900/95 border-slate-700 text-slate-200' : 'bg-white/95 border-slate-300 text-slate-900'
          }`}>
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-cyan-600 dark:text-cyan-400">W (Work):</span>
              <span className="font-extrabold">{telemetry.workDone.toFixed(1)} J</span>
            </div>
            <div className="w-px h-3.5 bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-emerald-600 dark:text-emerald-400">Ek (Kinetic):</span>
              <span className="font-extrabold">{telemetry.kineticEnergy.toFixed(1)} J</span>
            </div>
            <div className="w-px h-3.5 bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-purple-600 dark:text-purple-400">Ep (Potential):</span>
              <span className="font-extrabold">{telemetry.potentialEnergy.toFixed(1)} J</span>
            </div>
            <div className="w-px h-3.5 bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-amber-600 dark:text-amber-400">Speed |v|:</span>
              <span className="font-extrabold">{Math.hypot(telemetry.vel.x, telemetry.vel.y).toFixed(1)} m/s</span>
            </div>
            {telemetry.thermalEnergy > 0.01 && (
              <>
                <div className="w-px h-3.5 bg-slate-700 hidden sm:block" />
                <div className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                  <span>Q (Thermal):</span>
                  <span className="font-extrabold">{telemetry.thermalEnergy.toFixed(1)} J</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Canvas Animation Progress Scrubber */}
      <div className={`flex items-center justify-between gap-3 border rounded-xl px-3.5 py-2 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-300'
      }`}>
        <span className={`text-xs font-mono font-bold whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {lang === 'bn' ? 'গতিপথ স্ক্রাবার:' : 'Path Progress:'}
        </span>
        <div className="flex items-center gap-3 w-full flex-1 px-1">
          <span className="text-[11px] text-slate-400 font-mono">0%</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.002"
            value={pathProgress}
            onChange={(e) => {
              setIsPlaying(false);
              setPathProgress(parseFloat(e.target.value));
            }}
            className="w-full accent-cyan-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
          />
          <span className="text-[11px] text-cyan-400 font-mono font-bold w-10 text-right">
            {(pathProgress * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export const PhysicsCanvas = React.memo(PhysicsCanvasComponent);
