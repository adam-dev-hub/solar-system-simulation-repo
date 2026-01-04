'use client'

import { useRef, useMemo, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Stars, Environment, Loader, Preload } from '@react-three/drei'
import * as THREE from 'three'

// Texture URLs
const EARTH_DAY_MAP = 'https://unpkg.com/three-globe/example/img/earth-day.jpg'
const EARTH_NORMAL = 'https://unpkg.com/three-globe/example/img/earth-topology.png'
const EARTH_NIGHT = 'https://unpkg.com/three-globe/example/img/earth-night.jpg'
const EARTH_CLOUDS = 'https://unpkg.com/three-globe/example/img/earth-water.png'
const MOON_DIFFUSE = 'https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/moon-landing-sites/lunar_surface.jpg'

// Physical constants (scaled for visualization)
const ORBITAL_PERIODS = {
  EARTH_YEAR: 365.25,
  EARTH_DAY: 1,
  MOON_ORBIT: 27.3,
  SATELLITE_ORBIT: 0.0625,
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
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[3, 96, 96]} />
        <meshStandardMaterial
          color="#ffcc66"
          emissive="#ffb347"
          emissiveIntensity={2.5}
          roughness={0.2}
          metalness={0.0}
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
      <mesh castShadow receiveShadow>
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
    if (moonMap) {
      // eslint-disable-next-line
      moonMap.anisotropy = 8
    }
  }, [moonMap])

  return (
    <mesh ref={moonRef} castShadow receiveShadow>
      <sphereGeometry args={[0.27, 48, 48]} />
      <meshStandardMaterial map={moonMap} roughness={1} metalness={0} />
    </mesh>
  )
}

function Earth({ cloudSpeed = 0.02 }) {
  const [colorMap, normalMap, nightMap, cloudsMap] = useLoader(THREE.TextureLoader, [
    EARTH_DAY_MAP,
    EARTH_NORMAL,
    EARTH_NIGHT,
    EARTH_CLOUDS,
  ])

  useEffect(() => {
    // We modify the textures directly as they are mutable Three.js objects
    // eslint-disable-next-line
    if (colorMap) colorMap.anisotropy = 8
    // eslint-disable-next-line
    if (normalMap) normalMap.anisotropy = 8
    // eslint-disable-next-line
    if (nightMap) nightMap.anisotropy = 8
    // eslint-disable-next-line
    if (cloudsMap) cloudsMap.anisotropy = 8
  }, [colorMap, normalMap, nightMap, cloudsMap])

  const cloudRef = useRef()

  useFrame((_, delta) => {
    if (cloudRef.current) cloudRef.current.rotation.y += delta * cloudSpeed
  })

  return (
    <group>
      <mesh rotation={[0.41, 0, 0]} castShadow receiveShadow>
        <sphereGeometry args={[1, 96, 96]} />
        <meshStandardMaterial
          map={colorMap}
          normalMap={normalMap}
          emissiveMap={nightMap}
          emissiveIntensity={0.9}
          emissive="#222222"
          roughness={0.65}
          metalness={0.05}
        />
      </mesh>

      <mesh ref={cloudRef} rotation={[0.41, 0, 0]}>
        <sphereGeometry args={[1.01, 64, 64]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh rotation={[0.41, 0, 0]}>
        <sphereGeometry args={[1.05, 48, 48]} />
        <meshBasicMaterial color="#87CEEB" transparent opacity={0.08} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  )
}

function EarthSystem({ timeRef }) {
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
    satelliteRef.current.position.x = Math.cos(satAngle) * satelliteOrbitRadius
    satelliteRef.current.position.z =
      Math.sin(satAngle) * Math.cos(satelliteInclination) * satelliteOrbitRadius
    satelliteRef.current.position.y =
      Math.sin(satAngle) * Math.sin(satelliteInclination) * satelliteOrbitRadius
    satelliteRef.current.rotation.y = -satAngle + Math.PI / 2
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

function Scene({ timeRef, isPaused, timeSpeed }) {
  useFrame((_, delta) => {
    if (!isPaused) {
      timeRef.current += delta * timeSpeed
    }
  })

  return (
    <>
      <ambientLight intensity={0.08} />
      <Environment preset="night" />
      <Stars radius={260} depth={80} count={3500} factor={3.5} fade speed={0.2} saturation={0} />

      <Sun />
      <EarthSystem timeRef={timeRef} />

      <OrbitControls
        autoRotate={false}
        target={[0, 0, 0]}
        minDistance={5}
        maxDistance={160}
        enableDamping
        dampingFactor={0.06}
      />
    </>
  )
}

function InfoPanel({ timeRef }) {
  const dayRef = useRef()
  const yearRef = useRef()

  useEffect(() => {
    let requestId
    const loop = () => {
      if (dayRef.current && yearRef.current) {
        dayRef.current.innerText = `Day ${Math.floor(timeRef.current)}`
        yearRef.current.innerText = `Year ${Math.floor(timeRef.current / 365) + 1}`
      }
      requestId = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(requestId)
  }, [timeRef])

  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        right: 20,
        background: 'rgba(0,0,0,0.8)',
        padding: '20px',
        borderRadius: '12px',
        color: 'white',
        fontSize: '13px',
        minWidth: '200px',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#ffd700' }}>Orbital Mechanics</h3>

      <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #333' }}>
        <div style={{ color: '#4a90d9', marginBottom: '5px', fontWeight: 'bold' }}>🌍 Earth</div>
        <div style={{ color: '#aaa', fontSize: '11px', lineHeight: '1.6' }}>
          <div>• Orbits Sun: 365.25 days</div>
          <div>• Rotates: 24 hours</div>
          <div>• Axial tilt: 23.5°</div>
        </div>
      </div>

      <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #333' }}>
        <div style={{ color: '#888888', marginBottom: '5px', fontWeight: 'bold' }}>🌙 Moon</div>
        <div style={{ color: '#aaa', fontSize: '11px', lineHeight: '1.6' }}>
          <div>• Orbits Earth: 27.3 days</div>
          <div>• Distance: 384,400 km</div>
        </div>
      </div>

      <div>
        <div style={{ color: '#ff6666', marginBottom: '5px', fontWeight: 'bold' }}>🛰️ Satellite (ISS)</div>
        <div style={{ color: '#aaa', fontSize: '11px', lineHeight: '1.6' }}>
          <div>• Orbits Earth: ~90 min</div>
          <div>• Altitude: ~400 km</div>
          <div>• Inclination: 51.6°</div>
        </div>
      </div>

      <div style={{ marginTop: '16px', fontSize: '12px', color: '#ffd700' }}>
        <span ref={dayRef}>Day 0</span> | <span ref={yearRef}>Year 1</span>
      </div>
    </div>
  )
}

function Controls({ isPaused, setIsPaused, timeSpeed, setTimeSpeed, timeRef }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        background: 'rgba(0,0,0,0.8)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          onClick={() => setIsPaused(!isPaused)}
          style={{
            background: isPaused ? '#22c55e' : '#ef4444',
            border: 'none',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            minWidth: '100px',
          }}
        >
          {isPaused ? '▶ Play' : '⏸ Pause'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 15px' }}>
          <span style={{ color: '#888', fontSize: '12px' }}>Speed:</span>
          <input
            type="range"
            min="0.1"
            max="50"
            step="0.1"
            value={timeSpeed}
            onChange={(e) => setTimeSpeed(parseFloat(e.target.value))}
            style={{ width: '120px', cursor: 'pointer' }}
          />
          <span style={{ color: 'white', fontSize: '13px', minWidth: '80px' }}>{timeSpeed.toFixed(1)} days/s</span>
        </div>

        <button
          onClick={() => {
            timeRef.current = 0
          }}
          style={{
            background: '#6b7280',
            border: 'none',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ↺ Reset
        </button>
      </div>
    </div>
  )
}

export default function SolarSystem() {
  const timeRef = useRef(0)
  const [isPaused, setIsPaused] = useState(false)
  const [timeSpeed, setTimeSpeed] = useState(5)

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [0, 40, 60], fov: 50 }}
        dpr={[1, 2]}
        gl={{
          physicallyCorrectLights: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
      >
        <Suspense fallback={null}>
          <Scene timeRef={timeRef} isPaused={isPaused} timeSpeed={timeSpeed} />
          <Preload all />
        </Suspense>
      </Canvas>
      <Loader />

      <div style={{ position: 'absolute', top: 20, left: 20, color: 'white' }}>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            margin: 0,
            color: '#ffd700',
            textShadow: '0 0 20px rgba(255,215,0,0.3)',
          }}
        >
          🌌 Earth Orbital System
        </h1>
        <p style={{ fontSize: '14px', color: '#9ca3af', margin: '10px 0 0 0' }}>Satellite → Earth → Moon → Sun</p>
        <p style={{ fontSize: '12px', color: '#6b7280', margin: '5px 0 0 0' }}>Drag to rotate • Scroll to zoom</p>
      </div>

      <InfoPanel timeRef={timeRef} />
      <Controls
        isPaused={isPaused}
        setIsPaused={setIsPaused}
        timeSpeed={timeSpeed}
        setTimeSpeed={setTimeSpeed}
        timeRef={timeRef}
      />
    </div>
  )
}