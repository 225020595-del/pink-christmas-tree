import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface FoliageProps {
  progress: React.MutableRefObject<number>
}

export function Foliage({ progress }: FoliageProps) {
  const count = 3000 // Optimized for performance
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  // Pink Octahedrons
  const geometry = useMemo(() => new THREE.OctahedronGeometry(0.15, 0), [])
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#F9F1F5', // Dream Pink
    roughness: 0.15, // Polished
    metalness: 0.9, // High metalness for luxury
    emissive: '#E8D0D8', // Luxury Pink glow
    emissiveIntensity: 0.1
  }), [])

  const [data] = useState(() => {
    const chaosPositions = new Float32Array(count * 3)
    const targetPositions = new Float32Array(count * 3)
    const randoms = new Float32Array(count)
    const scales = new Float32Array(count)
    const rotations = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    
    const colorPalette = [
        new THREE.Color('#F9F1F5'), // Dream Pink
        new THREE.Color('#E8D0D8'), // Luxury Pink
        new THREE.Color('#E8E8E8'), // Silver
        new THREE.Color('#F5F5F7'), // Platinum
    ]
    
    for (let i = 0; i < count; i++) {
      // CHAOS: Random Sphere
      const r = 20 * Math.cbrt(Math.random())
      const theta = Math.random() * 2 * Math.PI
      const phi = Math.acos(2 * Math.random() - 1)
      chaosPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      chaosPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      chaosPositions[i * 3 + 2] = r * Math.cos(phi)

      // TARGET: Cone Volume
      const h = Math.random() * 12
      const radiusAtH = 6 * (1 - h / 12) // Slightly wider base
      // Volume distribution
      const rCone = Math.sqrt(Math.random()) * radiusAtH
      const angle = Math.random() * 2 * Math.PI
      
      targetPositions[i * 3] = rCone * Math.cos(angle)
      targetPositions[i * 3 + 1] = h - 6
      targetPositions[i * 3 + 2] = rCone * Math.sin(angle)
      
      randoms[i] = Math.random()
      scales[i] = Math.random() * 0.5 + 0.5
      
      rotations[i*3] = Math.random() * Math.PI
      rotations[i*3+1] = Math.random() * Math.PI
      rotations[i*3+2] = Math.random() * Math.PI
      
      const c = colorPalette[Math.floor(Math.random() * colorPalette.length)]
      colors[i*3] = c.r
      colors[i*3+1] = c.g
      colors[i*3+2] = c.b
    }
    
    return { chaosPositions, targetPositions, randoms, rotations, colors, scales }
  })

  // Initialize colors once
  useMemo(() => {
    // We use useMemo to ensure it runs early, but ref might be null. 
    // Better use useLayoutEffect or just do it in the loop once if needed, 
    // but doing it here requires mesh access. 
    // Actually, let's use useLayoutEffect.
  }, [])

  useFrame((state) => {
    if (!mesh.current) return
    
    // Initialize colors if needed (one-time check)
    if (!mesh.current.userData.colorsInitialized) {
      for (let i = 0; i < count; i++) {
        mesh.current.setColorAt(i, new THREE.Color(data.colors[i*3], data.colors[i*3+1], data.colors[i*3+2]))
      }
      if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
      mesh.current.userData.colorsInitialized = true
    }

    const time = state.clock.elapsedTime
    const p = progress.current
    
    // Optimization: Skip heavy updates if static (optional, but keep for now for animation)
    
    for (let i = 0; i < count; i++) {
      // Per-particle staggered motion
      // Simplified smoothstep for performance
      const localP = p < 0.01 ? 0 : (p > 0.99 ? 1 : THREE.MathUtils.smoothstep(p, 0.2 * data.randoms[i], 1.0))
      
      const idx3 = i * 3
      
      // Lerp manually for speed
      const cx = data.chaosPositions[idx3]
      const cy = data.chaosPositions[idx3+1]
      const cz = data.chaosPositions[idx3+2]
      
      const tx = data.targetPositions[idx3]
      const ty = data.targetPositions[idx3+1]
      const tz = data.targetPositions[idx3+2]
      
      const x = cx + (tx - cx) * localP
      const y = cy + (ty - cy) * localP
      const z = cz + (tz - cz) * localP
      
      // Simplified breathing
      const floatY = Math.sin(time * 2 + data.randoms[i] * 10) * 0.05
      
      dummy.position.set(x, y + floatY, z)
      
      // Reduced rotation calculation complexity
      dummy.rotation.set(
        data.rotations[idx3] + time * 0.2,
        data.rotations[idx3+1] + time * 0.1,
        data.rotations[idx3+2] + time * 0.2
      )
      
      // Apply scale
      dummy.scale.setScalar(data.scales[i])
      
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[geometry, material, count]}>
    </instancedMesh>
  )
}
