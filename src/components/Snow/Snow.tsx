import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function Snow() {
  const count = 1500
  const mesh = useRef<THREE.Points>(null)
  
  const [positions, velocities] = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50 // x
      positions[i * 3 + 1] = Math.random() * 40 // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50 // z
      
      velocities[i] = Math.random() * 0.1 + 0.05
    }
    
    return [positions, velocities]
  }, [])

  useFrame(() => {
    if (!mesh.current) return
    
    const positions = mesh.current.geometry.attributes.position.array as Float32Array
    
    for (let i = 0; i < count; i++) {
      // Update Y
      positions[i * 3 + 1] -= velocities[i]
      
      // Reset if below ground
      if (positions[i * 3 + 1] < -10) {
        positions[i * 3 + 1] = 30
        positions[i * 3] = (Math.random() - 0.5) * 50
        positions[i * 3 + 2] = (Math.random() - 0.5) * 50
      }
    }
    
    mesh.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#FFFFFF"
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
