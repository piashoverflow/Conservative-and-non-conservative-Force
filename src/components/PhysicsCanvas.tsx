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

    // 2. Draw Potential Energy Contour Map (if enabled)
    if (params.showPotentialMap) {
      const stepSize = 16;
      for (let px = 0; px < width; px += stepSize) {
        for (let py = 0; py < height; py += stepSize) {
          const physPt = toPhysicalCoords(px + stepSize / 2, py + stepSize / 2, width, height);
          const { potentialEnergy } = calculateForceVector(forceCategory, physPt, { x: 0, y: 0 }, params);

          // Map energy to color intensity
          const normU = Math.min(1, Math.max(0, potentialEnergy / 150));
          ctx.fillStyle = `rgba(168, 85, 247, ${normU * 0.25})`;
          ctx.fillRect(px, py, stepSize, stepSize);
        }
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
      {/* Canvas Top Bar: Vector Legend */}
      <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span className="font-extrabold">{lang === 'bn' ? 'ক্যানভাস সিমুলেশন' : 'Simulation Stage'}</span>
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

      {/* Main Canvas View (Tall square-like aspect ratio) */}
      <div className={`relative w-full h-[480px] sm:h-[540px] lg:h-[580px] rounded-xl overflow-hidden border shadow-inner ${
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
      </div>

      {/* Canvas Animation Controls Bar */}
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 border rounded-xl p-3 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-300'
      }`}>
        {/* Play / Pause / Step Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md active:scale-95 ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-extrabold hover:brightness-110'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-amber-500" /> : <Play className="w-4 h-4 fill-slate-950" />}
            <span>{isPlaying ? (lang === 'bn' ? 'পজ' : 'Pause') : lang === 'bn' ? 'চালু করুন' : 'Simulate'}</span>
          </button>

          <button
            onClick={onStepForward}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all active:scale-95"
            title="Step Forward"
          >
            <SkipForward className="w-4 h-4 text-cyan-400" />
          </button>

          <button
            onClick={onResetAnim}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all active:scale-95"
            title="Reset Motion"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
          </button>
        </div>

        {/* Scrubber Progress Slider */}
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md px-2">
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
          <span className="text-[11px] text-cyan-400 font-mono font-bold">
            {(pathProgress * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export const PhysicsCanvas = React.memo(PhysicsCanvasComponent);
