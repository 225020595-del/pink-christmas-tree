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
  const togglePower = useStore((state) => state.togglePower)
  const power = useStore((state) => state.power)
  
  // Cursor State (Direct DOM manipulation for performance)
  const cursorRef = useRef<HTMLDivElement>(null)
  const smoothCursor = useRef(new THREE.Vector2(0, 0))
  const lastVideoTime = useRef(-1)
  const prevWristY = useRef(0)
  const lastPowerToggle = useRef(0)

  // Zoom State (Pinch & Drag)
  const isPinching = useRef(false)
  const pinchStartY = useRef<number>(0)
  const pinchStartDist = useRef<number>(12)
  const currentDistRef = useRef<number>(12)

  // Mode Switch Debounce
  const gestureHistory = useRef<string[]>([])
  
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
          numHands: 2,
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.6,
          minTrackingConfidence: 0.6
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
        
        let gestureName = ""
        if (results.gestures.length > 0) {
             gestureName = results.gestures[0][0].categoryName
        }

        if (results.landmarks.length > 0) {
            const hand = results.landmarks[0]
            const tipIndex = hand[8]
            const tipThumb = hand[4]
            const wrist = hand[0]

            // --- 0. POWER TOGGLE (Fist + Fast Down) ---
            // Calculate vertical velocity
            const vy = wrist.y - prevWristY.current
            prevWristY.current = wrist.y
            
            // Threshold for fast down movement (approx > 0.12 per 50ms is fast)
            // Need to calibrate. 0.05 is decent for 50ms.
            if (gestureName === 'Closed_Fist' && vy > 0.08 && now - lastPowerToggle.current > 2000) {
                togglePower()
                lastPowerToggle.current = now
                // Trigger visual feedback (maybe vibration or sound later)
            }
            
            // If Power is OFF, ignore other gestures except Power On
            if (!power) {
                // Still update cursor for feedback
                if (cursorRef.current) {
                   cursorRef.current.style.opacity = '0.5'
                   cursorRef.current.style.borderColor = '#333'
                }
                requestRef.current = requestAnimationFrame(detect)
                return
            }

            // --- 1. PINCH DETECTION (Thumb + Index distance) ---
            // Calculate distance in 3D (approx) or just 2D
            const dx = tipIndex.x - tipThumb.x
            const dy = tipIndex.y - tipThumb.y
            const pinchDist = Math.sqrt(dx*dx + dy*dy)
            
            // Threshold for pinch
            const isPinchingGesture = pinchDist < 0.05

            // --- 2. LOGIC ---
            // "Pointing" -> Rotation (Index extended, others curled? MediaPipe 'Pointing_Up' or similar)
            // But we can just check if Index is isolated? 
            // Let's stick to the requested logic:
            // "Pinch" -> Form Tree
            // "Open" -> Explode
            // "Pointing + Drag" -> Rotate
            
            // Detect Pointing Gesture manually or via MediaPipe
            // MediaPipe has 'Pointing_Up', but we want horizontal pointing too.
            // Let's check if Index is extended and others are curled.
            // Simple heuristic: Index Tip above Index PIP, others below PIP?
            // Or just trust "Pointing_Up" category if available?
            // Actually, let's use the cursor movement logic combined with gesture state.
            
            // Refined Logic based on User Request:
            
            if (gestureName === 'Pointing_Up' || gestureName === 'Victory') {
                 // ROTATION CONTROL
                 // Calculate horizontal movement from center or delta
                 const centerX = 0.5
                 let deltaX = (1 - tipIndex.x) - centerX
                 // Deadzone
                 if (Math.abs(deltaX) < 0.1) deltaX = 0
                 else deltaX = Math.sign(deltaX) * (Math.abs(deltaX) - 0.1) / 0.4
                 
                 setTargetRotationY(deltaX * 2.5) // Faster rotation
                 
                 if (cursorRef.current) {
                    cursorRef.current.style.borderColor = '#00FFFF' // Cyan for Rotate
                 }
            } else {
                 setTargetRotationY(0)
            }

            // FORM TREE (Pinch) vs EXPLODE (Open)
            // Use debounce history for stability
            gestureHistory.current.push(isPinchingGesture ? 'Pinch' : gestureName)
            if (gestureHistory.current.length > 10) gestureHistory.current.shift() // 0.5s buffer
            
            const isStablePinch = gestureHistory.current.every(g => g === 'Pinch')
            const isStableOpen = gestureHistory.current.every(g => g === 'Open_Palm')
            
            if (isStablePinch) {
                setMode('TREE')
                if (cursorRef.current) cursorRef.current.style.borderColor = '#FFD700' // Gold
            } else if (isStableOpen) {
                setMode('EXPLODE')
                if (cursorRef.current) cursorRef.current.style.borderColor = '#FF69B4' // Pink
            }

            // Cursor Follow
            const x = (1 - tipIndex.x) * window.innerWidth
            const y = tipIndex.y * window.innerHeight
            smoothCursor.current.x = THREE.MathUtils.lerp(smoothCursor.current.x, x, 0.4)
            smoothCursor.current.y = THREE.MathUtils.lerp(smoothCursor.current.y, y, 0.4)
            
            if (cursorRef.current) {
                cursorRef.current.style.opacity = '1'
                cursorRef.current.style.left = `${smoothCursor.current.x}px`
                cursorRef.current.style.top = `${smoothCursor.current.y}px`
            }
            
        } else {
            // No Hand
            setTargetRotationY(0)
            if (cursorRef.current) cursorRef.current.style.opacity = '0'
            gestureHistory.current = []
        }
      }
      requestRef.current = requestAnimationFrame(detect)
    }

    detect()
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [recognizer, interactionMode, setMode, setTargetRotationY, setTargetDistance, power, togglePower])

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
