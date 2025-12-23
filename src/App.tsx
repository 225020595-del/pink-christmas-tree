import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { UI } from './components/UI'
import { Scene } from './components/Scene'
import { GestureController } from './components/GestureController/GestureController'
import { useStore } from './store'
import { OrbitControls } from '@react-three/drei'

function App() {
  const hasStarted = useStore((state) => state.hasStarted)
  const isAwake = useStore((state) => state.isAwake)
  const toggleMode = useStore((state) => state.toggleMode)
  const interactionMode = useStore((state) => state.interactionMode)

  return (
    <div className="w-full h-screen relative bg-[#0A0A0A] overflow-hidden select-none">
      {/* Main 3D Canvas */}
      <Canvas 
        onPointerMissed={() => interactionMode === 'MOUSE' && toggleMode()}
        shadows
        camera={{ position: [0, 2, 12], fov: 50 }} 
        gl={{ 
          antialias: false, 
          stencil: false, 
          depth: true,
          powerPreference: "high-performance"
        }}
        dpr={[1, 1.2]} // Optimization: Lower max DPR for performance
      >
        <Suspense fallback={null}>
          {(isAwake || hasStarted) && (
            <>
              <Scene />
              <OrbitControls 
                makeDefault 
                enablePan={false} 
                minPolarAngle={0} 
                maxPolarAngle={Math.PI / 1.5}
                minDistance={5}
                maxDistance={30}
              />
            </>
          )}
        </Suspense>
      </Canvas>
      
      {/* UI Overlay */}
      <UI />
      
      {/* Logic Controllers */}
      <GestureController />
    </div>
  )
}

export default App
