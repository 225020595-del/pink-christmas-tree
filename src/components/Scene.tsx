import { Environment } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useStore } from '../store'
import { ChristmasTree } from './ChristmasTree/ChristmasTree'
import { Snow } from './Snow/Snow'
import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

function CameraController() {
  const targetDistance = useStore((state) => state.targetDistance)
  const interactionMode = useStore((state) => state.interactionMode)
  const viewMode = useStore((state) => state.viewMode)
  const { camera } = useThree()
  
  // Adjust FOV based on View Mode
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    if (viewMode === 'MOBILE') {
      cam.fov = 65 // Wider FOV for portrait mode
      if (cam.position.z < 18) {
        cam.position.z = 18 // Push back further if too close
      }
    } else {
      cam.fov = 50 // Standard FOV for PC
    }
    cam.updateProjectionMatrix()
  }, [viewMode, camera])
  
  useFrame(() => {
    if (interactionMode === 'GESTURE') {
      // Smoothly interpolate camera position length (distance from origin)
      const currentPos = camera.position.clone()
      const currentDist = currentPos.length()
      
      const newDist = THREE.MathUtils.lerp(currentDist, targetDistance, 0.05)
      
      // Maintain direction, just change length
      currentPos.setLength(newDist)
      camera.position.copy(currentPos)
    }
  })
  
  return null
}

export function Scene() {
  const { scene } = useThree()
  const power = useStore((state) => state.power)
  const powerVal = useRef(1) // Lerped value
  
  // Lights Refs
  const ambientLight = useRef<THREE.AmbientLight>(null)
  const spotLight = useRef<THREE.SpotLight>(null)
  const pointLight = useRef<THREE.PointLight>(null)

  useEffect(() => {
    // Fog for depth
    scene.fog = new THREE.FogExp2('#0A0A0A', 0.02)
  }, [scene])

  useFrame((state, delta) => {
    // Lerp Power Value
    const target = power ? 1 : 0
    powerVal.current = THREE.MathUtils.damp(powerVal.current, target, 2, delta)
    
    // Update Lights
    if (ambientLight.current) ambientLight.current.intensity = 0.1 + (0.3 * powerVal.current)
    if (spotLight.current) spotLight.current.intensity = 6 * powerVal.current
    if (pointLight.current) pointLight.current.intensity = 4 * powerVal.current
    
    // Update Background Color (Optional, keeping it dark for contrast or changing it?)
    // User requested "OFF: Background near black #010102"
    // Currently #0A0A0A. Let's keep it subtle.
    // scene.background = new THREE.Color().setHex(0x010102).lerp(new THREE.Color().setHex(0x0A0A0A), powerVal.current)
  })

  return (
    <>
      <color attach="background" args={['#0A0A0A']} />
      
      {/* Lighting - Cooler, more silver/white */}
      <ambientLight ref={ambientLight} intensity={0.4} color="#F5F5F7" />
      <Environment preset="city" />
      
      {/* Silver/Pale Pink Rim Light */}
      <spotLight 
        ref={spotLight}
        position={[10, 10, -10]} 
        angle={0.5} 
        penumbra={1} 
        intensity={6} 
        color="#F9F1F5" 
        // castShadow - Disabled for performance
      />
      
      {/* Bottom Light for Drama - Platinum */}
      <pointLight ref={pointLight} position={[0, -5, 5]} intensity={4} color="#E8D0D8" distance={15} />
      
      <CameraController />
      <ChristmasTree />
      <Snow />
      
      {/* <ContactShadows 
        opacity={0.5} 
        scale={20} 
        blur={2} 
        far={10} 
        resolution={128} // Reduced resolution
        frames={1} // Render only once for performance
        color="#000000" 
      /> */}
      
      <EffectComposer>
        <Bloom 
          luminanceThreshold={0.2} 
          mipmapBlur 
          intensity={1.2 * (power ? 1 : 0)} // Dynamic Bloom? PostProcessing props are not easily animated per frame without ref.
          // But intensity is prop. React will re-render if we pass prop.
          // For smoother performance, keep it static or accept re-renders on power toggle.
          // Actually, let's keep it static, the light intensity changes will affect bloom naturally.
          radius={0.5}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  )
}
