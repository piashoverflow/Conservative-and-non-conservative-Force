/**
 * Safe Math Expression Parser and Numerical Calculus Engine
 */

export interface MathVariables {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  v?: number;
  m?: number;
  t?: number;
}

/**
 * Safely evaluates a 2D mathematical expression string.
 * Supports: x, y, vx, vy, v, m, t, sin, cos, tan, exp, sqrt, abs, ln, log, pi, e, +, -, *, /, ^, parentheses
 */
export function evaluateMathExpr(expr: string, vars: MathVariables): number {
  if (!expr || expr.trim() === '') return 0;

  try {
    // Sanitize string
    let cleaned = expr.toLowerCase().replace(/\s+/g, '');

    // Handle b * vx or b*vx or -b*vx where b might be substituted or constant
    // Replace implicit multiplication like 2vx -> 2*vx, -0.5vx -> -0.5*vx, 2x -> 2*x, 3m -> 3*m
    cleaned = cleaned.replace(/(\d)([a-z\(])/g, '$1*$2');
    cleaned = cleaned.replace(/(\))([0-9a-z\(])/g, '$1*$2');

    // Values as safe parenthesis wrapped strings
    const vxVal = `(${vars.vx ?? 0})`;
    const vyVal = `(${vars.vy ?? 0})`;
    const vVal = `(${vars.v ?? Math.hypot(vars.vx ?? 0, vars.vy ?? 0)})`;
    const mVal = `(${vars.m ?? 1.0})`;
    const xVal = `(${vars.x})`;
    const yVal = `(${vars.y})`;
    const tVal = `(${vars.t ?? 0})`;

    // Replace functions with Math equivalents first
    cleaned = cleaned
      .replace(/\bpi\b/g, `${Math.PI}`)
      .replace(/\be\b/g, `${Math.E}`)
      .replace(/\bsin\b/g, 'Math.sin')
      .replace(/\bcos\b/g, 'Math.cos')
      .replace(/\btan\b/g, 'Math.tan')
      .replace(/\bsqrt\b/g, 'Math.sqrt')
      .replace(/\babs\b/g, 'Math.abs')
      .replace(/\bexp\b/g, 'Math.exp')
      .replace(/\bln\b/g, 'Math.log')
      .replace(/\blog\b/g, 'Math.log10')
      .replace(/\bpow\b/g, 'Math.pow');

    // Replace ^ exponentiation operator with Math.pow(a, b) handling
    cleaned = cleaned.replace(/([0-9a-z_\.\)\(]+)\^([0-9a-z_\.\)\(]+)/g, 'Math.pow($1,$2)');

    // Replace multi-character variables FIRST to avoid accidental collision with single-char 'v' or 'x'
    cleaned = cleaned.replace(/\bvx\b/g, vxVal);
    cleaned = cleaned.replace(/\bvy\b/g, vyVal);

    // Replace single-character variables
    cleaned = cleaned.replace(/\bx\b/g, xVal);
    cleaned = cleaned.replace(/\by\b/g, yVal);
    cleaned = cleaned.replace(/\bv\b/g, vVal);
    cleaned = cleaned.replace(/\bm\b/g, mVal);
    cleaned = cleaned.replace(/\bt\b/g, tVal);

    // Validate safe characters only
    if (/[^0-9\+\-\*\/\%\.\(\)\,\sMath\.sincostanqreplaog10we]/.test(cleaned)) {
      return 0;
    }

    // Function evaluator
    const result = new Function(`return (${cleaned});`)();
    return typeof result === 'number' && !isNaN(result) && isFinite(result) ? result : 0;
  } catch {
    return 0;
  }
}

/**
 * Calculates numerical partial derivative dF/dx at (x,y)
 */
export function partialDerivativeX(
  fn: (x: number, y: number) => number,
  x: number,
  y: number,
  eps: number = 0.001
): number {
  return (fn(x + eps, y) - fn(x - eps, y)) / (2 * eps);
}

/**
 * Calculates numerical partial derivative dF/dy at (x,y)
 */
export function partialDerivativeY(
  fn: (x: number, y: number) => number,
  x: number,
  y: number,
  eps: number = 0.001
): number {
  return (fn(x, y + eps) - fn(x, y - eps)) / (2 * eps);
}

/**
 * Checks vector field conservativity by computing curl k-component:
 * Curl(F)_z = (dFy/dx - dFx/dy)
 */
export function analyzeCustomForceField(
  fxExpr: string,
  fyExpr: string
): {
  isConservative: boolean;
  maxCurlZ: number;
  partialFx_dy: number;
  partialFy_dx: number;
  potentialExpr: string;
} {
  // If expression explicitly depends on velocity (vx, vy, v), it is non-conservative (dissipative)
  const isVelocityDependent = /\b(vx|vy|v)\b/i.test(fxExpr) || /\b(vx|vy|v)\b/i.test(fyExpr);

  const fxFn = (x: number, y: number) => evaluateMathExpr(fxExpr, { x, y });
  const fyFn = (x: number, y: number) => evaluateMathExpr(fyExpr, { x, y });

  // Grid sampling points across domain [-5, 5]
  const samplePoints: { x: number; y: number }[] = [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: -1, y: 2 },
    { x: 2, y: -2 },
    { x: -3, y: -1 },
    { x: 1.5, y: -0.5 },
  ];

  let maxCurlZ = 0;
  let lastPartialFx_dy = 0;
  let lastPartialFy_dx = 0;

  for (const pt of samplePoints) {
    const dFx_dy = partialDerivativeY(fxFn, pt.x, pt.y);
    const dFy_dx = partialDerivativeX(fyFn, pt.x, pt.y);
    const curlZ = Math.abs(dFy_dx - dFx_dy);

    if (curlZ > maxCurlZ) {
      maxCurlZ = curlZ;
    }
    lastPartialFx_dy = dFx_dy;
    lastPartialFy_dx = dFy_dx;
  }

  // Conservativity check threshold: must NOT be velocity dependent AND spatial curl must be zero
  const isConservative = !isVelocityDependent && maxCurlZ < 0.005;

  // Derive potential expression description
  let potentialExpr = '';
  if (isConservative) {
    potentialExpr = 'U(x, y) = - \\int F_x dx - \\int F_y dy';
  } else {
    potentialExpr = '\\text{Undefined (Non-Conservative Force Field)}';
  }

  return {
    isConservative,
    maxCurlZ: isVelocityDependent ? 1.0 : Math.round(maxCurlZ * 10000) / 10000,
    partialFx_dy: Math.round(lastPartialFx_dy * 1000) / 1000,
    partialFy_dx: Math.round(lastPartialFy_dx * 1000) / 1000,
    potentialExpr,
  };
}
