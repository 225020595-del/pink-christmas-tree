import { useEffect, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision'
import { useStore } from '../../store'
import { clsx } from 'clsx'
import * as THREE from 'three'

export function GestureController() {
  const webcamRef = useRef<Webcam>(null)
  const [recognizer, setRecognizer] = useState<GestureRecognizer | null>(null)
  const [loaded, setLoaded] = useState(false)
  const requestRef = useRef<number>()
  
  // Store
  const interactionMode = useStore((state) => state.interactionMode)
  const setMode = useStore((state) => state.setMode)
  const setTargetRotationY = useStore((state) => state.setTargetRotationY)
  const setTargetDistance = useStore((state) => state.setTargetDistance)
  
  // Cursor State (Direct DOM manipulation for performance)
  const cursorRef = useRef<HTMLDivElement>(null)
  const smoothCursor = useRef(new THREE.Vector2(0, 0))
  const lastVideoTime = useRef(-1)

  // Zoom State
  const baseHandDistance = useRef<number | null>(null)
  const baseCameraDistance = useRef<number>(12)
  
  // Load model
  useEffect(() => {
    const load = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm"
        )
        const gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2
        })
        setRecognizer(gestureRecognizer)
        setLoaded(true)
      } catch (e) {
        console.error("Failed to load MediaPipe", e)
      }
    }
    load()
  }, [])
  
  // Detection loop
  useEffect(() => {
    if (interactionMode !== 'GESTURE' || !recognizer || !webcamRef.current?.video) return
    
    // Initial distance
    let currentDist = 12

    const detect = () => {
      if (webcamRef.current?.video?.readyState === 4) {
        const video = webcamRef.current.video
        const now = Date.now()
        
        // Limit inference FPS to ~20 (50ms interval)
        if (now - lastVideoTime.current < 50) {
            requestRef.current = requestAnimationFrame(detect)
            return
        }
        lastVideoTime.current = now

        const results = recognizer.recognizeForVideo(video, now)
        
        if (results.gestures.length > 0) {
          const gesture = results.gestures[0][0].categoryName
          // const handedness = results.handedness[0][0].categoryName // "Left" or "Right"
          
          // 1. Mode Switch Logic
          if (gesture === 'Closed_Fist' || gesture === 'Pointing_Up' || gesture === 'Victory') {
             // Pinch/Grab usually maps to Fist in simple recognizer unless using HandLandmarker directly
             // Let's use Fist for "Grab/Form"
             setMode('TREE')
          } else if (gesture === 'Open_Palm') {
             setMode('EXPLODE')
          }
          
          // 2. Cursor & Rotation & Zoom Logic
          if (results.landmarks.length > 0) {
            
            // --- TWO HANDS: ZOOM ---
            if (results.landmarks.length === 2) {
                const hand1 = results.landmarks[0][8] // Index tip
                const hand2 = results.landmarks[1][8] // Index tip
                
                // Calculate distance between hands (in screen space 0..1)
                const dx = hand1.x - hand2.x
                const dy = hand1.y - hand2.y
                const dist = Math.sqrt(dx*dx + dy*dy)
                
                if (baseHandDistance.current === null) {
                    // Start zooming
                    baseHandDistance.current = dist
                    baseCameraDistance.current = currentDist
                } else {
                    // Apply zoom
                    // Factor: How much hands moved relative to base
                    // If dist > base -> Zoom In (Get Closer, distance decreases)
                    // If dist < base -> Zoom Out (Get Farther, distance increases)
                    
                    const delta = dist - baseHandDistance.current
                    // Sensitivity factor
                    const sensitivity = 15 
                    
                    // Invert: Expand hands -> Decrease camera distance (Zoom In)
                    let newDist = baseCameraDistance.current - (delta * sensitivity)
                    newDist = THREE.MathUtils.clamp(newDist, 5, 30)
                    
                    currentDist = newDist // Update local tracker
                    setTargetDistance(newDist)
                }

                // Hide cursor during 2-hand zoom to avoid confusion
                if (cursorRef.current) cursorRef.current.style.opacity = '0'
                
            } else {
                // --- ONE HAND: ROTATE & CURSOR ---
                // Reset Zoom Base
                baseHandDistance.current = null
                baseCameraDistance.current = currentDist // Sync for next time

                const hand = results.landmarks[0]
                const tip = hand[8]
                
                // Map 0..1 to Screen Coordinates
                const x = (1 - tip.x) * window.innerWidth
                const y = tip.y * window.innerHeight
                
                // Smooth lerp
                smoothCursor.current.x = THREE.MathUtils.lerp(smoothCursor.current.x, x, 0.4)
                smoothCursor.current.y = THREE.MathUtils.lerp(smoothCursor.current.y, y, 0.4)
                
                // Direct DOM update
                if (cursorRef.current) {
                    cursorRef.current.style.opacity = '1'
                    cursorRef.current.style.left = `${smoothCursor.current.x}px`
                    cursorRef.current.style.top = `${smoothCursor.current.y}px`
                }
                
                // Rotation (Horizontal X)
                const centerX = 0.5
                let deltaX = (1 - tip.x) - centerX
                
                if (Math.abs(deltaX) < 0.1) {
                  deltaX = 0
                } else {
                  deltaX = Math.sign(deltaX) * (Math.abs(deltaX) - 0.1) / 0.4
                }
                
                setTargetRotationY(deltaX * 1.5) 
            }

          } else {
             // No hands
             baseHandDistance.current = null
          }
        } else {
          // Hide cursor
          if (cursorRef.current) {
             cursorRef.current.style.opacity = '0'
          }
          setTargetRotationY(0)
          baseHandDistance.current = null
        }
      }
      requestRef.current = requestAnimationFrame(detect)
    }

    detect()
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [recognizer, interactionMode, setMode, setTargetRotationY, setTargetDistance])

  if (interactionMode !== 'GESTURE') return null

  return (
    <>
      {/* Custom Cursor */}
      <div 
        ref={cursorRef}
        className={clsx(
          "fixed w-8 h-8 rounded-full border-2 border-hot-pink bg-white/20 backdrop-blur pointer-events-none z-[60] transition-opacity duration-200 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-0",
        )}
      >
        <div className="w-1 h-1 bg-white rounded-full" />
      </div>

      {/* Camera Preview */}
      <div className="fixed bottom-8 right-8 w-48 h-36 border border-white/20 rounded-2xl overflow-hidden z-50 bg-black/50 backdrop-blur shadow-2xl">
        {!loaded && <div className="absolute inset-0 flex items-center justify-center text-white text-xs">Loading AI...</div>}
        <Webcam
          ref={webcamRef}
          audio={false}
          mirrored={true}
          className="w-full h-full object-cover opacity-80"
          width={320}
          height={240}
        />
        <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-white/50 uppercase tracking-widest">
          Camera Active
        </div>
      </div>
    </>
  )
}
