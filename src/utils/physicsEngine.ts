import {
  ForceCategory,
  PathType,
  Point2D,
  SimulationParams,
  TelemetryState,
  Vector2D,
  ForceAnalysis,
  PresetScenario,
} from '../types';
import { analyzeCustomForceField, evaluateMathExpr } from './mathParser';

/**
 * Computes parametric 2D coordinate on selected path at parameter t in [0, 1]
 */
export function getPointOnPath(
  pathType: PathType,
  t: number,
  pointA: Point2D = { x: -6, y: -2 },
  pointB: Point2D = { x: 6, y: 3 },
  pointC: Point2D = { x: 0, y: 4 }
): Point2D {
  const clampedT = Math.max(0, Math.min(1, t));

  // Vector AB and normal
  const dx = pointB.x - pointA.x;
  const dy = pointB.y - pointA.y;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;

  switch (pathType) {
    case 'straight': {
      return {
        x: pointA.x + clampedT * dx,
        y: pointA.y + clampedT * dy,
      };
    }
    case 'arc': {
      // Quadratic Bezier where Point C lies EXACTLY on the curve at t = 0.5
      // Control point P_ctrl = 2*C - 0.5*A - 0.5*B
      const ctrlX = 2 * pointC.x - 0.5 * pointA.x - 0.5 * pointB.x;
      const ctrlY = 2 * pointC.y - 0.5 * pointA.y - 0.5 * pointB.y;

      const u = 1 - clampedT;
      const tt = clampedT * clampedT;
      const uu = u * u;
      return {
        x: uu * pointA.x + 2 * u * clampedT * ctrlX + tt * pointB.x,
        y: uu * pointA.y + 2 * u * clampedT * ctrlY + tt * pointB.y,
      };
    }
    case 'scurve': {
      // S-Curve where Point C lies EXACTLY on the first peak at t = 0.25
      const baseAtPeakX = pointA.x + 0.25 * dx;
      const baseAtPeakY = pointA.y + 0.25 * dy;
      const devX = pointC.x - baseAtPeakX;
      const devY = pointC.y - baseAtPeakY;
      const offsetFactor = Math.sin(2 * Math.PI * clampedT);
      return {
        x: pointA.x + clampedT * dx + devX * offsetFactor,
        y: pointA.y + clampedT * dy + devY * offsetFactor,
      };
    }
    case 'zigzag': {
      // Triangle path A -> C -> B where Point C is the apex vertex
      if (clampedT <= 0.5) {
        const localT = clampedT * 2;
        return {
          x: pointA.x + localT * (pointC.x - pointA.x),
          y: pointA.y + localT * (pointC.y - pointA.y),
        };
      } else {
        const localT = (clampedT - 0.5) * 2;
        return {
          x: pointC.x + localT * (pointB.x - pointC.x),
          y: pointC.y + localT * (pointB.y - pointC.y),
        };
      }
    }
    case 'closed_loop': {
      // Closed loop passing through B (t=0) -> C (t=0.25) -> A (t=0.5) -> B (t=1)
      const midX = (pointA.x + pointB.x) / 2;
      const midY = (pointA.y + pointB.y) / 2;
      const theta = clampedT * 2 * Math.PI;

      const vecBx = (pointB.x - pointA.x) / 2;
      const vecBy = (pointB.y - pointA.y) / 2;
      const vecCx = pointC.x - midX;
      const vecCy = pointC.y - midY;

      return {
        x: midX + Math.cos(theta) * vecBx + Math.sin(theta) * vecCx,
        y: midY + Math.cos(theta) * vecBy + Math.sin(theta) * vecCy,
      };
    }
    default:
      return {
        x: pointA.x + clampedT * dx,
        y: pointA.y + clampedT * dy,
      };
  }
}

/**
 * Computes Force Vector (Fx, Fy) at given position and velocity for active force category
 */
export function calculateForceVector(
  category: ForceCategory,
  pos: Point2D,
  vel: Vector2D,
  params: SimulationParams
): { force: Vector2D; potentialEnergy: number } {
  let fx = 0;
  let fy = 0;
  let potentialEnergy = 0;

  switch (category) {
    case 'gravity': {
      // F = (0, -m*g)
      fx = 0;
      fy = -params.mass * params.gravity;
      // Potential Energy U = m*g*h (relative to y = -10)
      potentialEnergy = params.mass * params.gravity * (pos.y + 10);
      break;
    }
    case 'spring': {
      // F = -k*x i - k*y j
      fx = -params.springK * pos.x;
      fy = -params.springK * pos.y;
      // Potential Energy U = 1/2 k r^2
      const r2 = pos.x * pos.x + pos.y * pos.y;
      potentialEnergy = 0.5 * params.springK * r2;
      break;
    }
    case 'friction': {
      // F_k = -mu * m * g * v / |v|
      const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
      if (speed > 0.0001) {
        const fMag = params.frictionMu * params.mass * params.gravity;
        fx = -fMag * (vel.x / speed);
        fy = -fMag * (vel.y / speed);
      } else {
        fx = 0;
        fy = 0;
      }
      // Non-conservative, no single-valued potential energy U
      potentialEnergy = 0;
      break;
    }
    case 'viscous': {
      // F_v = -b * v
      fx = -params.viscousB * vel.x;
      fy = -params.viscousB * vel.y;
      potentialEnergy = 0;
      break;
    }
    case 'electrostatic':
    case 'coulomb': {
      // Coulomb Electrostatic Central Field F_e = k_e * q1 * q2 / r^2 * r_hat
      const q1 = params.coulombQ1 ?? 5;
      const q2 = params.coulombQ2 ?? 1;
      const ke = params.coulombKe ?? 50;
      const rSq = pos.x * pos.x + pos.y * pos.y + 0.25; // smoothing constant epsilon=0.25
      const r = Math.sqrt(rSq);
      const fMag = (ke * q1 * q2) / rSq;
      fx = fMag * (pos.x / r);
      fy = fMag * (pos.y / r);
      potentialEnergy = (ke * q1 * q2) / r;
      break;
    }
    case 'buoyant': {
      // Buoyant Force F_b = rho * V_sub * g (upward +j)
      const rho = params.fluidDensity ?? 1000;
      const vSub = params.submergedVolume ?? 0.01;
      const g = params.gravity ?? 9.8;
      const fBuoyant = rho * vSub * g * 0.1; // scaled for canvas physics
      fx = 0;
      fy = fBuoyant;
      potentialEnergy = -fBuoyant * (pos.y + 10);
      break;
    }
    case 'quadratic_drag': {
      // Quadratic Air Drag F_d = -0.5 * rho * Cd * A * v^2 * v_hat
      const cd = params.dragCd ?? 0.47;
      const rho = params.airDensity ?? 1.225;
      const area = params.crossArea ?? 0.1;
      const speed = Math.hypot(vel.x, vel.y);
      const dragFactor = 0.5 * rho * cd * area;
      fx = -dragFactor * speed * vel.x;
      fy = -dragFactor * speed * vel.y;
      potentialEnergy = 0;
      break;
    }
    case 'induced_electric': {
      // Induced Electric Field Force F_ind = q * E_ind where E_ind = (-y/2 dB/dt i + x/2 dB/dt j)
      const dbdt = params.dBdt ?? 2.0;
      const q = params.inducedCharge ?? 1.0;
      fx = -q * (pos.y / 2) * dbdt;
      fy = q * (pos.x / 2) * dbdt;
      potentialEnergy = 0;
      break;
    }
    case 'magnetic_lorentz': {
      // Magnetic Lorentz Force F_m = q (v x B) = q * Bz (vy i - vx j)
      const q = params.lorentzQ ?? 2.0;
      const bz = params.lorentzBz ?? 3.0;
      fx = q * vel.y * bz;
      fy = -q * vel.x * bz;
      potentialEnergy = 0; // Strictly Workless constraint force (Power P = F . v = 0)
      break;
    }
    case 'custom': {
      const speed = Math.hypot(vel.x, vel.y);
      fx = evaluateMathExpr(params.customFx, { x: pos.x, y: pos.y, vx: vel.x, vy: vel.y, v: speed, m: params.mass });
      fy = evaluateMathExpr(params.customFy, { x: pos.x, y: pos.y, vx: vel.x, vy: vel.y, v: speed, m: params.mass });
      
      // Potential energy estimate for conservative fields
      const r = Math.hypot(pos.x, pos.y);
      potentialEnergy = 0.5 * Math.abs(fx * pos.x + fy * pos.y);
      break;
    }
  }

  return { force: { x: fx, y: fy }, potentialEnergy };
}

/**
 * Pre-computes line integral Work W = ∫ F · dr for a path from t=0 to t=maxT
 */
export function computePathWork(
  category: ForceCategory,
  pathType: PathType,
  params: SimulationParams,
  pointA: Point2D,
  pointB: Point2D,
  pointC: Point2D = { x: 0, y: 4 },
  steps: number = 200,
  maxT: number = 1.0
): { totalWork: number; totalDistance: number; finalThermal: number } {
  let work = 0;
  let distance = 0;
  let thermal = 0;

  const clampedMaxT = Math.max(0, Math.min(1.0, maxT));
  if (clampedMaxT <= 0) {
    return { totalWork: 0, totalDistance: 0, finalThermal: 0 };
  }

  const actualSteps = Math.max(1, Math.round(steps * clampedMaxT));
  const dt = clampedMaxT / actualSteps;
  let prevPt = getPointOnPath(pathType, 0, pointA, pointB, pointC);

  for (let i = 1; i <= actualSteps; i++) {
    const t = i * dt;
    const currPt = getPointOnPath(pathType, t, pointA, pointB, pointC);

    const drx = currPt.x - prevPt.x;
    const dry = currPt.y - prevPt.y;
    const ds = Math.hypot(drx, dry);

    // Estimate velocity direction along segment
    const vx = drx / dt;
    const vy = dry / dt;
    const midPt = { x: (prevPt.x + currPt.x) / 2, y: (prevPt.y + currPt.y) / 2 };

    const { force } = calculateForceVector(category, midPt, { x: vx, y: vy }, params);

    // Work = F · dr = Fx*drx + Fy*dry
    const dW = force.x * drx + force.y * dry;
    work += dW;
    distance += ds;

    if (category === 'friction' || category === 'viscous' || category === 'quadratic_drag') {
      thermal += Math.abs(dW);
    }

    prevPt = currPt;
  }

  return {
    totalWork: Math.round(work * 100) / 100,
    totalDistance: Math.round(distance * 100) / 100,
    finalThermal: Math.round(thermal * 100) / 100,
  };
}

/**
 * Pre-computes trajectory cache for O(1) instant lookup during animation
 */
export function computeTrajectoryCache(
  category: ForceCategory,
  pathType: PathType,
  params: SimulationParams,
  pointA: Point2D,
  pointB: Point2D,
  pointC: Point2D = { x: 0, y: 4 },
  steps: number = 100
) {
  const cache: {
    t: number;
    pos: Point2D;
    vel: Vector2D;
    work: number;
    thermal: number;
    distance: number;
    force: Vector2D;
    potentialEnergy: number;
  }[] = [];

  let work = 0;
  let distance = 0;
  let thermal = 0;

  const dt = 1.0 / Math.max(1, steps);
  let prevPt = getPointOnPath(pathType, 0, pointA, pointB, pointC);

  const { force: initForce, potentialEnergy: initEp } = calculateForceVector(
    category,
    prevPt,
    { x: 0, y: 0 },
    params
  );

  cache.push({
    t: 0,
    pos: prevPt,
    vel: { x: 0, y: 0 },
    work: 0,
    thermal: 0,
    distance: 0,
    force: initForce,
    potentialEnergy: initEp,
  });

  for (let i = 1; i <= steps; i++) {
    const t = i * dt;
    const currPt = getPointOnPath(pathType, t, pointA, pointB, pointC);

    const drx = currPt.x - prevPt.x;
    const dry = currPt.y - prevPt.y;
    const ds = Math.hypot(drx, dry);

    // Instantaneous velocity approximation along segment
    const vx = drx / (dt * 0.1);
    const vy = dry / (dt * 0.1);
    const midPt = { x: (prevPt.x + currPt.x) / 2, y: (prevPt.y + currPt.y) / 2 };

    const { force, potentialEnergy } = calculateForceVector(
      category,
      midPt,
      { x: vx, y: vy },
      params
    );

    const dW = force.x * drx + force.y * dry;
    work += dW;
    distance += ds;

    if (category === 'friction' || category === 'viscous' || category === 'quadratic_drag') {
      thermal += Math.abs(dW);
    }

    cache.push({
      t,
      pos: currPt,
      vel: { x: vx, y: vy },
      work: Math.round(work * 100) / 100,
      thermal: Math.round(thermal * 100) / 100,
      distance: Math.round(distance * 100) / 100,
      force,
      potentialEnergy,
    });

    prevPt = currPt;
  }

  return cache;
}

/**
 * Analyzes force category properties for math solver
 */
export function getForceAnalysis(
  category: ForceCategory,
  params: SimulationParams
): ForceAnalysis {
  switch (category) {
    case 'gravity':
      return {
        isConservative: true,
        curlZ: 0,
        partialFx_dy: 0,
        partialFy_dx: 0,
        potentialExpr: 'U(y) = mgh = mg(y - y_0)',
        explanationBn:
          'মহাকর্ষ বল একটি সংরক্ষণশীল বল। যে কোনো আবদ্ধ পথ অতিক্রম করলে এর দ্বারা কৃতকাজ শূন্য হয় (W_net = 0) এবং কাজ গতিপথের ওপর নির্ভর করে না।',
        explanationEn:
          'Gravitational force is conservative. Closed-loop work is strictly zero (W_net = 0) and work depends only on initial and final positions.',
        closedLoopWorkResult: 0,
        pathIndependenceStatus: 'independent',
      };
    case 'spring':
      return {
        isConservative: true,
        curlZ: 0,
        partialFx_dy: 0,
        partialFy_dx: 0,
        potentialExpr: 'U(r) = \\frac{1}{2} k r^2',
        explanationBn:
          'স্প্রিং এর প্রত্যয়নী বল একটি সংরক্ষণশীল বল। এটি স্থিতিশক্তি রূপে সঞ্চিত হয় U = ½kr²।',
        explanationEn:
          'Spring restoring force is conservative. Mechanical energy converts reversibly into Elastic Potential Energy U = ½kr².',
        closedLoopWorkResult: 0,
        pathIndependenceStatus: 'independent',
      };
    case 'friction':
      return {
        isConservative: false,
        curlZ: 0,
        partialFx_dy: 0,
        partialFy_dx: 0,
        potentialExpr: '\\text{None } (U \\text{ does not exist for non-conservative force})',
        explanationBn:
          'ঘর্ষণ বল একটি অসংরক্ষণশীল বল। কৃতকাজ পথের দৈর্ঘ্যের ওপর নির্ভর করে এবং আবদ্ধ চক্রে কৃতকাজ সর্বদা ঋণাত্মক (তাপ শক্তিতে রূপান্তরিত হয়)।',
        explanationEn:
          'Friction is a non-conservative force. Work depends on total distance and closed-loop work equals total thermal dissipation (W < 0).',
        closedLoopWorkResult: -1 * Math.round(params.frictionMu * params.mass * params.gravity * 25 * 10) / 10,
        pathIndependenceStatus: 'dependent',
      };
    case 'viscous':
      return {
        isConservative: false,
        curlZ: 0,
        partialFx_dy: 0,
        partialFy_dx: 0,
        potentialExpr: '\\text{None } (U \\text{ undefined})',
        explanationBn:
          'সান্দ্র বল বেগের বিপরীতমুখী অসংরক্ষণশীল রোধক বল। শক্তি মেকানিক্যাল রূপ থেকে তাপে রূপান্তরিত হয়।',
        explanationEn:
          'Viscous drag is non-conservative and velocity-dependent. Dissipates kinetic energy continuously into heat.',
        closedLoopWorkResult: -1 * Math.round(params.viscousB * 35 * 10) / 10,
        pathIndependenceStatus: 'dependent',
      };
    case 'electrostatic':
    case 'coulomb':
      return {
        isConservative: true,
        curlZ: 0,
        partialFx_dy: 0,
        partialFy_dx: 0,
        potentialExpr: 'U(r) = \\frac{k_e q_1 q_2}{r}',
        explanationBn:
          'কুলম্বের স্থিরতড়িৎ বল (F_e = k_e q1 q2 / r²) একটি সংরক্ষণশীল বল। ইহার কার্ল শূন্য (∇ × F = 0) এবং যেকোনো আবদ্ধ চক্রে নিট কাজ শূন্য (W_loop = 0)।',
        explanationEn:
          'Coulomb Electrostatic Force is a conservative central inverse-square field. Zero curl (∇ × F = 0) and zero closed-loop work W_loop = 0.',
        closedLoopWorkResult: 0,
        pathIndependenceStatus: 'independent',
      };
    case 'buoyant':
      return {
        isConservative: true,
        curlZ: 0,
        partialFx_dy: 0,
        partialFy_dx: 0,
        potentialExpr: 'U(y) = -\\rho_{\\text{fluid}} V_{\\text{sub}} g y',
        explanationBn:
          'প্লবতা বল (F_b = ρ V g ĵ) একটি সমরূপ ঊর্ধ্বমুখী সংরক্ষণশীল বল। আবদ্ধ পথ অতিক্রম করলে নিট কাজ সর্বদা শূন্য (W_loop = 0) এবং স্থিতি শক্তি সঞ্চয় করে।',
        explanationEn:
          'Buoyant Force is a uniform upward conservative force field. Closed-loop work W_loop = 0 and stores hydrostatic potential energy.',
        closedLoopWorkResult: 0,
        pathIndependenceStatus: 'independent',
      };
    case 'quadratic_drag':
      return {
        isConservative: false,
        curlZ: 0,
        partialFx_dy: 0,
        partialFy_dx: 0,
        potentialExpr: '\\text{None } (U \\text{ undefined for } F \\propto v^2)',
        explanationBn:
          'দ্বিঘাত বায়ুর বাধা বল (F_d = -½ ρ C_d A v² v̂) একটি অসংরক্ষণশীল রোধক বল। কৃতকাজ পথের দৈর্ঘ্যের ওপর নির্ভর করে এবং ক্ষয়প্রাপ্ত তাপ শক্তিতে রূপান্তরিত হয়।',
        explanationEn:
          'Quadratic Air Drag (F ∝ v²) is non-conservative. Path dependent dissipation converting kinetic energy into thermal heat Q.',
        closedLoopWorkResult: -1 * Math.round((params.dragCd ?? 0.47) * (params.airDensity ?? 1.225) * (params.crossArea ?? 0.1) * 45 * 10) / 10,
        pathIndependenceStatus: 'dependent',
      };
    case 'induced_electric': {
      const q = params.inducedCharge ?? 1;
      const dbdt = params.dBdt ?? 2;
      return {
        isConservative: false,
        curlZ: Math.round(q * dbdt * 10) / 10,
        partialFx_dy: -0.5 * q * dbdt,
        partialFy_dx: 0.5 * q * dbdt,
        potentialExpr: '\\text{None } (\\oint \\vec{E} \\cdot d\\vec{\\ell} = -\\frac{d\\Phi_B}{dt} \\neq 0)',
        explanationBn:
          'আবেশিত তড়িৎ বল (F_ind = q E_ind) অসংরক্ষণশীল বল ক্ষেত্র। সময়-পরিবর্তনশীল চৌম্বক ক্ষেত্রের ফলে সৃষ্ট ঘূর্ণনশীল তড়িৎ বলরেখার জন্য কার্ল ∇ × E ≠ 0 এবং আবদ্ধ চক্রে কাজ অ-শূন্য (W_loop ≠ 0)।',
        explanationEn:
          'Induced Electric Field Force is non-conservative (∇ × E = -dB/dt ≠ 0). Circular field lines result in non-zero closed-loop work W_loop ≠ 0.',
        closedLoopWorkResult: Math.round(q * dbdt * 12.5 * 10) / 10,
        pathIndependenceStatus: 'dependent',
      };
    }
    case 'magnetic_lorentz':
      return {
        isConservative: false,
        curlZ: 0,
        partialFx_dy: 0,
        partialFy_dx: 0,
        potentialExpr: 'W = 0 \\text{ along ANY path } (\\vec{F}_m \\perp \\vec{v})',
        explanationBn:
          'চৌম্বক লোরেন্জ বল (F_m = q v × B) একটি কাজহীন বল (Workless Constraint Force)। বল সর্বদা বেগের লম্ব (F_m ⊥ v) হওয়ায় ক্ষমতা P = F·v = 0 এবং যেকোনো গতিপথে মোট কাজ সর্বদা শূন্য (W = 0)।',
        explanationEn:
          'Magnetic Lorentz Force is a workless constraint force. Always perpendicular to velocity (F ⊥ v), so Power P = F·v = 0 and Work W = 0 along ANY trajectory.',
        closedLoopWorkResult: 0,
        pathIndependenceStatus: 'independent',
      };
    case 'custom': {
      const customAnalysis = analyzeCustomForceField(params.customFx, params.customFy);
      return {
        isConservative: customAnalysis.isConservative,
        curlZ: customAnalysis.maxCurlZ,
        partialFx_dy: customAnalysis.partialFx_dy,
        partialFy_dx: customAnalysis.partialFy_dx,
        potentialExpr: customAnalysis.potentialExpr,
        explanationBn: customAnalysis.isConservative
          ? 'ব্যবহারকারীর কাস্টম বল ক্ষেত্রের কার্ল (∇ × F) শূন্য হওয়ায় এটি একটি সংরক্ষণশীল বল।'
          : 'ব্যবহারকারীর কাস্টম বল ক্ষেত্রের কার্ল (∇ × F) অ-শূন্য হওয়ায় এটি একটি অসংরক্ষণশীল বল।',
        explanationEn: customAnalysis.isConservative
          ? 'Custom vector field curl (∇ × F) equals 0, confirming it is a Conservative force field.'
          : 'Custom vector field curl (∇ × F) is non-zero, confirming it is a Non-Conservative force field.',
        closedLoopWorkResult: customAnalysis.isConservative ? 0 : -12.5,
        pathIndependenceStatus: customAnalysis.isConservative ? 'independent' : 'dependent',
      };
    }
  }
}

/**
 * Default preset scenarios
 */
export const PRESETS: PresetScenario[] = [
  {
    id: 'gravity_hills',
    nameEn: 'Earth Gravity & Hill Coaster',
    nameBn: 'পৃথিবীর মহাকর্ষ ও পাহাড়ি গতি',
    descriptionEn: 'Classic conservative gravity field - path independent work and full potential energy recovery.',
    descriptionBn: 'ধ্রুপদী মহাকর্ষীয় সংরক্ষণশীল বল ক্ষেত্র - কাজ পথের ওপর নির্ভর করে না।',
    forceCategory: 'gravity',
    pathType: 'arc',
    params: {
      mass: 2.5,
      gravity: 9.8,
      showVectors: true,
      showGrid: true,
    },
  },
  {
    id: 'spring_oscillator',
    nameEn: 'Elastic Spring Potential Well',
    nameBn: 'স্প্রিং এর প্রত্যয়নী বল ও স্থিতিশক্তি',
    descriptionEn: 'Restoring spring force F = -kr storing elastic potential energy.',
    descriptionBn: 'স্প্রিং বলের ক্ষেত্রে মেকানিক্যাল শক্তি এবং বিভব শক্তির রূপান্তর।',
    forceCategory: 'spring',
    pathType: 'straight',
    params: {
      mass: 1.5,
      springK: 35.0,
      showVectors: true,
    },
  },
  {
    id: 'rough_table_friction',
    nameEn: 'Rough Surface & Kinetic Friction',
    nameBn: 'খসখসে তলে ঘর্ষণ বল (অসংরক্ষণশীল)',
    descriptionEn: 'Non-conservative friction dissipation converting kinetic energy to heat.',
    descriptionBn: 'অসংরক্ষণশীল ঘর্ষণ বলের মাধ্যমে যান্ত্রিক শক্তি তাপে রূপান্তরিত হওয়া।',
    forceCategory: 'friction',
    pathType: 'scurve',
    params: {
      mass: 3.0,
      frictionMu: 0.35,
      gravity: 9.8,
    },
  },
  {
    id: 'closed_loop_proof',
    nameEn: 'Closed Loop Zero-Work Proof',
    nameBn: 'আবদ্ধ চক্রে শূন্য কাজের প্রমাণ (W_loop = 0)',
    descriptionEn: 'Test closed loop work for conservative vs non-conservative forces.',
    descriptionBn: 'আবদ্ধ চক্রে A → B → A পথে মহাকর্ষ বনাম ঘর্ষণের নিট কাজ পরীক্ষা।',
    forceCategory: 'gravity',
    pathType: 'closed_loop',
    params: {
      mass: 2.0,
      showVectors: true,
    },
  },
  {
    id: 'viscous_fluid_damping',
    nameEn: 'Viscous Fluid Damping',
    nameBn: 'তরলে সান্দ্রতা রোধক বল',
    descriptionEn: 'Velocity dependent damping force F = -bv in fluids.',
    descriptionBn: 'সান্দ্র বলের গতিশীল বাধা ও শক্তি অপচয়।',
    forceCategory: 'viscous',
    pathType: 'zigzag',
    params: {
      mass: 1.0,
      viscousB: 1.2,
    },
  },
  {
    id: 'coulomb_repulsion',
    nameEn: 'Coulomb Electrostatic Field',
    nameBn: 'কুলম্ব স্থিরতড়িৎ বল (সংরক্ষণশীল)',
    descriptionEn: 'Inverse-square radial electrostatic field with zero curl and zero closed-loop work.',
    descriptionBn: 'কেন্দ্রীয় স্থিরতড়িৎ বল ক্ষেত্র - ∇ × F = 0 এবং আবদ্ধ চক্রে কাজ শূন্য।',
    forceCategory: 'coulomb',
    pathType: 'arc',
    params: {
      coulombQ1: 5.0,
      coulombQ2: 1.0,
      coulombKe: 50.0,
      showVectors: true,
    },
  },
  {
    id: 'buoyant_water',
    nameEn: 'Hydrostatic Buoyant Force',
    nameBn: 'তরলের আর্কিমিডিস প্লবতা বল',
    descriptionEn: 'Uniform upward buoyant force storing hydrostatic potential energy.',
    descriptionBn: 'সমরূপ ঊর্ধ্বমুখী সংরক্ষণশীল প্লবতা বল ক্ষেত্র।',
    forceCategory: 'buoyant',
    pathType: 'straight',
    params: {
      fluidDensity: 1000,
      submergedVolume: 0.01,
      gravity: 9.8,
      showVectors: true,
    },
  },
  {
    id: 'quadratic_drag_air',
    nameEn: 'Quadratic Air Drag (v²)',
    nameBn: 'দ্বিঘাত বায়ুর বাধা বল (F ∝ v²)',
    descriptionEn: 'Velocity-squared resistive force causing non-conservative thermal energy loss.',
    descriptionBn: 'বেগের বর্গের সমানুপাতিক রোধক অসংরক্ষণশীল বল।',
    forceCategory: 'quadratic_drag',
    pathType: 'scurve',
    params: {
      dragCd: 0.47,
      airDensity: 1.225,
      crossArea: 0.1,
      showVectors: true,
    },
  },
  {
    id: 'faraday_induced',
    nameEn: 'Faraday Induced Electric Field',
    nameBn: 'ফ্যারাডের আবেশিত তড়িৎ বল (∇ × E ≠ 0)',
    descriptionEn: 'Non-conservative circular electric field lines driven by magnetic flux change dB/dt.',
    descriptionBn: 'ঘূর্ণায়মান আবেশিত তড়িৎ বল ক্ষেত্র - আবদ্ধ চক্রে অ-শূন্য কাজ (W_loop ≠ 0)।',
    forceCategory: 'induced_electric',
    pathType: 'closed_loop',
    params: {
      dBdt: 2.5,
      inducedCharge: 1.0,
      showVectors: true,
    },
  },
  {
    id: 'cyclotron_lorentz',
    nameEn: 'Magnetic Lorentz Force (W = 0)',
    nameBn: 'চৌম্বক লোরেন্জ বল (কাজহীন বল W = 0)',
    descriptionEn: 'Workless constraint force F = q(v × B) strictly perpendicular to velocity (F ⊥ v).',
    descriptionBn: 'কাজহীন বল - F ⊥ v হওয়ায় যেকোনো গতিপথে মোট কাজ সর্বদা শূন্য (W = 0)।',
    forceCategory: 'magnetic_lorentz',
    pathType: 'arc',
    params: {
      lorentzQ: 2.0,
      lorentzBz: 3.0,
      showVectors: true,
    },
  },
  {
    id: 'vortex_custom_force',
    nameEn: 'Vortex Vector Field (Curl ≠ 0)',
    nameBn: 'ঘূর্ণন ভেক্টর ক্ষেত্র (কার্ল ≠ ০)',
    descriptionEn: 'Non-conservative vortex field Fx = -y, Fy = x with active curl.',
    descriptionBn: 'অসংরক্ষণশীল ঘূর্ণায়মান বল ক্ষেত্র (Fx = -y, Fy = x)।',
    forceCategory: 'custom',
    pathType: 'closed_loop',
    params: {
      customFx: '-y',
      customFy: 'x',
    },
  },
];
