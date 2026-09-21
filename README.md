# Conservative vs. Non-Conservative Forces & Vector Field Analysis Lab

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg?logo=vite)](https://vitejs.dev/)
[![Author: Shamsuddin Piash](https://img.shields.io/badge/Author-Shamsuddin%20Piash-0ea5e9.svg)](https://piashoverflow.github.io)
[![BUET ME](https://img.shields.io/badge/Institution-BUET%20'25-10b981.svg)](https://buet.ac.bd)

> **Interactive Computational Physics Simulator & Educational Workbench**  
> Developed by **Shamsuddin Piash** | Department of Mechanical Engineering, Bangladesh University of Engineering and Technology (BUET).

---

## 🔬 Overview & Conceptual Motivation

Mathematical proof solver and interactive simulation verifying force field curl conditions, path independence, and non-conservative dissipation integrals.

Designed from **first-principles physics and numerical mechanics**, this simulation bridges textbook analytical theory and real-time computation. It enables students, researchers, and competitive engineering candidates to visualize dynamic force interactions, observe parametric trends, and verify conservation laws interactively.

---

## 📐 Mathematical Formulation & Physics Derivations

### Governing Mathematical Theorems

A force field $\vec{F}(\vec{r})$ is **conservative** if and only if it satisfies any of the equivalent conditions:

1. **Zero Curl Condition**:
   $$\nabla \times \vec{F} = \vec{0} \iff \frac{\partial F_z}{\partial y} = \frac{\partial F_y}{\partial z}, \quad \frac{\partial F_x}{\partial z} = \frac{\partial F_z}{\partial x}, \quad \frac{\partial F_y}{\partial x} = \frac{\partial F_x}{\partial y}$$

2. **Existence of Scalar Potential $U$**:
   $$\vec{F} = -\nabla U$$

3. **Path Independence of Work**:
   $$\int_{C_1} \vec{F} \cdot d\vec{r} = \int_{C_2} \vec{F} \cdot d\vec{r} \implies \oint_{C} \vec{F} \cdot d\vec{r} = 0$$

For non-conservative fields (e.g., kinetic friction $\vec{f}_k = -\mu_k N \hat{v}$), the line integral depends explicitly on total arc path length $s$:

$$W_{nc} = \oint_C \vec{f}_k \cdot d\vec{r} = -\int_0^s \mu_k N\,ds = -\mu_k N s < 0$$

---

## ✨ Key Features & Interactive Workbench

- **Interactive Vector Field Visualizer**: Renders 2D vector field arrows and gradient contours.
- **Automated Curl & Div Theorem Prover**: Real-time analytical matrix evaluation of $
abla 	imes ec{F}$.
- **Arbitrary Path Comparison**: Draw two distinct paths between points $A$ and $B$ to compare work integrals.
- **Energy Dissipation Tracker**: Computes thermal energy generated along non-conservative trajectories.

---

## 🔒 Confidentiality, Security & Academic Integrity

This repository adheres strictly to professional security standards, privacy guidelines, and academic integrity policies:

- **Proprietary & Institutional Protection**: Underlying academic curricula, institutional questions, and confidential research data are sanitized and protected under institutional agreements.
- **Environment & Secrets Hygiene**: No private keys, passwords, or personal credentials are hardcoded. API tokens (e.g., Gemini AI or cloud compute) must be supplied via local `.env` files or secure CI/CD secrets.
- **Vulnerability Reporting**: Please refer to [SECURITY.md](SECURITY.md) for instructions on confidential disclosure.

---

## 🛠️ Project Structure & Architecture

```
.
├── src/
│   ├── components/       # UI panels, canvas renderer, sliders & controls
│   ├── utils/            # Physics solvers, RK4 ODE integration, vector math
│   ├── types.ts          # Strongly typed simulation interfaces
│   ├── App.tsx           # Primary application workbench
│   └── main.tsx          # Application root
├── public/               # Static assets & icons
├── metadata.json         # Simulator metadata & capabilities
├── package.json          # Dependencies & build scripts
├── tsconfig.json         # TypeScript compiler configuration
├── vite.config.ts        # Vite bundle & dev server configuration
├── SECURITY.md           # Confidentiality & vulnerability disclosure policy
└── LICENSE               # MIT License
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm** or **bun** / **pnpm**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/piashoverflow/Conservative-and-non-conservative-Force.git
cd Conservative-and-non-conservative-Force

# 2. Install dependencies
npm install

# 3. Configure environment variables (if applicable)
cp .env.example .env

# 4. Launch the local development server
npm run dev
```

Visit `http://localhost:3000` in your browser to interact with the simulation.

### Production Build

```bash
npm run build
npm run preview
```

---

## 👤 Author & Academic Affiliation

**Shamsuddin Piash**  
*B.Sc. in Mechanical Engineering (Graduated March 2025)*  
**Bangladesh University of Engineering and Technology (BUET)**  
Dhaka, Bangladesh

- **Portfolio Website**: [piashoverflow.github.io](https://piashoverflow.github.io)
- **GitHub**: [@piashoverflow](https://github.com/piashoverflow)
- **LinkedIn**: [linkedin.com/in/shamsuddin-piash](https://linkedin.com/in/shamsuddin-piash)
- **Email**: [mohammadshamsuddinpiash0722@gmail.com](mailto:mohammadshamsuddinpiash0722@gmail.com)

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for complete details.
