# Solar System Simulation

A browser-based 3D orbital scene built with Next.js, React Three Fiber, and Three.js.

This project renders a stylized Sun, Earth, Moon, and satellite system with animated orbital motion, interactive camera controls, and a compact glass-style control overlay. Despite the project name, the current scope is focused on the Earth system rather than a full multi-planet solar system.

## Overview

The app is a client-rendered Next.js experience that uses a WebGL canvas to visualize:

- The Sun as the central light source
- Earth orbiting the Sun
- The Moon orbiting Earth
- A small satellite orbiting Earth on an inclined path
- Orbit paths, star field background, and environment lighting

The interface also includes:

- A live day and year counter
- Pause and reset controls
- A time-speed slider
- Two camera modes: `Overview` and `Earth Focus`
- An expandable info panel with quick orbital facts

## Features

- Real-time animated orbital motion driven by shared simulation time
- Earth rotation, Moon orbit, and inclined satellite orbit
- Interactive orbit camera with rotate, zoom, and pan
- Distinct visual orbit trails for Earth, Moon, and satellite
- Responsive overlay UI for desktop and mobile layouts
- Loading feedback via Drei's `Loader`
- Client-only rendering to avoid SSR issues with WebGL

## Tech Stack

- Next.js 16
- React 19
- Three.js
- `@react-three/fiber`
- `@react-three/drei`
- ESLint with `eslint-config-next`

## Project Structure

```text
src/
  app/
    layout.js         App metadata and root layout
    page.js           Client-only entry that loads the 3D scene
    globals.css       Global resets
  components/
    SolarSystem.jsx   Scene, simulation logic, controls, and overlay UI
```

## Getting Started

### Prerequisites

- A recent Node.js LTS release
- npm

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

- `npm run dev`: starts the local development server
- `npm run build`: creates a production build
- `npm run start`: serves the production build
- `npm run lint`: runs ESLint

## How To Use

### Camera controls

- Left mouse drag: rotate
- Mouse wheel or trackpad zoom: dolly in/out
- Right mouse drag: pan
- Touch: rotate and pinch/pan through `OrbitControls`

### Simulation controls

- `Overview`: keeps the camera centered on the scene and allows manual time speed adjustment
- `Earth Focus`: eases the camera target toward Earth and fixes playback to `0.1` days per second
- `Pause`: stops time progression
- `Reset`: sets simulation time back to day `0`
- `Time Speed`: adjusts playback from `0.1` to `2.0` days per second in overview mode

## Implementation Notes

- The home page dynamically imports the main scene with `ssr: false` because the canvas depends on browser APIs.
- Simulation time is stored in a shared ref and advanced inside `useFrame`.
- The Earth system groups local motion so the Moon and satellite move with Earth as Earth orbits the Sun.
- Orbit trails are generated procedurally with `THREE.BufferGeometry`.
- The overlay UI is defined inside `SolarSystem.jsx` with an inline style block rather than CSS modules.

## External Asset Dependencies

The current implementation fetches some assets from remote URLs at runtime:

- Earth day texture
- Moon surface texture
- Google-hosted Inter font

That means the scene may not render fully offline unless those assets are moved into the local project and referenced from `public/`.

## Current Scope And Limitations

- This is a stylized visualization, not a physically accurate or scale-accurate simulator.
- Only the Sun, Earth, Moon, and one satellite are modeled right now.
- The README name says "solar system", but the actual experience is currently an Earth-centered orbital demo.
- There are no automated tests yet.


