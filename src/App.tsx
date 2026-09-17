import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { PhysicsCanvas } from './components/PhysicsCanvas';
import { EnergyBarChart } from './components/EnergyBarChart';
import { TelemetryPanel } from './components/TelemetryPanel';
import { MathProofModal } from './components/MathProofModal';
import {
  ForceCategory,
  Language,
  Point2D,
  SimulationParams,
  TelemetryState,
  PresetScenario,
} from './types';
import {
  calculateForceVector,
  computePathWork,
  computeTrajectoryCache,
  getForceAnalysis,
  getPointOnPath,
  PRESETS,
} from './utils/physicsEngine';

export default function App() {
  // App Core State
  const [lang, setLang] = useState<Language>('bn');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const isDark = theme === 'dark';

  const [activePresetId, setActivePresetId] = useState<string>('gravity_hills');
  const [forceCategory, setForceCategory] = useState<ForceCategory>('gravity');
  const [isMathProofOpen, setIsMathProofOpen] = useState<boolean>(false);
  const [isLargeCanvas, setIsLargeCanvas] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  // Motion Waypoints A, B, and C (Control handle)
  const [pointA, setPointA] = useState<Point2D>({ x: -6, y: -2 });
  const [pointB, setPointB] = useState<Point2D>({ x: 6, y: 3 });
  const [pointC, setPointC] = useState<Point2D>({ x: 0, y: 4 });

  // Physical Parameters
  const [params, setParams] = useState<SimulationParams>({
    mass: 2.5,
    gravity: 9.8,
    springK: 35.0,
    frictionMu: 0.25,
    viscousB: 0.6,
    electrostaticK: 80,
    customFx: 'y',
    customFy: 'x',
    timeSpeed: 1.0,
    pathType: 'arc',
    showVectors: false, // Default: force vector hidden until selected by user
    showGrid: true,
    showPotentialMap: false,
    showTrails: true,
    showComponents: false, // Default: force components hidden until selected by user
    vectorScale: 1.0,
  });

  // Animation Controls
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [pathProgress, setPathProgress] = useState<number>(0);

  // Live Telemetry
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    time: 0,
    pos: { x: -6, y: -2 },
    vel: { x: 0, y: 0 },
    acc: { x: 0, y: 0 },
    force: { x: 0, y: 0 },
    forceParallel: 0,
    forcePerp: 0,
    workDone: 0,
    kineticEnergy: 0,
    potentialEnergy: 0,
    thermalEnergy: 0,
    totalEnergy: 0,
    power: 0,
    closedLoopWork: 0,
    distanceTraveled: 0,
    pathProgress: 0,
    isLoopCompleted: false,
    path1Work: 0,
    path2Work: 0,
  });

  // Force Field Analysis (Calculus & Curl)
  const forceAnalysis = useMemo(() => {
    return getForceAnalysis(forceCategory, params);
  }, [forceCategory, params]);

  // Audio Synth SFX for motion
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playClickSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio fallback
    }
  };

  // Precompute Path 1 (Straight) vs Path 2 (Curved) Work for comparisons
  const pathComparison = useMemo(() => {
    const p1 = computePathWork(forceCategory, 'straight', params, pointA, pointB);
    const p2 = computePathWork(forceCategory, 'arc', params, pointA, pointB);
    const pClosed = computePathWork(forceCategory, 'closed_loop', params, pointA, pointB);

    return {
      path1Work: p1.totalWork,
      path2Work: p2.totalWork,
      closedWork: pClosed.totalWork,
    };
  }, [forceCategory, params, pointA, pointB]);

  // Preset Handler
  const handleSelectPreset = (preset: PresetScenario) => {
    setActivePresetId(preset.id);
    setForceCategory(preset.forceCategory);
    setParams((prev) => ({
      ...prev,
      pathType: preset.pathType,
      ...preset.params,
    }));
    setIsPlaying(false);
    setPathProgress(0);
    playClickSound();
  };

  // Reset Simulation
  const handleReset = () => {
    setIsPlaying(false);
    setPathProgress(0);
    setPointA({ x: -6, y: -2 });
    setPointB({ x: 6, y: 3 });
    playClickSound();
  };

  // Step Forward Handler
  const handleStepForward = () => {
    setIsPlaying(false);
    setPathProgress((prev) => Math.min(1, prev + 0.02));
    playClickSound();
  };

  // Analyze Custom Force trigger
  const handleAnalyzeCustomForce = () => {
    playClickSound();
  };

  // Trajectory Cache (Pre-computed 100 points for O(1) instant lookup during animation)
  const trajectoryCache = useMemo(() => {
    return computeTrajectoryCache(
      forceCategory,
      params.pathType,
      params,
      pointA,
      pointB,
      pointC,
      100
    );
  }, [forceCategory, params.pathType, params, pointA, pointB, pointC]);

  // Animation Physics Loop (Delta-time powered for smooth 60fps)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    if (isPlaying) {
      const stepAnim = (time: number) => {
        const delta = Math.min((time - lastTime) / 1000, 0.05);
        lastTime = time;

        setPathProgress((prev) => {
          const next = prev + 0.15 * params.timeSpeed * delta;
          if (next >= 1.0) {
            return 0; // Loop seamlessly
          }
          return next;
        });
        animId = requestAnimationFrame(stepAnim);
      };
      animId = requestAnimationFrame(stepAnim);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying, params.timeSpeed]);

  // Update live telemetry based on pathProgress using cached trajectory
  useEffect(() => {
    const idx = Math.min(
      trajectoryCache.length - 1,
      Math.max(0, Math.round(pathProgress * (trajectoryCache.length - 1)))
    );
    const sample = trajectoryCache[idx];
    if (!sample) return;

    const currentPt = sample.pos;
    const currentVel = sample.vel;
    const speed = Math.hypot(currentVel.x, currentVel.y);
    const force = sample.force;
    const potentialEnergy = sample.potentialEnergy;

    // Instantaneous Kinetic Energy K = 1/2 m v^2
    const kineticEnergy = 0.5 * params.mass * speed * speed;

    const workDone = sample.work;
    const thermalEnergy = sample.thermal;
    const distanceTraveled = sample.distance;

    // Total Energy
    const totalEnergy = kineticEnergy + potentialEnergy + (forceAnalysis.isConservative ? 0 : thermalEnergy);

    // Instantaneous Power P = F · v
    const power = force.x * currentVel.x + force.y * currentVel.y;

    // Closed loop work result
    const closedLoopWork = forceAnalysis.isConservative ? 0 : pathComparison.closedWork;

    setTelemetry({
      time: Math.round(pathProgress * 10 * 10) / 10,
      pos: currentPt,
      vel: currentVel,
      acc: { x: force.x / params.mass, y: force.y / params.mass },
      force,
      forceParallel: 0,
      forcePerp: 0,
      workDone,
      kineticEnergy: Math.round(kineticEnergy * 10) / 10,
      potentialEnergy: Math.round(potentialEnergy * 10) / 10,
      thermalEnergy: Math.round(thermalEnergy * 10) / 10,
      totalEnergy: Math.round(totalEnergy * 10) / 10,
      power: Math.round(power * 10) / 10,
      closedLoopWork: Math.round(closedLoopWork * 10) / 10,
      distanceTraveled,
      pathProgress,
      isLoopCompleted: pathProgress >= 0.99,
      path1Work: pathComparison.path1Work,
      path2Work: pathComparison.path2Work,
    });
  }, [
    pathProgress,
    trajectoryCache,
    params.mass,
    forceAnalysis.isConservative,
    pathComparison,
  ]);

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-cyan-500/30 selection:text-cyan-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* 1. Header Navigation Bar */}
      <Header
        lang={lang}
        setLang={setLang}
        theme={theme}
        setTheme={setTheme}
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        onReset={handleReset}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
      />

      {/* 2. Main Dashboard Grid */}
      <main className="w-full px-2 sm:px-4 md:px-5 py-4 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
        {/* Left Column: Control Panel & Preset Selectors */}
        <div className={`${isLargeCanvas ? 'hidden xl:block xl:col-span-3' : 'lg:col-span-4 xl:col-span-3'} flex flex-col gap-4`}>
          <ControlPanel
            lang={lang}
            forceCategory={forceCategory}
            setForceCategory={(cat) => {
              setForceCategory(cat);
              setPathProgress(0);
              playClickSound();
            }}
            params={params}
            setParams={setParams}
            forceAnalysis={forceAnalysis}
            onAnalyzeCustomForce={handleAnalyzeCustomForce}
            theme={theme}
          />
        </div>

        {/* Center Column: Physics Canvas & Energy Meter */}
        <div className={`${isLargeCanvas ? 'col-span-12 xl:col-span-9' : 'lg:col-span-8 xl:col-span-6'} flex flex-col gap-4`}>
          <PhysicsCanvas
            lang={lang}
            forceCategory={forceCategory}
            params={params}
            telemetry={telemetry}
            setTelemetry={setTelemetry}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            onStepForward={handleStepForward}
            onResetAnim={() => setPathProgress(0)}
            pathProgress={pathProgress}
            setPathProgress={setPathProgress}
            pointA={pointA}
            setPointA={setPointA}
            pointB={pointB}
            setPointB={setPointB}
            pointC={pointC}
            setPointC={setPointC}
            isLargeCanvas={isLargeCanvas}
            onToggleLargeCanvas={() => setIsLargeCanvas((prev) => !prev)}
            theme={theme}
          />

          {/* Energy Conservation Breakdown Chart */}
          <EnergyBarChart
            lang={lang}
            forceCategory={forceCategory}
            telemetry={telemetry}
            isConservative={forceAnalysis.isConservative}
            theme={theme}
          />
        </div>

        {/* Right Sidebar Column: Live Telemetry (with trigger to open step-by-step math proof) */}
        <div className={`${isLargeCanvas ? 'col-span-12 xl:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4' : 'lg:col-span-12 xl:col-span-3'} flex flex-col gap-4`}>
          <TelemetryPanel
            lang={lang}
            forceCategory={forceCategory}
            telemetry={telemetry}
            forceAnalysis={forceAnalysis}
            onOpenMathProof={() => setIsMathProofOpen(true)}
            theme={theme}
          />
        </div>
      </main>

      {/* 3. Footer */}
      <footer
        className={`border-t px-4 py-3 text-center text-xs font-mono transition-colors duration-200 ${
          isDark
            ? 'border-slate-800/80 bg-slate-950/80 text-slate-500'
            : 'border-slate-200 bg-white/80 text-slate-600'
        }`}
      >
        <p>
          Physics Lab — Conservative vs. Non-Conservative Forces & Energy Conservation Simulator (সংরক্ষণশীল ও অসংরক্ষণশীল বল এবং শক্তির রূপান্তর সিমুলেটর)
        </p>
      </footer>

      {/* 4. Optional Step-by-Step Math Proof Modal */}
      <MathProofModal
        isOpen={isMathProofOpen}
        onClose={() => setIsMathProofOpen(false)}
        lang={lang}
        forceCategory={forceCategory}
        params={params}
        forceAnalysis={forceAnalysis}
        theme={theme}
      />
    </div>
  );
}
