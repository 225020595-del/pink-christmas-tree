import { Environment } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useStore } from '../store'
import { ChristmasTree } from './ChristmasTree/ChristmasTree'
import { Snow } from './Snow/Snow'
import { useThree, useFrame } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'

function CameraController() {
  const targetDistance = useStore((state) => state.targetDistance)
  const interactionMode = useStore((state) => state.interactionMode)
  const { camera } = useThree()
  
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
  // const mode = useStore((state) => state.mode)
  
  useEffect(() => {
    // Fog for depth
    scene.fog = new THREE.FogExp2('#0A0A0A', 0.02)
  }, [scene])

  return (
    <>
      <color attach="background" args={['#0A0A0A']} />
      
      {/* Lighting - Cooler, more silver/white */}
      <ambientLight intensity={0.4} color="#F5F5F7" />
      <Environment preset="city" />
      
      {/* Silver/Pale Pink Rim Light */}
      <spotLight 
        position={[10, 10, -10]} 
        angle={0.5} 
        penumbra={1} 
        intensity={6} 
        color="#F9F1F5" 
        // castShadow - Disabled for performance
      />
      
      {/* Bottom Light for Drama - Platinum */}
      <pointLight position={[0, -5, 5]} intensity={4} color="#E8D0D8" distance={15} />
      
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
          intensity={1.2} 
          radius={0.5}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  )
}
