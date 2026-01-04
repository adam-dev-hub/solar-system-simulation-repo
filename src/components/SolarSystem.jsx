import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Stars, Environment, Loader, Preload } from '@react-three/drei'
import * as THREE from 'three'

const EARTH_DAY_MAP = 'https://unpkg.com/three-globe/example/img/earth-day.jpg'
const MOON_DIFFUSE = 'https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/moon-landing-sites/lunar_surface.jpg'

const ORBITAL_PERIODS = {
  EARTH_YEAR: 365.25,
  EARTH_DAY: 1,
  MOON_ORBIT: 27.3,
  SATELLITE_ORBIT: 0.5,
}

function OrbitPath({ radius, color, opacity = 0.3, segments = 128 }) {
  const geometry = useMemo(() => {
    const points = []
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius))
    }
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [radius, segments])

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color={color} opacity={opacity} transparent />
    </line>
  )
}

function Sun() {
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[3, 96, 96]} />
        <meshStandardMaterial
          color="#ffcc66"
          emissive="#ffb347"
          emissiveIntensity={2.5}
          roughness={0.2}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[3.4, 48, 48]} />
        <meshBasicMaterial color="#ff9900" transparent opacity={0.18} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh>
        <sphereGeometry args={[3.8, 48, 48]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0.1} blending={THREE.AdditiveBlending} />
      </mesh>
      <pointLight
        position={[0, 0, 0]}
        intensity={3.2}
        color="#ffffff"
        distance={400}
        decay={2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
    </group>
  )
}

function Satellite({ satelliteRef }) {
  const beaconRef = useRef()
  const beaconLightRef = useRef()

  useFrame(({ clock }) => {
    const pulse = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 4))
    if (beaconRef.current) beaconRef.current.material.opacity = pulse
    if (beaconLightRef.current) beaconLightRef.current.intensity = pulse * 1.5
  })

  return (
    <group ref={satelliteRef}>
      <mesh castShadow>
        <boxGeometry args={[0.12, 0.06, 0.12]} />
        <meshStandardMaterial color="#cfd3d8" metalness={0.85} roughness={0.35} />
      </mesh>
      <mesh position={[-0.22, 0, 0]}>
        <boxGeometry args={[0.22, 0.01, 0.12]} />
        <meshStandardMaterial color="#1a237e" metalness={0.9} roughness={0.18} />
      </mesh>
      <mesh position={[0.22, 0, 0]}>
        <boxGeometry args={[0.22, 0.01, 0.12]} />
        <meshStandardMaterial color="#1a237e" metalness={0.9} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.12, 10]} />
        <meshStandardMaterial color="#8c8c8c" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.05, 0.05]} ref={beaconRef}>
        <sphereGeometry args={[0.015, 10, 10]} />
        <meshBasicMaterial color="#ff3333" transparent opacity={0.8} />
      </mesh>
      <pointLight ref={beaconLightRef} position={[0, 0.05, 0.05]} color="#ff4444" distance={2} intensity={0.6} />
    </group>
  )
}

function Moon({ moonRef }) {
  const [moonMap] = useLoader(THREE.TextureLoader, [MOON_DIFFUSE])

  useEffect(() => {
    if (moonMap) moonMap.anisotropy = 8
  }, [moonMap])

  return (
    <mesh ref={moonRef} castShadow receiveShadow>
      <sphereGeometry args={[0.27, 48, 48]} />
      <meshStandardMaterial map={moonMap} roughness={1} metalness={0} />
    </mesh>
  )
}

function Earth() {
  const [colorMap] = useLoader(THREE.TextureLoader, [EARTH_DAY_MAP])

  useEffect(() => {
    if (colorMap) {
      colorMap.anisotropy = 16
      colorMap.minFilter = THREE.LinearMipmapLinearFilter
      colorMap.magFilter = THREE.LinearFilter
    }
  }, [colorMap])

  return (
    <mesh rotation={[0.41, 0, 0]} castShadow receiveShadow>
      <sphereGeometry args={[1, 96, 96]} />
      <meshStandardMaterial
        map={colorMap}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  )
}

function EarthSystem({ timeRef, setCameraTarget }) {
  const earthOrbitRef = useRef()
  const earthSpinRef = useRef()
  const moonRef = useRef()
  const satelliteRef = useRef()

  const earthOrbitRadius = 25
  const moonOrbitRadius = 2.5
  const satelliteOrbitRadius = 1.3
  const satelliteInclination = 0.5

  useFrame(() => {
    const time = timeRef.current

    const earthAngle = (time / ORBITAL_PERIODS.EARTH_YEAR) * Math.PI * 2
    earthOrbitRef.current.position.x = Math.cos(earthAngle) * earthOrbitRadius
    earthOrbitRef.current.position.z = Math.sin(earthAngle) * earthOrbitRadius

    earthSpinRef.current.rotation.y = (time / ORBITAL_PERIODS.EARTH_DAY) * Math.PI * 2

    const moonAngle = (time / ORBITAL_PERIODS.MOON_ORBIT) * Math.PI * 2
    moonRef.current.position.x = Math.cos(moonAngle) * moonOrbitRadius
    moonRef.current.position.z = Math.sin(moonAngle) * moonOrbitRadius

    const satAngle = (time / ORBITAL_PERIODS.SATELLITE_ORBIT) * Math.PI * 2
    const cosInc = Math.cos(satelliteInclination)
    const sinInc = Math.sin(satelliteInclination)
    
    satelliteRef.current.position.x = Math.cos(satAngle) * satelliteOrbitRadius
    satelliteRef.current.position.y = Math.sin(satAngle) * sinInc * satelliteOrbitRadius
    satelliteRef.current.position.z = Math.sin(satAngle) * cosInc * satelliteOrbitRadius
    satelliteRef.current.rotation.y = -satAngle + Math.PI / 2

    const earthWorldPos = new THREE.Vector3()
    earthOrbitRef.current.getWorldPosition(earthWorldPos)

    setCameraTarget(earthWorldPos)
  })

  return (
    <group>
      <OrbitPath radius={earthOrbitRadius} color="#4a90d9" opacity={0.18} />
      <group ref={earthOrbitRef}>
        <group ref={earthSpinRef}>
          <Earth />
        </group>
        <Moon moonRef={moonRef} />
        <OrbitPath radius={moonOrbitRadius} color="#888888" opacity={0.35} />
        <Satellite satelliteRef={satelliteRef} />
        <group rotation={[satelliteInclination, 0, 0]}>
          <OrbitPath radius={satelliteOrbitRadius} color="#ff6666" opacity={0.5} />
        </group>
      </group>
    </group>
  )
}

function Scene({ timeRef, isPaused, timeSpeed, cameraMode, setCameraTarget }) {
  const controlsRef = useRef()
  const [target, setTarget] = useState(null)

  useFrame((state, delta) => {
    if (!isPaused) {
      const speed = cameraMode === 'earth' ? 0.1 : timeSpeed
      timeRef.current += delta * speed
    }

    if (controlsRef.current) {
      if (cameraMode === 'earth' && target) {
        const currentTarget = controlsRef.current.target
        currentTarget.lerp(target, 0.05)
        
        const camera = state.camera
        const targetDistance = 15
        
        const direction = new THREE.Vector3()
        direction.subVectors(camera.position, currentTarget).normalize()
        const currentDistance = camera.position.distanceTo(currentTarget)
        const newDistance = THREE.MathUtils.lerp(currentDistance, targetDistance, 0.05)
        
        camera.position.copy(currentTarget).add(direction.multiplyScalar(newDistance))
        controlsRef.current.update()
      } else if (cameraMode === 'overview') {
        const currentTarget = controlsRef.current.target
        const overviewTarget = new THREE.Vector3(0, 0, 0)
        currentTarget.lerp(overviewTarget, 0.05)
        
        const camera = state.camera
        const targetDistance = 60
        
        const direction = new THREE.Vector3()
        direction.subVectors(camera.position, currentTarget).normalize()
        const currentDistance = camera.position.distanceTo(currentTarget)
        const newDistance = THREE.MathUtils.lerp(currentDistance, targetDistance, 0.05)
        
        camera.position.copy(currentTarget).add(direction.multiplyScalar(newDistance))
        controlsRef.current.update()
      }
    }
  })

  return (
    <>
      <ambientLight intensity={0.08} />
      <Environment preset="night" />
      <Stars radius={260} depth={80} count={3500} factor={3.5} fade speed={0.2} saturation={0} />
      <Sun />
      <EarthSystem timeRef={timeRef} setCameraTarget={setTarget} />
      <OrbitControls
        ref={controlsRef}
        autoRotate={false}
        target={[0, 0, 0]}
        minDistance={2}
        maxDistance={160}
        enableDamping
        dampingFactor={0.06}
        enableZoom={true}
        enablePan={true}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN
        }}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN
        }}
      />
    </>
  )
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  html, body {
    overscroll-behavior: none;
    touch-action: pan-x pan-y pinch-zoom;
  }

  canvas {
    touch-action: pan-x pan-y pinch-zoom;
  }

  :root {
    --glass-bg: rgba(15, 15, 20, 0.75);
    --glass-border: 1px solid rgba(255, 255, 255, 0.1);
    --accent: #ffd700;
    --text-muted: #a1a1aa;
    --text-light: #ffffff;
  }

  .ui-container {
    font-family: 'Inter', sans-serif;
    pointer-events: none;
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    padding: 20px;
    gap: 16px;
  }

  .ui-header {
    pointer-events: auto;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-shrink: 0;
  }

  .title-group h1 {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-light);
    letter-spacing: -0.02em;
    margin: 0;
    text-transform: uppercase;
  }
  
  .title-group p {
    font-size: 13px;
    color: var(--text-muted);
    margin: 4px 0 0 0;
  }

  .info-toggle {
    background: var(--glass-bg);
    border: var(--glass-border);
    color: var(--text-light);
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(12px);
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }
  .info-toggle:hover { background: rgba(255,255,255,0.1); }
  .info-toggle:active { transform: scale(0.95); }

  .info-section {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 320px;
    transition: all 0.3s ease;
  }

  .info-section.hidden {
    opacity: 0;
    pointer-events: none;
    transform: translateY(-10px);
  }

  .info-panel, .camera-modes {
    pointer-events: auto;
    background: var(--glass-bg);
    backdrop-filter: blur(12px);
    border: var(--glass-border);
    border-radius: 16px;
    padding: 16px;
  }

  .info-row {
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .info-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  
  .info-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
    color: var(--text-light);
  }
  
  .dot { width: 6px; height: 6px; border-radius: 50%; display: block; }
  .dot.earth { background: #4a90d9; box-shadow: 0 0 8px #4a90d9; }
  .dot.moon { background: #aaaaaa; }
  .dot.sat { background: #ff4444; box-shadow: 0 0 8px #ff4444; }

  .stat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .stat-item { font-size: 10px; color: var(--text-muted); line-height: 1.4; }

  .time-display {
    font-variant-numeric: tabular-nums;
    font-size: 12px;
    color: var(--accent);
    margin-top: 8px;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .camera-modes {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .mode-btn {
    background: transparent;
    color: var(--text-muted);
    border: 1px solid rgba(255,255,255,0.15);
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .mode-btn:hover { 
    color: var(--text-light); 
    border-color: var(--text-light); 
  }
  .mode-btn.active {
    background: var(--text-light);
    color: #000;
    border-color: var(--text-light);
  }

  .spacer { flex-grow: 1; }

  .controls-bar {
    pointer-events: auto;
    flex-shrink: 0;
    background: var(--glass-bg);
    backdrop-filter: blur(12px);
    border: var(--glass-border);
    border-radius: 20px;
    padding: 14px 18px;
    display: flex;
    align-items: center;
    gap: 18px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    align-self: center;
    max-width: 600px;
    width: 100%;
  }

  .btn-primary {
    background: var(--text-light);
    color: #000;
    border: none;
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.1s;
    white-space: nowrap;
  }
  .btn-primary:active { transform: scale(0.96); }

  .btn-secondary {
    background: transparent;
    color: var(--text-muted);
    border: 1px solid rgba(255,255,255,0.2);
    padding: 10px 16px;
    border-radius: 10px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .btn-secondary:hover { color: var(--text-light); border-color: var(--text-light); }

  .slider-group {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: 6px;
    transition: opacity 0.2s;
  }

  .slider-group.disabled {
    opacity: 0.4;
    pointer-events: none;
  }
  
  .slider-label {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: var(--text-muted);
    text-transform: uppercase;
    font-weight: 600;
  }

  input[type=range] {
    -webkit-appearance: none;
    width: 100%;
    background: transparent;
    cursor: pointer;
    height: 20px;
  }
  input[type=range]:focus { outline: none; }
  
  input[type=range]::-webkit-slider-runnable-track {
    width: 100%;
    height: 4px;
    background: rgba(255,255,255,0.15);
    border-radius: 2px;
  }
  
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: var(--text-light);
    margin-top: -6px;
    box-shadow: 0 0 10px rgba(255,255,255,0.5);
  }
  
  input[type=range]::-moz-range-thumb {
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: var(--text-light);
    border: none;
  }

  @media (max-width: 768px) {
    .ui-container { 
      padding: 12px; 
      gap: 10px; 
    }
    
    .title-group h1 { font-size: 18px; }
    .title-group p { font-size: 11px; }

    .info-section {
      max-width: 100%;
    }

    .controls-bar {
      position: fixed;
      bottom: 12px;
      left: 12px;
      right: 12px;
      margin: 0;
      padding: 12px 16px;
      gap: 12px;
      max-width: none;
      width: auto;
    }
    
    .slider-group { 
      width: 100%; 
      min-width: 0;
    }
    
    .btn-primary, .btn-secondary { 
      padding: 10px 14px;
      font-size: 11px;
      min-width: 70px;
    }
  }

  @media (max-width: 480px) {
    .controls-bar {
      flex-wrap: wrap;
      padding: 10px 12px;
      gap: 10px;
    }
    
    .slider-group { 
      order: 1;
      width: 100%;
    }
    
    .btn-primary, .btn-secondary { 
      order: 2;
      flex: 1;
      min-width: 0;
    }
  }
`

function UIOverlay({ timeRef, isPaused, setIsPaused, timeSpeed, setTimeSpeed, cameraMode, setCameraMode }) {
  const dayRef = useRef()
  const yearRef = useRef()
  const [showInfo, setShowInfo] = useState(true)

  useEffect(() => {
    if (window.innerWidth < 768) setShowInfo(false)
  }, [])

  useEffect(() => {
    let requestId
    const loop = () => {
      if (dayRef.current && yearRef.current) {
        dayRef.current.innerText = `DAY ${Math.floor(timeRef.current)}`
        yearRef.current.innerText = `YEAR ${Math.floor(timeRef.current / 365) + 1}`
      }
      requestId = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(requestId)
  }, [timeRef])

  const currentSpeed = cameraMode === 'earth' ? 0.1 : timeSpeed

  return (
    <>
      <style>{styles}</style>
      <div className="ui-container">
        
        <div className="ui-header">
          <div className="title-group">
            <h1>Orbital System</h1>
            <p>{cameraMode === 'earth' ? 'Earth Focus - 0.1 Days/s' : 'Overview Mode'}</p>
          </div>
          
          <button 
            className="info-toggle" 
            onClick={() => setShowInfo(!showInfo)}
          >
            {showInfo ? (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
        </div>

        <div className={`info-section ${showInfo ? '' : 'hidden'}`}>
          <div className="info-panel">
            <div className="info-row">
              <div className="info-label">
                <span className="dot earth"></span> Earth
              </div>
              <div className="stat-grid">
                <span className="stat-item">Orbit: 365.25 d</span>
                <span className="stat-item">Tilt: 23.5°</span>
              </div>
            </div>

            <div className="info-row">
              <div className="info-label">
                <span className="dot moon"></span> Moon
              </div>
              <div className="stat-grid">
                <span className="stat-item">Orbit: 27.3 d</span>
                <span className="stat-item">Dist: 384k km</span>
              </div>
            </div>

            <div className="info-row">
              <div className="info-label">
                <span className="dot sat"></span> ISS Satellite
              </div>
              <div className="stat-grid">
                <span className="stat-item">Orbit: ~12 hours</span>
                <span className="stat-item">Inc: 51.6°</span>
              </div>
            </div>

            <div className="time-display">
              <span ref={dayRef}>DAY 0</span> <span style={{opacity:0.3, margin:'0 4px'}}>|</span> <span ref={yearRef}>YEAR 1</span>
            </div>
          </div>

          <div className="camera-modes">
            <button 
              className={`mode-btn ${cameraMode === 'overview' ? 'active' : ''}`}
              onClick={() => setCameraMode('overview')}
            >
              Overview
            </button>
            <button 
              className={`mode-btn ${cameraMode === 'earth' ? 'active' : ''}`}
              onClick={() => setCameraMode('earth')}
            >
              Earth Focus
            </button>
          </div>
        </div>

        <div className="spacer"></div>

        <div className="controls-bar">
          <div className={`slider-group ${cameraMode === 'earth' ? 'disabled' : ''}`}>
            <div className="slider-label">
              <span>Time Speed</span>
              <span>{currentSpeed.toFixed(1)} Days/s</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={timeSpeed}
              onChange={(e) => setTimeSpeed(parseFloat(e.target.value))}
              disabled={cameraMode === 'earth'}
            />
          </div>

          <button 
            className="btn-primary" 
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? 'RESUME' : 'PAUSE'}
          </button>
          
          <button 
            className="btn-secondary"
            onClick={() => { timeRef.current = 0 }}
          >
            RESET
          </button>
        </div>
      </div>
    </>
  )
}

export default function SolarSystem() {
  const timeRef = useRef(0)
  const [isPaused, setIsPaused] = useState(false)
  const [timeSpeed, setTimeSpeed] = useState(1)
  const [cameraMode, setCameraMode] = useState('overview')
  const [cameraTarget, setCameraTarget] = useState(null)

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050505', position: 'relative', touchAction: 'pan-x pan-y pinch-zoom', overflow: 'hidden' }}>
      <Canvas
        shadows
        camera={{ position: [0, 40, 60], fov: 45 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
      >
        <Suspense fallback={null}>
          <Scene 
            timeRef={timeRef} 
            isPaused={isPaused}
            timeSpeed={timeSpeed}
            cameraMode={cameraMode}
            setCameraTarget={setCameraTarget}
          />
          <Preload all />
        </Suspense>
      </Canvas>
      <Loader 
        containerStyles={{ background: '#050505' }}
        innerStyles={{ background: '#333', width: 200 }}
        barStyles={{ background: '#fff', height: 2 }}
        dataStyles={{ color: '#fff', fontSize: '12px', fontFamily: 'Inter, sans-serif' }}
      />
      
      <UIOverlay 
        timeRef={timeRef} 
        isPaused={isPaused} 
        setIsPaused={setIsPaused}
        timeSpeed={timeSpeed}
        setTimeSpeed={setTimeSpeed}
        cameraMode={cameraMode}
        setCameraMode={setCameraMode}
      />
    </div>
  )
}