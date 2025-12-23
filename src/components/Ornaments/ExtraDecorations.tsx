import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface OrnamentProps {
  progress: React.MutableRefObject<number>
}

// 1. Pink Donuts (Torus)
function Donuts({ progress }: OrnamentProps) {
  const count = 80
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  const geometry = useMemo(() => new THREE.TorusGeometry(0.15, 0.08, 10, 20), [])
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#E8D0D8', // Low Saturation Pink (Pastel)
    roughness: 0.3,
    metalness: 0.2,
    emissive: '#DB7093', // Pale Violet Red glow
    emissiveIntensity: 0.1
  }), [])

  const [data] = useState(() => {
    const chaosPositions = new Float32Array(count * 3)
    const targetPositions = new Float32Array(count * 3)
    const randoms = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      // Chaos
      const r = 20 * Math.cbrt(Math.random())
      const theta = Math.random() * 2 * Math.PI
      const phi = Math.acos(2 * Math.random() - 1)
      chaosPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      chaosPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      chaosPositions[i * 3 + 2] = r * Math.cos(phi)

      // Target
      const h = Math.random() * 10 - 5
      const radiusAtH = 4 * (1 - (h + 6) / 12) + 0.5
      const angle = Math.random() * 2 * Math.PI
      
      targetPositions[i * 3] = radiusAtH * Math.cos(angle)
      targetPositions[i * 3 + 1] = h
      targetPositions[i * 3 + 2] = radiusAtH * Math.sin(angle)
      
      randoms[i] = Math.random()
    }
    return { chaosPositions, targetPositions, randoms }
  })

  useFrame((state) => {
    if (!mesh.current) return
    const p = progress.current
    const time = state.clock.elapsedTime
    
    for (let i = 0; i < count; i++) {
      const localP = THREE.MathUtils.smoothstep(p, 0.3 * data.randoms[i], 1.0)
      
      const x = THREE.MathUtils.lerp(data.chaosPositions[i*3], data.targetPositions[i*3], localP)
      const y = THREE.MathUtils.lerp(data.chaosPositions[i*3+1], data.targetPositions[i*3+1], localP)
      const z = THREE.MathUtils.lerp(data.chaosPositions[i*3+2], data.targetPositions[i*3+2], localP)
      
      dummy.position.set(x, y, z)
      dummy.rotation.set(time + i, time + i, 0)
      dummy.scale.setScalar(0.5 + 0.5 * localP)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={mesh} args={[geometry, material, count]} />
}

// 2. Pink Gifts (Boxes)
function Gifts({ progress }: OrnamentProps) {
  const count = 30 // Reduced from 80
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  const geometry = useMemo(() => new THREE.BoxGeometry(0.3, 0.3, 0.3), [])
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#FFB7C5', // Pastel Pink
    roughness: 0.1,
    metalness: 0.5,
  }), [])

  const [data] = useState(() => {
    const chaosPositions = new Float32Array(count * 3)
    const targetPositions = new Float32Array(count * 3)
    const randoms = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      // Chaos
      const r = 20 * Math.cbrt(Math.random())
      const theta = Math.random() * 2 * Math.PI
      const phi = Math.acos(2 * Math.random() - 1)
      chaosPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      chaosPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      chaosPositions[i * 3 + 2] = r * Math.cos(phi)

      // Target
      const h = Math.random() * 12 - 6
      const radiusAtH = 5 * (1 - (h + 6) / 12)
      const angle = Math.random() * 2 * Math.PI
      
      targetPositions[i * 3] = radiusAtH * Math.cos(angle)
      targetPositions[i * 3 + 1] = h
      targetPositions[i * 3 + 2] = radiusAtH * Math.sin(angle)
      
      randoms[i] = Math.random()
    }
    return { chaosPositions, targetPositions, randoms }
  })

  useFrame((state) => {
    if (!mesh.current) return
    const p = progress.current
    
    for (let i = 0; i < count; i++) {
      const localP = THREE.MathUtils.smoothstep(p, 0.3 * data.randoms[i], 1.0)
      
      const x = THREE.MathUtils.lerp(data.chaosPositions[i*3], data.targetPositions[i*3], localP)
      const y = THREE.MathUtils.lerp(data.chaosPositions[i*3+1], data.targetPositions[i*3+1], localP)
      const z = THREE.MathUtils.lerp(data.chaosPositions[i*3+2], data.targetPositions[i*3+2], localP)
      
      dummy.position.set(x, y, z)
      dummy.rotation.set(0, state.clock.elapsedTime + i, 0)
      dummy.scale.setScalar(0.8 * localP)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={mesh} args={[geometry, material, count]} />
}

// 3. Star Wands (Cylinders)
function StarWands({ progress }: OrnamentProps) {
  const count = 100 // Increased from 60
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  const geometry = useMemo(() => new THREE.CylinderGeometry(0.02, 0.02, 0.6), [])
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#FFD700', // Gold
    metalness: 1,
    roughness: 0.2,
    emissive: '#FFD700',
    emissiveIntensity: 0.5
  }), [])

  const [data] = useState(() => {
    const chaosPositions = new Float32Array(count * 3)
    const targetPositions = new Float32Array(count * 3)
    const randoms = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      // Chaos
      const r = 20 * Math.cbrt(Math.random())
      const theta = Math.random() * 2 * Math.PI
      const phi = Math.acos(2 * Math.random() - 1)
      chaosPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      chaosPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      chaosPositions[i * 3 + 2] = r * Math.cos(phi)

      // Target
      const h = Math.random() * 10 - 4
      const radiusAtH = 4.5 * (1 - (h + 6) / 12)
      const angle = Math.random() * 2 * Math.PI
      
      targetPositions[i * 3] = radiusAtH * Math.cos(angle)
      targetPositions[i * 3 + 1] = h
      targetPositions[i * 3 + 2] = radiusAtH * Math.sin(angle)
      
      randoms[i] = Math.random()
    }
    return { chaosPositions, targetPositions, randoms }
  })

  useFrame((state) => {
    if (!mesh.current) return
    const p = progress.current
    
    for (let i = 0; i < count; i++) {
      const localP = THREE.MathUtils.smoothstep(p, 0.4 * data.randoms[i], 1.0)
      
      const x = THREE.MathUtils.lerp(data.chaosPositions[i*3], data.targetPositions[i*3], localP)
      const y = THREE.MathUtils.lerp(data.chaosPositions[i*3+1], data.targetPositions[i*3+1], localP)
      const z = THREE.MathUtils.lerp(data.chaosPositions[i*3+2], data.targetPositions[i*3+2], localP)
      
      dummy.position.set(x, y, z)
      // Tilted nicely
      dummy.rotation.set(Math.PI / 4, state.clock.elapsedTime + i, 0)
      dummy.scale.setScalar(localP)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={mesh} args={[geometry, material, count]} />
}

// 4. Pink Crowns
function Crowns({ progress }: OrnamentProps) {
  const count = 50
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  // Flared Cylinder (Crown shape)
  const geometry = useMemo(() => new THREE.CylinderGeometry(0.2, 0.1, 0.15, 6, 1, true), [])
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#FFB7C5', // Pastel Pink
    roughness: 0.2,
    metalness: 0.8, // Metallic
    side: THREE.DoubleSide
  }), [])

  const [data] = useState(() => {
    const chaosPositions = new Float32Array(count * 3)
    const targetPositions = new Float32Array(count * 3)
    const randoms = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      // Chaos
      const r = 20 * Math.cbrt(Math.random())
      const theta = Math.random() * 2 * Math.PI
      const phi = Math.acos(2 * Math.random() - 1)
      chaosPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      chaosPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      chaosPositions[i * 3 + 2] = r * Math.cos(phi)

      // Target
      const h = Math.random() * 10 - 5
      const radiusAtH = 4.2 * (1 - (h + 6) / 12)
      const angle = Math.random() * 2 * Math.PI
      
      targetPositions[i * 3] = radiusAtH * Math.cos(angle)
      targetPositions[i * 3 + 1] = h
      targetPositions[i * 3 + 2] = radiusAtH * Math.sin(angle)
      
      randoms[i] = Math.random()
    }
    return { chaosPositions, targetPositions, randoms }
  })

  useFrame((state) => {
    if (!mesh.current) return
    const p = progress.current
    
    for (let i = 0; i < count; i++) {
      const localP = THREE.MathUtils.smoothstep(p, 0.35 * data.randoms[i], 1.0)
      
      const x = THREE.MathUtils.lerp(data.chaosPositions[i*3], data.targetPositions[i*3], localP)
      const y = THREE.MathUtils.lerp(data.chaosPositions[i*3+1], data.targetPositions[i*3+1], localP)
      const z = THREE.MathUtils.lerp(data.chaosPositions[i*3+2], data.targetPositions[i*3+2], localP)
      
      dummy.position.set(x, y, z)
      dummy.rotation.set(0, state.clock.elapsedTime * 0.5 + i, 0)
      dummy.scale.setScalar(0.7 * localP)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={mesh} args={[geometry, material, count]} />
}

export function ExtraDecorations({ progress }: OrnamentProps) {
  return (
    <group>
      <Donuts progress={progress} />
      <Gifts progress={progress} />
      <StarWands progress={progress} />
      <Crowns progress={progress} />
    </group>
  )
}