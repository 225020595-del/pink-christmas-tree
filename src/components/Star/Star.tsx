import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Float, Sparkles } from '@react-three/drei'

interface StarProps {
  progress: React.MutableRefObject<number>
}

export function Star({ progress }: StarProps) {
  const group = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (!group.current) return
    const p = progress.current
    
    // Scale up when formed
    const scale = THREE.MathUtils.smoothstep(p, 0.8, 1.0)
    group.current.scale.setScalar(scale)
    
    // Only visible when mostly formed
    group.current.visible = scale > 0.01
    
    // Rotate
    group.current.rotation.y = state.clock.elapsedTime * 0.5
  })

  // Custom Star Shape
  const starShape = new THREE.Shape()
  const points = 5
  const outerRadius = 1
  const innerRadius = 0.4
  
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (i === 0) starShape.moveTo(x, y)
    else starShape.lineTo(x, y)
  }
  starShape.closePath()

  const extrudeSettings = {
    depth: 0.1,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.05,
    bevelThickness: 0.05
  }

  return (
    <group ref={group} position={[0, 6.5, 0]}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh>
          <extrudeGeometry args={[starShape, extrudeSettings]} />
          <meshStandardMaterial 
            color="#E8E8E8" 
            emissive="#FFFFFF" 
            emissiveIntensity={2}
            toneMapped={false}
          />
        </mesh>
        
        {/* Dynamic Sparkles */}
        <Sparkles 
          count={50} 
          scale={3} 
          size={4} 
          speed={0.4} 
          opacity={1} 
          color="#FFF"
        />
      </Float>
    </group>
  )
}
