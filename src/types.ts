export type ForceCategory =
  | 'gravity'
  | 'spring'
  | 'friction'
  | 'viscous'
  | 'coulomb'
  | 'buoyant'
  | 'quadratic_drag'
  | 'induced_electric'
  | 'magnetic_lorentz'
  | 'custom'
  | 'electrostatic';

export type PathType = 'straight' | 'arc' | 'scurve' | 'closed_loop' | 'zigzag';

export type Language = 'bn' | 'en';

export interface Point2D {
  x: number;
  y: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface SimulationParams {
  mass: number;           // kg (0.5 to 10)
  gravity: number;        // m/s² (1 to 25)
  springK: number;        // N/m (1 to 100)
  frictionMu: number;     // dimensionless (0.0 to 1.0)
  viscousB: number;       // N·s/m (0.0 to 5.0)
  electrostaticK: number; // N·m²/C² scale (10 to 500)
  // Coulomb / Electrostatic Force
  coulombQ1: number;      // Source charge q1 (+/- Coulombs)
  coulombQ2: number;      // Test charge q2 (+/- Coulombs)
  coulombKe: number;      // Coulomb constant scale ke
  // Buoyant Force
  fluidDensity: number;   // rho_fluid (kg/m³)
  submergedVolume: number;// V_sub (m³)
  // Quadratic Drag Force
  dragCd: number;         // Drag coefficient Cd
  airDensity: number;     // Air density rho (kg/m³)
  crossArea: number;      // Cross-sectional Area A (m²)
  // Induced Electric Field
  dBdt: number;           // Rate of magnetic flux/field change dB/dt (T/s)
  inducedCharge: number;  // Test charge q (C)
  // Magnetic Lorentz Force
  lorentzQ: number;       // Particle charge q (C)
  lorentzBz: number;      // Out-of-plane magnetic field Bz (T)
  // Custom
  customFx: string;       // Fx(x,y) string expr
  customFy: string;       // Fy(x,y) string expr
  timeSpeed: number;      // 0.1 to 3.0
  pathType: PathType;
  showVectors: boolean;
  showGrid: boolean;
  showPotentialMap: boolean;
  showTrails: boolean;
  showComponents: boolean;
  vectorScale: number;
}

export interface TelemetryState {
  time: number;
  pos: Point2D;
  vel: Vector2D;
  acc: Vector2D;
  force: Vector2D;
  forceParallel: number;
  forcePerp: number;
  workDone: number;
  kineticEnergy: number;
  potentialEnergy: number;
  thermalEnergy: number;
  totalEnergy: number;
  power: number;
  closedLoopWork: number;
  distanceTraveled: number;
  pathProgress: number; // 0 to 1
  isLoopCompleted: boolean;
}

export interface ForceAnalysis {
  isConservative: boolean;
  curlZ: number;               // dFy/dx - dFx/dy
  partialFx_dy: number;
  partialFy_dx: number;
  potentialExpr: string;
  explanationBn: string;
  explanationEn: string;
  closedLoopWorkResult: number;
  pathIndependenceStatus: 'independent' | 'dependent';
}

export interface PresetScenario {
  id: string;
  nameEn: string;
  nameBn: string;
  descriptionEn: string;
  descriptionBn: string;
  forceCategory: ForceCategory;
  pathType: PathType;
  params: Partial<SimulationParams>;
}
