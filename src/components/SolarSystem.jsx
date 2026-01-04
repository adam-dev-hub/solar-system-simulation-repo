'use client'

import { useRef, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'

// ===========================================
// PHYSICAL CONSTANTS (Scaled for visualization)
// ===========================================
const EARTH_YEAR = 365.25        // days
const EARTH_DAY = 1              // day
const MOON_ORBIT = 27.3          // days around Earth
const SATELLITE_ORBIT = 0.0625   // days (~90 minutes)

// ===========================================
// ORBIT PATH COMPONENT
// ===========================================
function OrbitPath(props) {
  var radius = props.radius
  var color = props.color
  var opacity = props.opacity || 0.3
  var segments = props.segments || 128

  var geometry = useMemo(function () {
    var points = []
    for (var i = 0; i <= segments; i++) {
      var angle = (i / segments) * Math.PI * 2
      points.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      ))
    }
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [radius, segments])

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color={color} opacity={opacity} transparent={true} />
    </line>
  )
}

// ===========================================
// SUN COMPONENT
// ===========================================
function Sun() {
  return (
    <group>
      {/* Sun sphere */}
      <mesh>
        <sphereGeometry args={[3, 64, 64]} />
        <meshBasicMaterial color="#ffd700" />
      </mesh>
      
      {/* Sun glow effect */}
      <mesh>
        <sphereGeometry args={[3.5, 32, 32]} />
        <meshBasicMaterial color="#ffaa00" transparent={true} opacity={0.2} />
      </mesh>
      <mesh>
        <sphereGeometry args={[4, 32, 32]} />
        <meshBasicMaterial color="#ff8800" transparent={true} opacity={0.1} />
      </mesh>
      
      {/* Sun light */}
      <pointLight position={[0, 0, 0]} intensity={2} color="#ffffff" distance={200} />
    </group>
  )
}

// ===========================================
// SATELLITE COMPONENT (with solar panels)
// ===========================================
function Satellite(props) {
  var satelliteRef = props.satelliteRef
  
  return (
    <group ref={satelliteRef}>
      {/* Satellite body */}
      <mesh>
        <boxGeometry args={[0.12, 0.06, 0.12]} />
        <meshStandardMaterial color="#cccccc" metalness={0.8} roughness={0.3} />
      </mesh>
      
      {/* Solar panel left */}
      <mesh position={[-0.2, 0, 0]}>
        <boxGeometry args={[0.2, 0.01, 0.1]} />
        <meshStandardMaterial color="#1a237e" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Solar panel right */}
      <mesh position={[0.2, 0, 0]}>
        <boxGeometry args={[0.2, 0.01, 0.1]} />
        <meshStandardMaterial color="#1a237e" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Antenna */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.1, 8]} />
        <meshStandardMaterial color="#888888" metalness={0.5} />
      </mesh>
      
      {/* Blinking light */}
      <mesh position={[0, 0.05, 0.05]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={0.1} color="#ff0000" distance={2} />
    </group>
  )
}

// ===========================================
// MOON COMPONENT
// ===========================================
function Moon(props) {
  var moonRef = props. moonRef
  
  return (
    <mesh ref={moonRef}>
      <sphereGeometry args={[0.27, 32, 32]} />
      <meshStandardMaterial 
        color="#aaaaaa" 
        roughness={1} 
        metalness={0}
      />
    </mesh>
  )
}

// ===========================================
// EARTH COMPONENT
// ===========================================
function Earth(props) {
  var earthRef = props.earthRef
  
  return (
    <group ref={earthRef}>
      {/* Earth sphere */}
      <mesh rotation={[0.41, 0, 0]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial 
          color="#2E86AB"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Atmosphere glow */}
      <mesh rotation={[0.41, 0, 0]}>
        <sphereGeometry args={[1.02, 32, 32]} />
        <meshBasicMaterial color="#87CEEB" transparent={true} opacity={0.15} />
      </mesh>
    </group>
  )
}

// ===========================================
// EARTH SYSTEM - Main orbital system
// ===========================================
function EarthSystem(props) {
  var timeRef = props.timeRef
  
  // References
  var earthOrbitRef = useRef()      // Earth's position around Sun
  var earthSpinRef = useRef()       // Earth's rotation on its axis
  var moonRef = useRef()            // Moon's position around Earth
  var satelliteRef = useRef()       // Satellite's position around Earth
  
  // Distances
  var earthOrbitRadius = 25         // Earth distance from Sun
  var moonOrbitRadius = 2.5         // Moon distance from Earth
  var satelliteOrbitRadius = 1.3    // Satellite distance from Earth
  var satelliteInclination = 0.5    // Satellite orbit inclination
  
  useFrame(function () {
    var time = timeRef.current
    
    // ===========================================
    // 1. EARTH ORBITING THE SUN (1 year = 365 days)
    // ===========================================
    var earthAngle = (time / EARTH_YEAR) * Math.PI * 2
    earthOrbitRef.current. position.x = Math.cos(earthAngle) * earthOrbitRadius
    earthOrbitRef.current.position.z = Math.sin(earthAngle) * earthOrbitRadius
    
    // ===========================================
    // 2. EARTH ROTATING ON ITS AXIS (1 rotation = 1 day)
    // ===========================================
    earthSpinRef.current. rotation.y = (time / EARTH_DAY) * Math.PI * 2
    
    // ===========================================
    // 3. MOON ORBITING EARTH (1 orbit = 27.3 days)
    // ===========================================
    var moonAngle = (time / MOON_ORBIT) * Math.PI * 2
    moonRef.current.position.x = Math. cos(moonAngle) * moonOrbitRadius
    moonRef.current.position. z = Math.sin(moonAngle) * moonOrbitRadius
    
    // ===========================================
    // 4. SATELLITE ORBITING EARTH (1 orbit = 90 minutes)
    // ===========================================
    var satAngle = (time / SATELLITE_ORBIT) * Math.PI * 2
    satelliteRef. current.position.x = Math.cos(satAngle) * satelliteOrbitRadius
    satelliteRef.current.position. z = Math.sin(satAngle) * Math.cos(satelliteInclination) * satelliteOrbitRadius
    satelliteRef.current. position.y = Math.sin(satAngle) * Math.sin(satelliteInclination) * satelliteOrbitRadius
    
    // Satellite always faces direction of travel
    satelliteRef.current.rotation.y = -satAngle + Math.PI / 2
  })

  return (
    <group>
      {/* Earth's orbit path around Sun */}
      <OrbitPath radius={earthOrbitRadius} color="#4a90d9" opacity={0.2} />
      
      {/* Earth orbit group (moves around Sun) */}
      <group ref={earthOrbitRef}>
        
        {/* Earth spin group (rotates on axis) */}
        <group ref={earthSpinRef}>
          <Earth earthRef={useRef()} />
        </group>
        
        {/* Moon */}
        <Moon moonRef={moonRef} />
        
        {/* Moon orbit path */}
        <OrbitPath radius={moonOrbitRadius} color="#888888" opacity={0.4} />
        
        {/* Satellite */}
        <Satellite satelliteRef={satelliteRef} />
        
        {/* Satellite orbit path (inclined) */}
        <group rotation={[satelliteInclination, 0, 0]}>
          <OrbitPath radius={satelliteOrbitRadius} color="#ff4444" opacity={0.5} />
        </group>
        
      </group>
    </group>
  )
}

// ===========================================
// SCENE COMPONENT
// ===========================================
function Scene(props) {
  var timeRef = props.timeRef
  var isPaused = props. isPaused
  var timeSpeed = props.timeSpeed

  useFrame(function (state, delta) {
    if (!isPaused) {
      timeRef.current += delta * timeSpeed
    }
  })

  return (
    <>
      <ambientLight intensity={0.1} />
      <Stars radius={300} depth={100} count={5000} factor={4} fade={true} speed={0.5} />
      
      <Sun />
      <EarthSystem timeRef={timeRef} />
      
      <OrbitControls
        autoRotate={false}
        minDistance={3}
        maxDistance={150}
        enableDamping={true}
        dampingFactor={0.05}
      />
    </>
  )
}

// ===========================================
// INFO PANEL COMPONENT
// ===========================================
function InfoPanel(props) {
  var timeRef = props.timeRef
  var currentDay = Math.floor(timeRef.current)
  var currentYear = Math.floor(timeRef.current / 365)
  
  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right:  20,
      background: 'rgba(0,0,0,0.8)',
      padding: '20px',
      borderRadius: '12px',
      color: 'white',
      fontSize: '13px',
      minWidth: '200px',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#ffd700' }}>
        Orbital Mechanics
      </h3>
      
      <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom:  '1px solid #333' }}>
        <div style={{ color: '#4a90d9', marginBottom: '5px', fontWeight: 'bold' }}>🌍 Earth</div>
        <div style={{ color:  '#aaa', fontSize: '11px', lineHeight: '1.6' }}>
          <div>• Orbits Sun:  365.25 days</div>
          <div>• Rotates:  24 hours</div>
          <div>• Axial tilt: 23.5°</div>
        </div>
      </div>
      
      <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #333' }}>
        <div style={{ color:  '#888888', marginBottom: '5px', fontWeight: 'bold' }}>🌙 Moon</div>
        <div style={{ color: '#aaa', fontSize: '11px', lineHeight: '1.6' }}>
          <div>• Orbits Earth: 27.3 days</div>
          <div>• Distance: 384,400 km</div>
        </div>
      </div>
      
      <div>
        <div style={{ color: '#ff4444', marginBottom: '5px', fontWeight: 'bold' }}>🛰️ Satellite (ISS)</div>
        <div style={{ color: '#aaa', fontSize: '11px', lineHeight:  '1.6' }}>
          <div>• Orbits Earth: ~90 min</div>
          <div>• Altitude: ~400 km</div>
          <div>• Inclination: 51.6°</div>
        </div>
      </div>
    </div>
  )
}

// ===========================================
// CONTROLS COMPONENT
// ===========================================
function Controls(props) {
  var isPaused = props. isPaused
  var setIsPaused = props.setIsPaused
  var timeSpeed = props. timeSpeed
  var setTimeSpeed = props.setTimeSpeed
  var timeRef = props.timeRef
  var setViewTarget = props.setViewTarget

  return (
    <div style={{
      position: 'absolute',
      bottom:  20,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap:  '10px',
      background: 'rgba(0,0,0,0.8)',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      {/* Main controls row */}
      <div style={{ display:  'flex', gap: '10px', alignItems: 'center' }}>
        <button
          onClick={function () { setIsPaused(!isPaused) }}
          style={{
            background: isPaused ? '#22c55e' : '#ef4444',
            border: 'none',
            color: 'white',
            padding: '12px 24px',
            borderRadius:  '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize:  '14px',
            minWidth: '100px'
          }}
        >
          {isPaused ?  '▶ Play' : '⏸ Pause'}
        </button>

        <div style={{ display:  'flex', alignItems: 'center', gap: '10px', padding: '0 15px' }}>
          <span style={{ color: '#888', fontSize: '12px' }}>Speed:</span>
          <input
            type="range"
            min="0.1"
            max="50"
            step="0.1"
            value={timeSpeed}
            onChange={function (e) { setTimeSpeed(parseFloat(e.target.value)) }}
            style={{ width:  '120px', cursor: 'pointer' }}
          />
          <span style={{ color: 'white', fontSize: '13px', minWidth: '80px' }}>
            {timeSpeed. toFixed(1)} days/s
          </span>
        </div>

        <button
          onClick={function () { timeRef.current = 0 }}
          style={{
            background: '#6b7280',
            border: 'none',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor:  'pointer',
            fontSize: '14px'
          }}
        >
          ↺ Reset
        </button>
      </div>
      
      {/* Time display */}
      <div style={{ 
        textAlign: 'center', 
        color: '#ffd700', 
        fontSize: '14px',
        paddingTop: '10px',
        borderTop: '1px solid #333'
      }}>
        Day {Math.floor(timeRef.current)} | Year {Math.floor(timeRef.current / 365) + 1}
      </div>
    </div>
  )
}

// ===========================================
// MAIN COMPONENT
// ===========================================
export default function SolarSystem() {
  var timeRef = useRef(0)
  
  var pauseState = useState(false)
  var isPaused = pauseState[0]
  var setIsPaused = pauseState[1]

  var speedState = useState(5)
  var timeSpeed = speedState[0]
  var setTimeSpeed = speedState[1]

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative' }}>
      <Canvas camera={{ position: [0, 40, 60], fov: 50 }}>
        <Scene timeRef={timeRef} isPaused={isPaused} timeSpeed={timeSpeed} />
      </Canvas>

      {/* Title */}
      <div style={{ position:  'absolute', top: 20, left: 20, color: 'white' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          margin: 0, 
          color: '#ffd700',
          textShadow: '0 0 20px rgba(255,215,0,0.3)'
        }}>
          🌌 Earth Orbital System
        </h1>
        <p style={{ fontSize: '14px', color: '#888', margin: '10px 0 0 0' }}>
          Satellite → Earth → Moon → Sun
        </p>
        <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
          Drag to rotate view • Scroll to zoom
        </p>
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