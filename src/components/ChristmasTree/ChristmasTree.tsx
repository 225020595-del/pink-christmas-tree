import { useFrame } from '@react-three/fiber'
import { useRef, useState, useEffect } from 'react'
import { Group, MathUtils } from 'three'
import * as THREE from 'three'
import { useStore } from '../../store'
import { Foliage } from '../Foliage/Foliage'
import { Ornaments } from '../Ornaments/Ornaments'
import { Star } from '../Star/Star'

export function ChristmasTree() {
  const mode = useStore((state) => state.mode)
  const toggleMode = useStore((state) => state.toggleMode)
  const targetRotationY = useStore((state) => state.targetRotationY)
  const interactionMode = useStore((state) => state.interactionMode)
  const power = useStore((state) => state.power)
  
  const progress = useRef(0) // 0 = EXPLODE (Initial), 1 = TREE
  const group = useRef<Group>(null)
  const powerProgress = useRef(1) // 0 = OFF, 1 = ON
  
  // Entrance Animation State
  const [entered, setEntered] = useState(false)
  
  useEffect(() => {
    // Start animation after a short delay
    const timer = setTimeout(() => setEntered(true), 500)
    return () => clearTimeout(timer)
  }, [])

  useFrame((_state, delta) => {
    // Power State Interpolation
    const targetPower = power ? 1 : 0
    powerProgress.current = MathUtils.damp(powerProgress.current, targetPower, 2, delta)

    // 0. Entrance Animation (Scale Up)
    if (group.current) {
      const targetScale = entered ? 1 : 0.01
      // Slower lerp for dramatic effect
      const currentScale = group.current.scale.x
      const newScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * 1.5)
      group.current.scale.setScalar(newScale)
    }

    // 1. State Interpolation
    const target = mode === 'TREE' ? 1 : 0
    progress.current = MathUtils.damp(progress.current, target, 2.5, delta)
    
    // 2. Rotation Logic
    if (group.current) {
      // Base rotation (Only if power ON)
      // Lerp speed based on powerProgress
      let baseSpeed = 0.2 // Music box feel
      if (powerProgress.current < 0.1) baseSpeed = 0
      
      let rotSpeed = baseSpeed * delta * powerProgress.current
      
      // Gesture override
      if (interactionMode === 'GESTURE' && targetRotationY !== 0) {
        // Smoothly rotate towards target (relative) or just add speed
        // Here we assume targetRotationY is a speed modifier from hand movement
        rotSpeed = targetRotationY * 5 * delta
      }

      group.current.rotation.y += rotSpeed
    }
  })
  
  const handleClick = (e: any) => {
    e.stopPropagation()
    if (interactionMode === 'MOUSE') {
      toggleMode()
    }
  }

  return (
    <group ref={group} scale={0.01}>
      {/* Hit Box - Optimized Interaction */}
      <mesh onClick={handleClick} visible={true}>
        <cylinderGeometry args={[6, 6, 12, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      <Foliage progress={progress} />
      {/* Ornaments and Star depend on Power */}
      <group scale={powerProgress.current}>
         <Ornaments progress={progress} />
         <Star progress={progress} />
      </group>
    </group>
  )
}
