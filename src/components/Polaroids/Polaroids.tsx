import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

interface PolaroidsProps {
  progress: React.MutableRefObject<number>
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  varying vec2 vUv;
  uniform vec3 uColor;
  
  void main() {
    // Polaroid frame
    float borderLeft = 0.05;
    float borderRight = 0.95;
    float borderTop = 0.95;
    float borderBottom = 0.2; 
    
    vec3 finalColor = vec3(0.98); // White paper
    
    // Shadow/Depth for frame
    float d = 0.0; // border distance
    
    if (vUv.x > borderLeft && vUv.x < borderRight && vUv.y > borderBottom && vUv.y < borderTop) {
      finalColor = uColor;
      
      // Vignette on photo
      float dist = distance(vUv, vec2(0.5, (borderTop + borderBottom) * 0.5));
      finalColor *= 1.0 - dist * 0.5;
    }
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`

export function Polaroids({ progress }: PolaroidsProps) {
  const count = 40
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  const planeGeometry = useMemo(() => new THREE.PlaneGeometry(0.8, 1.0), [])
  const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uColor: { value: new THREE.Color() }
    },
    side: THREE.DoubleSide
  }), [])

  // We need to patch the shader to support instanceColor because ShaderMaterial doesn't do it automatically for custom uniforms usually,
  // BUT InstancedMesh injects 'instanceColor' attribute.
  // We need to update shader to use 'instanceColor' attribute.
  const patchedMaterial = useMemo(() => {
    const mat = shaderMaterial.clone()
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = `
        attribute vec3 instanceColor;
        varying vec3 vInstanceColor;
        ${shader.vertexShader}
      `.replace(
        'void main() {',
        'void main() { vInstanceColor = instanceColor;'
      )
      
      shader.fragmentShader = `
        varying vec3 vInstanceColor;
        ${shader.fragmentShader}
      `.replace(
        'uniform vec3 uColor;',
        ''
      ).replace(
        'finalColor = uColor;',
        'finalColor = vInstanceColor;'
      )
    }
    return mat
  }, [shaderMaterial])

  const [data] = useState(() => {
    const chaosPositions = new Float32Array(count * 3)
    const targetPositions = new Float32Array(count * 3)
    const randoms = new Float32Array(count)
    const scales = new Float32Array(count)
    const rotations = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      // Chaos
      const r = 25 * Math.cbrt(Math.random())
      const theta = Math.random() * 2 * Math.PI
      const phi = Math.acos(2 * Math.random() - 1)
      chaosPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      chaosPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      chaosPositions[i * 3 + 2] = r * Math.cos(phi)

      // Target: On the tree surface, randomly distributed
      const h = Math.random() * 10
      const radiusAtH = 5 * (1 - h / 12)
      const rCone = radiusAtH + 0.2 // Slightly outside foliage
      const angle = Math.random() * 2 * Math.PI
      
      targetPositions[i * 3] = rCone * Math.cos(angle)
      targetPositions[i * 3 + 1] = h - 6
      targetPositions[i * 3 + 2] = rCone * Math.sin(angle)
      
      randoms[i] = Math.random()
      scales[i] = Math.random() * 0.5 + 0.5
      
      rotations[i*3] = Math.random() * Math.PI * 0.2 // Tilt slightly
      rotations[i*3+1] = Math.random() * Math.PI * 2
      rotations[i*3+2] = Math.random() * Math.PI * 0.1
      
      // Random pastel colors for "photos"
      const c = new THREE.Color().setHSL(Math.random(), 0.5, 0.5)
      colors[i*3] = c.r
      colors[i*3+1] = c.g
      colors[i*3+2] = c.b
    }
    return { chaosPositions, targetPositions, randoms, scales, rotations, colors }
  })

  useFrame((state) => {
    if (!mesh.current) return
    
    const time = state.clock.elapsedTime
    const p = progress.current
    
    for (let i = 0; i < count; i++) {
      const localP = THREE.MathUtils.smoothstep(p, 0.3 * data.randoms[i], 1.0)
      
      const x = THREE.MathUtils.lerp(data.chaosPositions[i*3], data.targetPositions[i*3], localP)
      const y = THREE.MathUtils.lerp(data.chaosPositions[i*3+1], data.targetPositions[i*3+1], localP)
      const z = THREE.MathUtils.lerp(data.chaosPositions[i*3+2], data.targetPositions[i*3+2], localP)
      
      // Look at center when formed
      dummy.position.set(x, y, z)
      
      if (p > 0.5) {
        dummy.lookAt(0, y, 0)
        dummy.rotateY(Math.PI) // Face outward
        // Add some random tilt
        dummy.rotateZ(Math.sin(time + data.randoms[i] * 10) * 0.1)
      } else {
        dummy.rotation.set(
          time * 0.5 + data.randoms[i],
          time * 0.3 + data.randoms[i],
          time * 0.4 + data.randoms[i]
        )
      }
      
      dummy.scale.setScalar(data.scales[i])
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
      mesh.current.setColorAt(i, new THREE.Color(data.colors[i*3], data.colors[i*3+1], data.colors[i*3+2]))
    }
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[planeGeometry, patchedMaterial, count]}>
    </instancedMesh>
  )
}
