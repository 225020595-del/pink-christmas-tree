import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

interface OrnamentProps {
  progress: React.MutableRefObject<number>
}

// 1. Cubes & Icosahedrons (High Gloss)
function GemOrnaments({ progress }: OrnamentProps) {
  const count = 150 // Optimized
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(0.2, 0), [])
  const material = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#F5F5F7', // Platinum
    metalness: 1.0,
    roughness: 0.02, // Extremely polished
    transmission: 0.2,
    thickness: 2,
    clearcoat: 1,
    emissive: '#FFFFFF',
    emissiveIntensity: 0.3
  }), [])

  const [data] = useState(() => {
    const chaosPositions = new Float32Array(count * 3)
    const targetPositions = new Float32Array(count * 3)
    const randoms = new Float32Array(count)
    const scales = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      // Chaos
      const r = 25 * Math.cbrt(Math.random())
      const theta = Math.random() * 2 * Math.PI
      const phi = Math.acos(2 * Math.random() - 1)
      chaosPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      chaosPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      chaosPositions[i * 3 + 2] = r * Math.cos(phi)

      // Target: Surface of cone
      const h = Math.random() * 11
      const radiusAtH = 5 * (1 - h / 12)
      const rCone = radiusAtH + 0.3 // Slightly outside
      const angle = Math.random() * 2 * Math.PI
      
      targetPositions[i * 3] = rCone * Math.cos(angle)
      targetPositions[i * 3 + 1] = h - 6
      targetPositions[i * 3 + 2] = rCone * Math.sin(angle)
      
      randoms[i] = Math.random()
      scales[i] = Math.random() * 0.5 + 0.5
    }
    return { chaosPositions, targetPositions, randoms, scales }
  })

  useFrame((state) => {
    if (!mesh.current) return
    const time = state.clock.elapsedTime
    const p = progress.current
    
    for (let i = 0; i < count; i++) {
      const localP = THREE.MathUtils.smoothstep(p, 0.1 * data.randoms[i], 1.0)
      
      const x = THREE.MathUtils.lerp(data.chaosPositions[i*3], data.targetPositions[i*3], localP)
      const y = THREE.MathUtils.lerp(data.chaosPositions[i*3+1], data.targetPositions[i*3+1], localP)
      const z = THREE.MathUtils.lerp(data.chaosPositions[i*3+2], data.targetPositions[i*3+2], localP)
      
      dummy.position.set(x, y, z)
      dummy.rotation.set(time + data.randoms[i], time + data.randoms[i], time)
      dummy.scale.setScalar(data.scales[i])
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={mesh} args={[geometry, material, count]} />
}

// 2. Spiral Ribbon (Tetrahedrons)
function SpiralRibbon({ progress }: OrnamentProps) {
  const count = 800 // Optimized
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  const geometry = useMemo(() => new THREE.TetrahedronGeometry(0.08, 0), [])
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#E8E8E8', // Silver
    emissive: '#F5F5F7', // Platinum
    emissiveIntensity: 1.0,
    toneMapped: false
  }), [])

  const [data] = useState(() => {
    const chaosPositions = new Float32Array(count * 3)
    const targetPositions = new Float32Array(count * 3)
    const randoms = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      // Chaos
      const r = 25 * Math.cbrt(Math.random())
      const theta = Math.random() * 2 * Math.PI
      const phi = Math.acos(2 * Math.random() - 1)
      chaosPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      chaosPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      chaosPositions[i * 3 + 2] = r * Math.cos(phi)

      // Target: Spiral
      // 3 turns = 6 PI
      const t = (i / count) // 0 to 1
      const angle = t * Math.PI * 6 // 3 turns
      const h = t * 12 - 6 // Bottom to top
      const radiusAtH = (5 * (1 - (h + 6) / 12)) + 0.5 // Slightly outside foliage
      
      targetPositions[i * 3] = radiusAtH * Math.cos(angle)
      targetPositions[i * 3 + 1] = h
      targetPositions[i * 3 + 2] = radiusAtH * Math.sin(angle)
      
      randoms[i] = Math.random()
    }
    return { chaosPositions, targetPositions, randoms }
  })

  useFrame(() => {
    if (!mesh.current) return
    const p = progress.current
    
    for (let i = 0; i < count; i++) {
      const localP = THREE.MathUtils.smoothstep(p, 0.5 * data.randoms[i], 1.0)
      
      const x = THREE.MathUtils.lerp(data.chaosPositions[i*3], data.targetPositions[i*3], localP)
      const y = THREE.MathUtils.lerp(data.chaosPositions[i*3+1], data.targetPositions[i*3+1], localP)
      const z = THREE.MathUtils.lerp(data.chaosPositions[i*3+2], data.targetPositions[i*3+2], localP)
      
      dummy.position.set(x, y, z)
      // Align to tangent roughly? or just random spin
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={mesh} args={[geometry, material, count]} />
}

import { ExtraDecorations } from './ExtraDecorations'

export function Ornaments({ progress }: OrnamentProps) {
  return (
    <group>
      <GemOrnaments progress={progress} />
      <SpiralRibbon progress={progress} />
      <ExtraDecorations progress={progress} />
    </group>
  )
}
