'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  HandlingData,
  CalculatedTelemetry,
  calculateCalculatedStats
} from '../../lib/handling-calculator';
import {
  Gauge,
  Zap,
  Activity,
  Wind,
  Layers,
  Rotate3d,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Flag,
  Flame,
  Disc,
  Compass,
  TrendingUp,
  Sliders,
  Eye,
  Info,
  Car,
  Crosshair,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface TunerVisualizerProps {
  handlingData: HandlingData;
  vehicleModelName?: string;
}

type SimulationMode = 'drag' | 'skidpad' | 'dyno' | 'manual';
type CameraViewMode = 'orbit' | 'chase' | 'aerial' | 'suspension';

export const TunerVisualizer: React.FC<TunerVisualizerProps> = ({
  handlingData,
  vehicleModelName = 'Pegassi Ignus Custom'
}) => {
  // Telemetry Calculations
  const stats: CalculatedTelemetry = useMemo(
    () => calculateCalculatedStats(handlingData),
    [handlingData]
  );

  // Active Viewport Mode (3D Studio vs 2D MoTeC Instrument HUD vs Telemetry Graphs)
  const [viewportMode, setViewportMode] = useState<'3d' | '2d' | 'dyno'>('3d');
  const [simMode, setSimMode] = useState<SimulationMode>('drag');
  const [cameraView, setCameraView] = useState<CameraViewMode>('orbit');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [viewportSize, setViewportSize] = useState<'standard' | 'expanded' | 'tall'>('expanded');
  const viewportContainerRef = useRef<HTMLDivElement | null>(null);

  // 3D Capability Detection
  const [is3DSupported, setIs3DSupported] = useState<boolean | null>(null);
  const [webglErrorMessage, setWebglErrorMessage] = useState<string | null>(null);

  // Audio synthesis state (Web Audio API)
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);

  // Simulation Dynamics State
  const [simRunning, setSimRunning] = useState<boolean>(true);
  const [simSpeedMultiplier, setSimSpeedMultiplier] = useState<number>(1); // 0.5x, 1x, 2x

  // Real-time Vehicle Physical State in Simulator
  const [rpm, setRpm] = useState<number>(1000);
  const [currentGear, setCurrentGear] = useState<number>(1);
  const [speedMph, setSpeedMph] = useState<number>(0);
  const [distanceFt, setDistanceFt] = useState<number>(0);
  const [elapsedTimeSec, setElapsedTimeSec] = useState<number>(0);
  const [throttleInput, setThrottleInput] = useState<number>(0); // 0 to 1
  const [brakeInput, setBrakeInput] = useState<number>(0);       // 0 to 1
  const [steerAngle, setSteerAngle] = useState<number>(0);       // -35 to +35 deg
  const [handbrake, setHandbrake] = useState<boolean>(false);

  // Drag Timing Results
  const [drag0To60, setDrag0To60] = useState<number | null>(null);
  const [dragQuarterMile, setDragQuarterMile] = useState<number | null>(null);
  const [dragQuarterTrapSpeed, setDragQuarterTrapSpeed] = useState<number | null>(null);
  const [dragStage, setDragStage] = useState<'staging' | 'green' | 'finished'>('staging');

  // G-Force & 4-Corner Telemetry
  const [latG, setLatG] = useState<number>(0);
  const [lonG, setLonG] = useState<number>(0);
  const [brakeTemp, setBrakeTemp] = useState<number>(65); // in °C
  const [tireSlipFL, setTireSlipFL] = useState<number>(0);
  const [tireSlipFR, setTireSlipFR] = useState<number>(0);
  const [tireSlipRL, setTireSlipRL] = useState<number>(0);
  const [tireSlipRR, setTireSlipRR] = useState<number>(0);

  // 3D Orbit Camera angles & refs
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const rotXRef = useRef<number>(18);
  const rotYRef = useRef<number>(-35);
  const zoomRef = useRef<number>(1.0);
  const autoRotateRef = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchIntentRef = useRef<'scroll' | 'orbit' | null>(null);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1.0);
  const simTimeRef = useRef<number>(0);
  const pedalsRef = useRef<HTMLDivElement | null>(null);

  // Telemetry references for high-performance canvas loops
  const speedMphRef = useRef<number>(0);
  const distanceFtRef = useRef<number>(0);
  const elapsedTimeRef = useRef<number>(0);
  const lonGRef = useRef<number>(0);
  const latGRef = useRef<number>(0);
  const brakeTempRef = useRef<number>(65);
  const tireSlipFLRef = useRef<number>(0);
  const tireSlipFRRef = useRef<number>(0);
  const tireSlipRLRef = useRef<number>(0);
  const tireSlipRRRef = useRef<number>(0);
  const steerAngleRef = useRef<number>(0);
  const throttleInputRef = useRef<number>(0);
  const handlingDataRef = useRef<HandlingData>(handlingData);
  const statsRef = useRef(stats);
  const simSpeedMultiplierRef = useRef<number>(simSpeedMultiplier);

  // Sync refs when props or external states change
  useEffect(() => {
    handlingDataRef.current = handlingData;
    statsRef.current = stats;
  }, [handlingData, stats]);

  useEffect(() => {
    simSpeedMultiplierRef.current = simSpeedMultiplier;
  }, [simSpeedMultiplier]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  // Canvases
  const canvas3DRef = useRef<HTMLCanvasElement | null>(null);
  const canvas2DRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Key states for manual drive
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Check device WebGL capability
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const testCanvas = document.createElement('canvas');
      const gl =
        testCanvas.getContext('webgl2') ||
        testCanvas.getContext('webgl') ||
        testCanvas.getContext('experimental-webgl');
      if (gl) {
        setIs3DSupported(true);
        setWebglErrorMessage(null);
      } else {
        setIs3DSupported(false);
        setViewportMode('2d');
        setWebglErrorMessage('WebGL 3D graphics hardware acceleration is not supported on this device. Reverted to 2D MoTeC Instrument HUD.');
      }
    } catch (err) {
      setIs3DSupported(false);
      setViewportMode('2d');
      setWebglErrorMessage(err instanceof Error ? err.message : 'WebGL initialization failed.');
    }
  }, []);

  // Web Audio Synthesizer setup & teardown
  const initAudio = useCallback(() => {
    try {
      if (typeof window === 'undefined') return;
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        // Master gain
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.08, ctx.currentTime);
        masterGain.connect(ctx.destination);
        gainRef.current = masterGain;

        // Engine oscillator (Sawtooth + lowpass filter for V8/V10 rumble)
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);

        osc.connect(filter);
        filter.connect(masterGain);
        osc.start();
        oscRef.current = osc;

        // Noise buffer for tire screech
        const bufferSize = ctx.sampleRate * 1;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(2200, ctx.currentTime);
        noiseFilter.Q.setValueAtTime(3.0, ctx.currentTime);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, ctx.currentTime);

        whiteNoise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        whiteNoise.start();
        noiseGainRef.current = noiseGain;
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      setAudioEnabled(true);
    } catch (e) {
      console.warn('Web Audio could not be initialized:', e);
    }
  }, []);

  const toggleAudio = () => {
    if (!audioEnabled) {
      initAudio();
    } else {
      if (gainRef.current && audioCtxRef.current) {
        gainRef.current.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
      }
      setAudioEnabled(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  // Update audio pitch based on RPM and tire slip
  useEffect(() => {
    if (!audioEnabled || !audioCtxRef.current || !oscRef.current || !gainRef.current) return;
    const ctx = audioCtxRef.current;
    // Map RPM 1000-8500 to fundamental freq 60 - 320 Hz
    const freq = 55 + (rpm / 8500) * 260;
    oscRef.current.frequency.setTargetAtTime(freq, ctx.currentTime, 0.05);

    // Tire screech volume based on lateral G and slip
    if (noiseGainRef.current) {
      const maxSlip = Math.max(tireSlipFL, tireSlipFR, tireSlipRL, tireSlipRR, Math.abs(latG) > 0.8 ? 0.6 : 0);
      const targetGain = maxSlip > 0.25 ? Math.min(0.12, (maxSlip - 0.25) * 0.18) : 0;
      noiseGainRef.current.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.04);
    }
  }, [rpm, audioEnabled, latG, tireSlipFL, tireSlipFR, tireSlipRL, tireSlipRR]);

  // Keyboard controls listener for Manual Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(e.code)) {
        // Prevent page scroll when controlling vehicle
        if (simMode === 'manual') e.preventDefault();
      }
      keysPressed.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [simMode]);

  // Reset Drag / Test Run
  const handleResetSim = () => {
    setSpeedMph(0);
    setDistanceFt(0);
    setElapsedTimeSec(0);
    setRpm(1000);
    setCurrentGear(1);
    setDrag0To60(null);
    setDragQuarterMile(null);
    setDragQuarterTrapSpeed(null);
    setDragStage('staging');
    setBrakeTemp(65);
    setTireSlipFL(0);
    setTireSlipFR(0);
    setTireSlipRL(0);
    setTireSlipRR(0);
    setLatG(0);
    setLonG(0);
  };

  // Main Vehicle Physics Loop (60 Hz clock)
  useEffect(() => {
    if (!simRunning) return;

    let lastTime = performance.now();
    let simTime = 0;
    const maxGears = Math.max(4, Math.min(8, handlingData.nInitialDriveGears || 6));
    const mass = Math.max(800, handlingData.fMass || 1500);
    const driveForce = handlingData.fInitialDriveForce || 0.35;
    const dragCoeff = handlingData.fInitialDragCoeff || 8.0;
    const brakeForce = handlingData.fBrakeForce || 1.1;
    const tractionCurve = handlingData.fTractionCurveMax || 2.2;
    const driveBias = handlingData.fDriveBiasFront || 0.0; // 0 = RWD, 1 = FWD

    const interval = setInterval(() => {
      const now = performance.now();
      const rawDt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const dt = rawDt * simSpeedMultiplier;
      simTime += dt;

      // Handle Inputs based on active Simulation Mode
      let t = 0;
      let b = 0;
      let steer = 0;
      let hb = false;

      if (simMode === 'manual') {
        const k = keysPressed.current;
        if (k['KeyW'] || k['ArrowUp']) t = 1.0;
        if (k['KeyS'] || k['ArrowDown']) b = 1.0;
        if (k['KeyA'] || k['ArrowLeft']) steer = -28;
        if (k['KeyD'] || k['ArrowRight']) steer = 28;
        if (k['Space']) hb = true;
      } else if (simMode === 'drag') {
        // Automatic full-throttle launch through gears
        t = 1.0;
        b = 0;
        steer = Math.sin(simTime * 4.5) * 1.5; // steering correction scaled by sim speed
      } else if (simMode === 'skidpad') {
        // Continuous figure-8 slalom or circular skidpad
        t = 0.75 + Math.sin(simTime * 3.2) * 0.2;
        steer = Math.sin(simTime * 2.8) * 30; // oscillate left-right scaled by sim speed
        b = steer > 22 && Math.random() > 0.6 ? 0.4 : 0;
      } else if (simMode === 'dyno') {
        // Fixed chassis rolling dyno
        t = 1.0;
        b = 0;
        steer = 0;
      }

      setThrottleInput(t);
      setBrakeInput(b);
      setSteerAngle(steer);
      setHandbrake(hb);
      throttleInputRef.current = t;
      steerAngleRef.current = steer;

      // Gear ratios simulation
      const gearRatios = [3.8, 2.6, 1.9, 1.45, 1.15, 0.92, 0.78, 0.68].slice(0, maxGears);
      const finalDrive = 3.6;

      setSpeedMph((prevSpeed) => {
        let currentSpeed = prevSpeed;

        // Current Gear index & ratio
        let gear = 1;
        for (let g = 0; g < maxGears; g++) {
          const topSpeedInGear = (stats.estimatedTopSpeedMph / maxGears) * (g + 1) * 1.05;
          if (currentSpeed < topSpeedInGear || g === maxGears - 1) {
            gear = g + 1;
            break;
          }
        }
        setCurrentGear(gear);

        // RPM calculation based on speed, gear ratio, and idle floor
        const gearRatio = gearRatios[gear - 1] || 1.0;
        const wheelRpm = (currentSpeed * 5280 * 12) / (60 * Math.PI * 26); // 26" tire
        let targetRpm = Math.max(1000, wheelRpm * gearRatio * finalDrive);

        if (t > 0 && currentSpeed < 10) {
          // Launch clutch slip / burnout RPM
          targetRpm = Math.max(targetRpm, 4200 * (1 + driveForce));
        }
        if (targetRpm > 8500) targetRpm = 8500;
        setRpm(targetRpm);

        // Acceleration forces: Engine thrust vs Aero drag vs Braking
        const engineTorque = (driveForce * 1800 * (targetRpm / 5500) * gearRatio) / Math.max(1, mass / 1200);
        const aeroDrag = 0.5 * 1.225 * dragCoeff * 0.05 * Math.pow(currentSpeed * 0.44704, 2);
        const brakeDeccel = b * brakeForce * 22 + (hb ? 14 : 0);

        let netAccelerationMps2 = (t * engineTorque - aeroDrag) / (mass * 0.08);
        if (b > 0 || hb) {
          netAccelerationMps2 -= brakeDeccel;
        }

        // Longitudinal G calculation
        const calculatedLonG = netAccelerationMps2 / 9.81;
        const lonGVal = parseFloat(calculatedLonG.toFixed(2));
        lonGRef.current = lonGVal;
        setLonG(lonGVal);

        let newSpeedMps = (currentSpeed * 0.44704) + netAccelerationMps2 * dt;
        if (newSpeedMps < 0) newSpeedMps = 0;
        let newSpeedMph = newSpeedMps / 0.44704;

        // Cap at top speed
        if (newSpeedMph > stats.estimatedTopSpeedMph) {
          newSpeedMph = stats.estimatedTopSpeedMph;
        }

        const finalSpeedMph = parseFloat(newSpeedMph.toFixed(1));
        speedMphRef.current = finalSpeedMph;

        // Distance & Elapsed Time update
        setElapsedTimeSec((prev) => {
          const nextTime = prev + dt;
          elapsedTimeRef.current = nextTime;
          // Check 0-60
          if (newSpeedMph >= 60 && prevSpeed < 60) {
            setDrag0To60(parseFloat(nextTime.toFixed(2)));
          }
          return parseFloat(nextTime.toFixed(2));
        });

        setDistanceFt((prevDist) => {
          const deltaFt = (newSpeedMph * 5280 / 3600) * dt;
          const nextDist = prevDist + deltaFt;
          distanceFtRef.current = nextDist;
          // Check Quarter Mile (1320 ft)
          if (nextDist >= 1320 && prevDist < 1320) {
            setDragQuarterMile(parseFloat(elapsedTimeRef.current.toFixed(2)));
            setDragQuarterTrapSpeed(Math.round(newSpeedMph));
            setDragStage('finished');
          }
          return Math.round(nextDist);
        });

        // Lateral G & 4-Wheel Slip Angles
        const turnRadius = Math.max(12, 180 / Math.max(1, Math.abs(steer)));
        const centripetalG = Math.pow(newSpeedMps, 2) / (turnRadius * 9.81);
        const signedLatG = (steer >= 0 ? 1 : -1) * Math.min(stats.corneringGForce * 1.25, centripetalG);
        const latGVal = parseFloat(signedLatG.toFixed(2));
        latGRef.current = latGVal;
        setLatG(latGVal);

        // Tire slip calculation
        const isRearSliding = Math.abs(signedLatG) > stats.corneringGForce * 0.85 || hb;
        const frontSlip = Math.min(1.0, (Math.abs(steer) / 35) * (1 - driveBias * 0.3));
        const rearSlip = isRearSliding ? Math.min(1.0, 0.4 + (1 - driveBias) * 0.6) : 0.05;

        const flVal = parseFloat(frontSlip.toFixed(2));
        const frVal = parseFloat(frontSlip.toFixed(2));
        const rlVal = parseFloat(rearSlip.toFixed(2));
        const rrVal = parseFloat(rearSlip.toFixed(2));
        tireSlipFLRef.current = flVal;
        tireSlipFRRef.current = frVal;
        tireSlipRLRef.current = rlVal;
        tireSlipRRRef.current = rrVal;

        setTireSlipFL(flVal);
        setTireSlipFR(frVal);
        setTireSlipRL(rlVal);
        setTireSlipRR(rrVal);

        // Brake rotor temperature heating/cooling
        setBrakeTemp((prevTemp) => {
          let updatedTemp = prevTemp;
          if (b > 0) {
            updatedTemp = Math.min(780, prevTemp + b * brakeForce * 2.8);
          } else {
            updatedTemp = Math.max(65, prevTemp - 0.4);
          }
          brakeTempRef.current = updatedTemp;
          return updatedTemp;
        });

        return finalSpeedMph;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [simRunning, simMode, simSpeedMultiplier, handlingData, stats]);

  // Orbit camera presets
  useEffect(() => {
    if (cameraView === 'orbit') {
      rotXRef.current = 18;
      rotYRef.current = -35;
      zoomRef.current = 1.0;
      setZoomLevel(1.0);
    } else if (cameraView === 'chase') {
      rotXRef.current = 8;
      rotYRef.current = 180;
      zoomRef.current = 1.1;
      setZoomLevel(1.1);
    } else if (cameraView === 'aerial') {
      rotXRef.current = 75;
      rotYRef.current = 0;
      zoomRef.current = 0.9;
      setZoomLevel(0.9);
    } else if (cameraView === 'suspension') {
      rotXRef.current = 12;
      rotYRef.current = -85;
      zoomRef.current = 1.4;
      setZoomLevel(1.4);
    }
  }, [cameraView]);

  // 3D Canvas Rendering Engine (Faceted Lit Supercar + Track + Suspension + Smoke + Aero Streamlines)
  useEffect(() => {
    if (viewportMode !== '3d' || !is3DSupported) return;
    const canvas = canvas3DRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    // Particle pool for tire smoke and exhaust sparks
    const particles: { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; maxLife: number; color: string; size: number }[] = [];

    const render3D = () => {
      time += 0.035 * simSpeedMultiplierRef.current;
      if (autoRotateRef.current && !isDraggingRef.current) {
        rotYRef.current = (rotYRef.current + 0.35 * simSpeedMultiplierRef.current) % 360;
      }

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2 + 25;

      const radX = (rotXRef.current * Math.PI) / 180;
      const radY = (rotYRef.current * Math.PI) / 180;

      const project3D = (x: number, y: number, z: number) => {
        // Rotate Y
        const x1 = x * Math.cos(radY) + z * Math.sin(radY);
        const z1 = -x * Math.sin(radY) + z * Math.cos(radY);
        // Rotate X
        const y2 = y * Math.cos(radX) - z1 * Math.sin(radX);
        const z2 = y * Math.sin(radX) + z1 * Math.cos(radX);

        const baseFov = 520;
        const perspective = baseFov / (baseFov + z2 + 300);
        const scale = perspective * 1.65 * zoomRef.current;
        return {
          px: cx + x1 * scale,
          py: cy + y2 * scale,
          scale,
          depth: z2
        };
      };

      // 1. Perspective Neon Grid Floor & Runway Markings
      ctx.save();
      ctx.lineWidth = 1;
      const gridSpan = 220;
      const gridStep = 40;

      // Draw perspective asphalt runway with grid lines
      for (let gx = -gridSpan; gx <= gridSpan; gx += gridStep) {
        const pStart = project3D(gx, 55, -gridSpan);
        const pEnd = project3D(gx, 55, gridSpan);
        ctx.strokeStyle = gx === 0 ? 'rgba(236, 72, 153, 0.4)' : 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.moveTo(pStart.px, pStart.py);
        ctx.lineTo(pEnd.px, pEnd.py);
        ctx.stroke();
      }

      for (let gz = -gridSpan; gz <= gridSpan; gz += gridStep) {
        const pStart = project3D(-gridSpan, 55, gz);
        const pEnd = project3D(gridSpan, 55, gz);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.moveTo(pStart.px, pStart.py);
        ctx.lineTo(pEnd.px, pEnd.py);
        ctx.stroke();
      }

      // Track distance runway markers scrolling by if moving
      const roadOffset = (distanceFt * 4) % 80;
      for (let rz = -200 + roadOffset; rz <= 200; rz += 80) {
        const pLeft = project3D(-55, 54, rz);
        const pRight = project3D(55, 54, rz);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pLeft.px, pLeft.py);
        ctx.lineTo(pLeft.px + 10 * pLeft.scale, pLeft.py);
        ctx.moveTo(pRight.px, pRight.py);
        ctx.lineTo(pRight.px - 10 * pRight.scale, pRight.py);
        ctx.stroke();
      }

      // Under-Car Neon Ground Glow (Color matches drive layout: Pink=RWD, Sky=AWD, Emerald=FWD)
      const isAwd = handlingData.fDriveBiasFront > 0.05 && handlingData.fDriveBiasFront < 0.95;
      const isRwd = handlingData.fDriveBiasFront <= 0.05;
      const themeColor = isRwd ? '#EC4899' : isAwd ? '#38BDF8' : '#10B981';

      const pGroundShadow = project3D(0, 54, 0);
      const gradGlow = ctx.createRadialGradient(
        pGroundShadow.px,
        pGroundShadow.py,
        10 * pGroundShadow.scale,
        pGroundShadow.px,
        pGroundShadow.py,
        90 * pGroundShadow.scale
      );
      gradGlow.addColorStop(0, isRwd ? 'rgba(236, 72, 153, 0.45)' : isAwd ? 'rgba(56, 189, 248, 0.45)' : 'rgba(16, 185, 129, 0.45)');
      gradGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradGlow;
      ctx.beginPath();
      ctx.arc(pGroundShadow.px, pGroundShadow.py, 90 * pGroundShadow.scale, 0, Math.PI * 2);
      ctx.fill();

      // Dynamic Pitch (squat/dive) & Roll (cornering lean)
      const suspK = Math.max(1.0, handlingData.fSuspensionForce || 2.0);
      const pitchSquat = (lonG * 6.5) / suspK;
      const rollLean = (latG * 8.5) / suspK;
      const rideHeightOffset = (3.0 - suspK) * 5;

      // Aerodynamic Wind Streamline Particles
      const streamCount = 28;
      for (let i = 0; i < streamCount; i++) {
        const offset = ((time * 160 * (0.3 + speedMph * 0.02) + i * 28) % 360) - 180;
        const laneY = -25 + (i % 6) * 11 + rideHeightOffset;
        const laneZ = -46 + Math.floor(i / 6) * 23;
        const pStart = project3D(-160 + offset, laneY, laneZ);
        const pEnd = project3D(-110 + offset, laneY, laneZ);

        const alpha = Math.max(0, 0.55 - Math.abs(offset) / 190);
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
        ctx.lineWidth = 1.6 * pStart.scale;
        ctx.beginPath();
        ctx.moveTo(pStart.px, pStart.py);
        ctx.lineTo(pEnd.px, pEnd.py);
        ctx.stroke();
      }

      // Tire Smoke Generation on Burnout / High Slip
      const totalSlip = tireSlipRL + tireSlipRR + (tireSlipFL > 0.4 ? 0.3 : 0);
      if (totalSlip > 0.3 && particles.length < 90) {
        for (let s = 0; s < 3; s++) {
          particles.push({
            x: 48 + (Math.random() - 0.5) * 10,
            y: 48 + rideHeightOffset,
            z: (s % 2 === 0 ? -32 : 32) + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.2) * 2 + (speedMph * 0.05),
            vy: -Math.random() * 1.5 - 0.5,
            vz: (Math.random() - 0.5) * 1.8,
            life: 1.0,
            maxLife: 1.0,
            color: 'rgba(240, 240, 255,',
            size: 6 + Math.random() * 8
          });
        }
      }

      // Update and draw particles
      for (let pIdx = particles.length - 1; pIdx >= 0; pIdx--) {
        const p = particles[pIdx];
        p.x += p.vx * simSpeedMultiplierRef.current;
        p.y += p.vy * simSpeedMultiplierRef.current;
        p.z += p.vz * simSpeedMultiplierRef.current;
        p.life -= 0.025 * simSpeedMultiplierRef.current;

        if (p.life <= 0) {
          particles.splice(pIdx, 1);
          continue;
        }

        const proj = project3D(p.x, p.y, p.z);
        ctx.fillStyle = `${p.color} ${p.life * 0.45})`;
        ctx.beginPath();
        ctx.arc(proj.px, proj.py, p.size * (1.5 - p.life) * proj.scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3D Chassis Node Geometry
      const carLength = 144;
      const carWidth = 66;
      const carHeight = 34;

      const nodes = [
        // Front Splitter [0, 1]
        { x: -carLength / 2 - 6, y: 40 + pitchSquat + rideHeightOffset, z: -carWidth / 2 + 2 },
        { x: -carLength / 2 - 6, y: 40 + pitchSquat + rideHeightOffset, z: carWidth / 2 - 2 },
        // Front Hood Nose [2, 3]
        { x: -carLength / 2 + 10, y: 22 + pitchSquat + rideHeightOffset, z: -carWidth / 2 + 6 },
        { x: -carLength / 2 + 10, y: 22 + pitchSquat + rideHeightOffset, z: carWidth / 2 - 6 },
        // Base of Windshield [4, 5]
        { x: -18, y: 8 + pitchSquat * 0.4 + rideHeightOffset, z: -carWidth / 2 + 4 },
        { x: -18, y: 8 + pitchSquat * 0.4 + rideHeightOffset, z: carWidth / 2 - 4 },
        // Roof Canopy Peak [6, 7]
        { x: 12, y: -carHeight + rollLean + rideHeightOffset, z: -carWidth / 2 + 10 },
        { x: 12, y: -carHeight - rollLean + rideHeightOffset, z: carWidth / 2 - 10 },
        // Rear Window Base / Engine Deck [8, 9]
        { x: 52, y: 4 - pitchSquat * 0.4 + rideHeightOffset, z: -carWidth / 2 + 5 },
        { x: 52, y: 4 - pitchSquat * 0.4 + rideHeightOffset, z: carWidth / 2 - 5 },
        // Rear Spoiler Wing [10, 11]
        { x: carLength / 2 + 2, y: -12 - pitchSquat + rideHeightOffset, z: -carWidth / 2 },
        { x: carLength / 2 + 2, y: -12 - pitchSquat + rideHeightOffset, z: carWidth / 2 },
        // Rear Diffuser Bumper [12, 13]
        { x: carLength / 2 + 4, y: 38 - pitchSquat + rideHeightOffset, z: -carWidth / 2 + 3 },
        { x: carLength / 2 + 4, y: 38 - pitchSquat + rideHeightOffset, z: carWidth / 2 - 3 }
      ];

      const proj = nodes.map((n) => project3D(n.x, n.y, n.z));

      // Draw Faceted Lit Body Panels (Solid semi-transparent faces + Glowing Neon Edges)
      const drawPanel = (idxA: number, idxB: number, idxC: number, idxD: number, fillColor: string) => {
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.moveTo(proj[idxA].px, proj[idxA].py);
        ctx.lineTo(proj[idxB].px, proj[idxB].py);
        ctx.lineTo(proj[idxC].px, proj[idxC].py);
        ctx.lineTo(proj[idxD].px, proj[idxD].py);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      };

      ctx.shadowColor = themeColor;
      ctx.shadowBlur = 10;

      // Hood Panel
      drawPanel(0, 1, 3, 2, 'rgba(24, 24, 27, 0.85)');
      drawPanel(2, 3, 5, 4, 'rgba(39, 39, 42, 0.9)');
      // Windshield & Glass Cockpit
      drawPanel(4, 5, 7, 6, 'rgba(56, 189, 248, 0.22)');
      // Engine Deck / Louvers
      drawPanel(6, 7, 9, 8, 'rgba(24, 24, 27, 0.85)');
      // Rear Wing
      drawPanel(8, 9, 11, 10, 'rgba(15, 23, 42, 0.95)');
      // Rear Bumper & Diffuser
      drawPanel(10, 11, 13, 12, 'rgba(24, 24, 27, 0.9)');

      // Headlight Lumens
      const pHeadL = project3D(-carLength / 2 - 2, 28 + pitchSquat + rideHeightOffset, -carWidth / 2 + 8);
      const pHeadR = project3D(-carLength / 2 - 2, 28 + pitchSquat + rideHeightOffset, carWidth / 2 - 8);
      ctx.fillStyle = '#38BDF8';
      ctx.shadowColor = '#38BDF8';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(pHeadL.px, pHeadL.py, 3.5 * pHeadL.scale, 0, Math.PI * 2);
      ctx.arc(pHeadR.px, pHeadR.py, 3.5 * pHeadR.scale, 0, Math.PI * 2);
      ctx.fill();

      // Taillight Neon Lightbar
      const pTailL = project3D(carLength / 2 + 3, 18 - pitchSquat + rideHeightOffset, -carWidth / 2 + 6);
      const pTailR = project3D(carLength / 2 + 3, 18 - pitchSquat + rideHeightOffset, carWidth / 2 - 6);
      ctx.strokeStyle = '#EF4444';
      ctx.shadowColor = '#EF4444';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 3 * pTailL.scale;
      ctx.beginPath();
      ctx.moveTo(pTailL.px, pTailL.py);
      ctx.lineTo(pTailR.px, pTailR.py);
      ctx.stroke();

      // 4 Wheels with Suspensions, Rims & Thermal Glowing Brake Rotors
      const wheelDefs = [
        { x: -44, y: 46 + pitchSquat + rideHeightOffset, z: -carWidth / 2 - 5, isFront: true, slip: tireSlipFLRef.current },
        { x: -44, y: 46 + pitchSquat + rideHeightOffset, z: carWidth / 2 + 5, isFront: true, slip: tireSlipFRRef.current },
        { x: 44, y: 46 - pitchSquat + rideHeightOffset, z: -carWidth / 2 - 5, isFront: false, slip: tireSlipRLRef.current },
        { x: 44, y: 46 - pitchSquat + rideHeightOffset, z: carWidth / 2 + 5, isFront: false, slip: tireSlipRRRef.current }
      ];

      wheelDefs.forEach((w) => {
        const pWheel = project3D(w.x, w.y, w.z);
        const pMount = project3D(w.x, w.y - 14 * suspK, w.z);

        // Suspension Damper Spring
        ctx.strokeStyle = '#F59E0B';
        ctx.shadowColor = '#F59E0B';
        ctx.shadowBlur = 6;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(pMount.px, pMount.py);
        ctx.lineTo(pWheel.px, pWheel.py);
        ctx.stroke();

        // Brake Rotor Thermal Glow
        const currBrakeTemp = brakeTempRef.current;
        const rotorGlow = currBrakeTemp > 300 ? '#F97316' : currBrakeTemp > 180 ? '#EF4444' : '#71717A';
        ctx.fillStyle = rotorGlow;
        ctx.shadowColor = rotorGlow;
        ctx.shadowBlur = currBrakeTemp > 250 ? 10 : 2;
        ctx.beginPath();
        ctx.arc(pWheel.px, pWheel.py, 5.5 * pWheel.scale, 0, Math.PI * 2);
        ctx.fill();

        // Outer Tire Rim
        ctx.fillStyle = '#09090b';
        ctx.strokeStyle = w.slip > 0.3 ? '#EF4444' : w.isFront && handlingDataRef.current.fDriveBiasFront > 0.1 ? '#38BDF8' : '#EC4899';
        ctx.lineWidth = 3 * pWheel.scale;
        ctx.beginPath();
        ctx.arc(pWheel.px, pWheel.py, 10.5 * pWheel.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render3D);
    };

    render3D();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [viewportMode, is3DSupported]);

  // 2D MoTeC Instrument HUD & Kamm's Friction Circle Canvas
  useEffect(() => {
    if (viewportMode !== '2d') return;
    const canvas = canvas2DRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const render2D = () => {
      time += 0.03;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // MoTeC Race Dash Layout: Split into 3 sections (Tachometer/G-Meter/4-Corner Chassis)
      const cx = width / 2;
      const cy = height / 2;

      // 1. Top-Down Chassis Wireframe with Steer Angles & Dynamic Torque Vectors
      const carW = 68;
      const carL = 136;
      ctx.save();
      ctx.translate(cx - 140, cy);

      // Chassis Body
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#38BDF8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(-carW / 2, -carL / 2, carW, carL, 14);
      ctx.fill();
      ctx.stroke();

      // Front & Rear Axle Lines
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.moveTo(-carW / 2 - 10, -carL / 2 + 25);
      ctx.lineTo(carW / 2 + 10, -carL / 2 + 25);
      ctx.moveTo(-carW / 2 - 10, carL / 2 - 25);
      ctx.lineTo(carW / 2 + 10, carL / 2 - 25);
      ctx.stroke();

      // Draw 4 Steerable Wheels with Thermal Color
      const drawWheel2D = (wx: number, wy: number, angle: number, slip: number, isDrive: boolean) => {
        ctx.save();
        ctx.translate(wx, wy);
        ctx.rotate((angle * Math.PI) / 180);

        ctx.fillStyle = slip > 0.4 ? '#EF4444' : isDrive ? '#38BDF8' : '#18181B';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-6, -14, 12, 28, 4);
        ctx.fill();
        ctx.stroke();

        // Vector arrow showing power delivery
        const currentThrottle = throttleInputRef.current;
        if (isDrive && currentThrottle > 0) {
          ctx.strokeStyle = '#10B981';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -16 - currentThrottle * 16);
          ctx.stroke();
        }
        ctx.restore();
      };

      const hData = handlingDataRef.current;
      const hasFrontDrive = hData.fDriveBiasFront > 0.05;
      const hasRearDrive = hData.fDriveBiasFront < 0.95;

      const steer = steerAngleRef.current;
      drawWheel2D(-carW / 2 - 6, -carL / 2 + 25, steer, tireSlipFLRef.current, hasFrontDrive);
      drawWheel2D(carW / 2 + 6, -carL / 2 + 25, steer, tireSlipFRRef.current, hasFrontDrive);
      drawWheel2D(-carW / 2 - 6, carL / 2 - 25, 0, tireSlipRLRef.current, hasRearDrive);
      drawWheel2D(carW / 2 + 6, carL / 2 - 25, 0, tireSlipRRRef.current, hasRearDrive);

      // Center of Mass vector
      ctx.fillStyle = '#F59E0B';
      ctx.shadowColor = '#F59E0B';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Center: Kamm's Friction Ellipse / G-G Diagram
      const gCx = cx + 130;
      const gCy = cy;
      const maxGVisualRadius = 65;
      const maxTractionG = statsRef.current.corneringGForce;

      ctx.save();
      ctx.translate(gCx, gCy);

      // Concentric 0.5G, 1.0G, 1.5G circles
      [0.33, 0.66, 1.0].forEach((ratio, idx) => {
        ctx.strokeStyle = idx === 2 ? 'rgba(236, 72, 153, 0.4)' : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, maxGVisualRadius * ratio, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Axis crosshairs
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(-maxGVisualRadius - 10, 0);
      ctx.lineTo(maxGVisualRadius + 10, 0);
      ctx.moveTo(0, -maxGVisualRadius - 10);
      ctx.lineTo(0, maxGVisualRadius + 10);
      ctx.stroke();

      // Current G-Ball position
      const gScale = maxGVisualRadius / Math.max(1.2, maxTractionG);
      const ballX = latGRef.current * gScale;
      const ballY = -lonGRef.current * gScale;

      ctx.fillStyle = '#EC4899';
      ctx.shadowColor = '#EC4899';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(ballX, ballY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Trail line from origin to ball
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(ballX, ballY);
      ctx.stroke();

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render2D);
    };

    render2D();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [viewportMode]);

  // Mouse & Touch Orbit Drag Handlers for 3D Viewport
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    rotYRef.current = (rotYRef.current + dx * 0.75) % 360;
    rotXRef.current = Math.max(-60, Math.min(80, rotXRef.current + dy * 0.75));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      touchIntentRef.current = null;
      isDraggingRef.current = false;
      setIsDragging(false);
      pinchStartDistRef.current = null;
    } else if (e.touches.length === 2) {
      touchIntentRef.current = 'orbit';
      isDraggingRef.current = false;
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartDistRef.current = dist;
      pinchStartZoomRef.current = zoomRef.current;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const clientX = e.touches[0].clientX;
      const clientY = e.touches[0].clientY;
      const totalDx = Math.abs(clientX - touchStartPos.current.x);
      const totalDy = Math.abs(clientY - touchStartPos.current.y);

      // Determine intent on initial touch movement:
      // If user swipes vertically (totalDy > totalDx), allow natural native page / container scrolling!
      if (touchIntentRef.current === null) {
        if (totalDy > 6 && totalDy > totalDx) {
          touchIntentRef.current = 'scroll';
          isDraggingRef.current = false;
          setIsDragging(false);
          return;
        } else if (totalDx > 6) {
          touchIntentRef.current = 'orbit';
          isDraggingRef.current = true;
          setIsDragging(true);
        } else {
          return;
        }
      }

      // If vertical scroll intent was detected, do not intercept gesture - allow native scrolling!
      if (touchIntentRef.current === 'scroll') {
        return;
      }

      if (isDraggingRef.current) {
        const dx = clientX - lastMousePos.current.x;
        rotYRef.current = (rotYRef.current + dx * 0.75) % 360;
        lastMousePos.current = { x: clientX, y: clientY };
      }
    } else if (e.touches.length === 2 && pinchStartDistRef.current !== null && pinchStartDistRef.current > 0) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDist / pinchStartDistRef.current;
      const nextZoom = Math.max(0.35, Math.min(2.8, Number((pinchStartZoomRef.current * ratio).toFixed(2))));
      zoomRef.current = nextZoom;
      setZoomLevel(nextZoom);
    }
  };

  const handleTouchEnd = () => {
    touchIntentRef.current = null;
    isDraggingRef.current = false;
    setIsDragging(false);
    pinchStartDistRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    // Only capture zoom if holding Ctrl or Meta key (CAD / maps standard),
    // otherwise allow free natural page/container scrolling so the user can easily reach controls below!
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.0018;
      const nextZoom = Math.max(0.35, Math.min(2.8, Number((zoomRef.current + delta).toFixed(2))));
      zoomRef.current = nextZoom;
      setZoomLevel(nextZoom);
    }
  };

  const handleZoomIn = () => {
    const nextZoom = Math.min(2.8, Number((zoomRef.current + 0.25).toFixed(2)));
    zoomRef.current = nextZoom;
    setZoomLevel(nextZoom);
  };

  const handleZoomOut = () => {
    const nextZoom = Math.max(0.35, Number((zoomRef.current - 0.25).toFixed(2)));
    zoomRef.current = nextZoom;
    setZoomLevel(nextZoom);
  };

  const handleResetZoom = () => {
    zoomRef.current = 1.0;
    setZoomLevel(1.0);
  };

  // Viewport Height classes based on standard / expanded / tall sizing
  const viewportHeightClass = useMemo(() => {
    if (isFullscreen) {
      return 'h-[calc(100vh-280px)] min-h-[520px]';
    }
    switch (viewportSize) {
      case 'standard':
        return 'h-[380px] sm:h-[420px] md:h-[460px]';
      case 'tall':
        return 'h-[520px] sm:h-[600px] md:h-[680px] lg:h-[720px]';
      case 'expanded':
      default:
        // Increased screen size with generous vertical and horizontal stage
        return 'h-[440px] sm:h-[500px] md:h-[560px] lg:h-[600px]';
    }
  }, [isFullscreen, viewportSize]);

  // Keep canvas width and height synchronized with the container's rendered box
  useEffect(() => {
    const el = viewportContainerRef.current;
    if (!el) return;

    const updateCanvasSize = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (w > 0 && h > 0) {
        if (canvas3DRef.current && (canvas3DRef.current.width !== w || canvas3DRef.current.height !== h)) {
          canvas3DRef.current.width = w;
          canvas3DRef.current.height = h;
        }
        if (canvas2DRef.current && (canvas2DRef.current.width !== w || canvas2DRef.current.height !== h)) {
          canvas2DRef.current.width = w;
          canvas2DRef.current.height = h;
        }
      }
    };

    updateCanvasSize();
    const ro = new ResizeObserver(() => {
      updateCanvasSize();
    });
    ro.observe(el);

    return () => ro.disconnect();
  }, [viewportMode, isFullscreen, viewportSize]);

  // Handle document body overflow lock when in Fullscreen mode
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col gap-4 text-white transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-zinc-950 p-4 sm:p-6 pb-32 sm:pb-40 overflow-y-auto overscroll-y-contain touch-pan-y'
          : ''
      }`}
      style={isFullscreen ? { WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' } : undefined}
    >
      {/* Top Telemetry Metric Ribbons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Top Speed */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 shadow-lg flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
            <span className="truncate">Top Speed</span>
            <Gauge className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          </div>
          <div className="mt-1.5">
            <div className="text-xl font-black text-rose-400 font-mono tracking-tight flex items-baseline gap-1">
              <span>{stats.estimatedTopSpeedMph}</span>
              <span className="text-[10px] text-zinc-500 font-normal font-sans">MPH</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono truncate">
              {stats.estimatedTopSpeedKph} km/h
            </div>
          </div>
        </div>

        {/* 0-60 Launch */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 shadow-lg flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
            <span className="truncate">0-60 Sprint</span>
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          </div>
          <div className="mt-1.5">
            <div className="text-xl font-black text-amber-400 font-mono tracking-tight flex items-baseline gap-1">
              <span>{drag0To60 ? drag0To60 : stats.zeroToSixtySec}</span>
              <span className="text-[10px] text-zinc-500 font-normal font-sans">sec</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono truncate">
              1/4m: {dragQuarterMile ? `${dragQuarterMile}s` : `${stats.quarterMileSec}s`}
            </div>
          </div>
        </div>

        {/* Cornering G-Force */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 shadow-lg flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
            <span className="truncate">Lateral Grip</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          </div>
          <div className="mt-1.5">
            <div className="text-xl font-black text-emerald-400 font-mono tracking-tight flex items-baseline gap-1">
              <span>{Math.abs(latG) > 0 ? Math.abs(latG).toFixed(2) : stats.corneringGForce}</span>
              <span className="text-[10px] text-zinc-500 font-normal font-sans">G</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono truncate">
              Peak: {stats.corneringGForce}G
            </div>
          </div>
        </div>

        {/* Drivetrain Bias */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 shadow-lg flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
            <span className="truncate">Drivetrain</span>
            <Layers className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          </div>
          <div className="mt-1.5">
            <div className="text-lg sm:text-xl font-black text-sky-300 font-mono truncate">
              {stats.driveBiasLabel}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono truncate">
              F: {Math.round(handlingData.fDriveBiasFront * 100)}% / R: {Math.round((1 - handlingData.fDriveBiasFront) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Main Viewport & Simulation Stage */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden flex flex-col gap-4">
        {/* Consolidated Viewport Control Toolbar */}
        <div className="flex flex-col gap-2.5 pb-3 border-b border-zinc-800">
          {/* Top Bar: Viewport Switcher, Test Modes, and Action Cluster */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
            {/* Left: Viewport Mode Tabs */}
            <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl overflow-x-auto">
              <button
                type="button"
                onClick={() => {
                  if (is3DSupported !== false) setViewportMode('3d');
                }}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-center min-h-[38px] min-w-[95px] flex-1 sm:flex-initial ${
                  viewportMode === '3d'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Rotate3d className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">3D WebGL</span>
              </button>

              <button
                type="button"
                onClick={() => setViewportMode('2d')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-center min-h-[38px] min-w-[95px] flex-1 sm:flex-initial ${
                  viewportMode === '2d'
                    ? 'bg-sky-500 text-black shadow-md font-extrabold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">2D MoTeC</span>
              </button>

              <button
                type="button"
                onClick={() => setViewportMode('dyno')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-center min-h-[38px] min-w-[85px] flex-1 sm:flex-initial ${
                  viewportMode === 'dyno'
                    ? 'bg-amber-500 text-black shadow-md font-extrabold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">Dyno</span>
              </button>
            </div>

            {/* Right: Simulation Modes & Action Controls */}
            <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
              {/* Simulation Mode Selector */}
              <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 p-1 rounded-xl text-xs flex-1 sm:flex-initial">
                <button
                  type="button"
                  onClick={() => {
                    setSimMode('drag');
                    handleResetSim();
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs min-h-[34px] flex-1 sm:flex-initial text-center ${
                    simMode === 'drag' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  1/4 Drag
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimMode('skidpad');
                    handleResetSim();
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs min-h-[34px] flex-1 sm:flex-initial text-center ${
                    simMode === 'skidpad' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Skidpad
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimMode('manual');
                    handleResetSim();
                    setTimeout(() => {
                      pedalsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 120);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs min-h-[34px] flex-1 sm:flex-initial text-center ${
                    simMode === 'manual' ? 'bg-emerald-500 text-black font-extrabold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  🎮 Drive
                </button>
              </div>

              {/* Action Buttons Cluster */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={toggleAudio}
                  title={audioEnabled ? 'Mute Engine Audio' : 'Enable Engine & Tire Sound FX'}
                  className={`w-9 h-9 rounded-xl border transition flex items-center justify-center cursor-pointer active:scale-95 ${
                    audioEnabled
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-850'
                  }`}
                >
                  {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSimRunning((prev) => !prev)}
                  title={simRunning ? 'Pause Simulation' : 'Resume Simulation'}
                  className="w-9 h-9 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl transition flex items-center justify-center cursor-pointer active:scale-95"
                >
                  {simRunning ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
                </button>

                <button
                  type="button"
                  onClick={handleResetSim}
                  title="Reset Run Telemetry"
                  className="w-9 h-9 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition flex items-center justify-center cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Viewport Screen Size Preset Selector */}
                {!isFullscreen && (
                  <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-0.5 text-[10px] font-mono h-9">
                    <button
                      type="button"
                      onClick={() => setViewportSize('standard')}
                      title="Standard Viewport Height (460px)"
                      className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                        viewportSize === 'standard' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Std
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewportSize('expanded')}
                      title="Expanded Viewport Height (Default 560px-600px)"
                      className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                        viewportSize === 'expanded' ? 'bg-rose-600 text-white font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Large
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewportSize('tall')}
                      title="Theater / Tall Viewport Height (680px-720px)"
                      className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                        viewportSize === 'tall' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Tall
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsFullscreen((prev) => !prev)}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Expand Viewport Fullscreen'}
                  className="w-9 h-9 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition flex items-center justify-center cursor-pointer active:scale-95"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* WebGL Failure / Revert Notification */}
        {webglErrorMessage && viewportMode === '3d' && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-start gap-2.5 text-xs text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">{webglErrorMessage}</span>
            </div>
          </div>
        )}

        {/* 3D Camera Angles & Turntable Bar (Only in 3D Mode) */}
        {viewportMode === '3d' && is3DSupported && (
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800/80 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-zinc-400 font-bold text-[10px] sm:text-[11px] uppercase tracking-wider mr-1">Camera:</span>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setCameraView('orbit')}
                  className={`px-3 py-1.5 rounded-lg font-mono font-bold transition cursor-pointer text-xs min-h-[32px] ${
                    cameraView === 'orbit' ? 'bg-rose-600 text-white shadow-sm' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  Orbit 3/4
                </button>
                <button
                  type="button"
                  onClick={() => setCameraView('chase')}
                  className={`px-3 py-1.5 rounded-lg font-mono font-bold transition cursor-pointer text-xs min-h-[32px] ${
                    cameraView === 'chase' ? 'bg-rose-600 text-white shadow-sm' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  Chase Cam
                </button>
                <button
                  type="button"
                  onClick={() => setCameraView('aerial')}
                  className={`px-3 py-1.5 rounded-lg font-mono font-bold transition cursor-pointer text-xs min-h-[32px] ${
                    cameraView === 'aerial' ? 'bg-rose-600 text-white shadow-sm' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  Top-Down
                </button>
                <button
                  type="button"
                  onClick={() => setCameraView('suspension')}
                  className={`px-3 py-1.5 rounded-lg font-mono font-bold transition cursor-pointer text-xs min-h-[32px] ${
                    cameraView === 'suspension' ? 'bg-rose-600 text-white shadow-sm' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  Suspension
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 ml-auto flex-wrap">
              {/* Zoom In & Out Controls */}
              <div className="flex items-center gap-0.5 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-[10px] font-mono min-h-[32px]">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Zoom Out (or scroll down / pinch in)"
                  className="px-2 py-1.5 rounded hover:bg-zinc-800 active:bg-rose-600 text-zinc-300 hover:text-white transition cursor-pointer flex items-center gap-1 font-bold text-xs"
                >
                  <ZoomOut className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden md:inline">Zoom Out</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  title="Reset Zoom to 100%"
                  className="px-2 py-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer text-[10px] font-mono min-w-[34px] text-center"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Zoom In (or scroll up / pinch out)"
                  className="px-2 py-1.5 rounded hover:bg-zinc-800 active:bg-rose-600 text-zinc-300 hover:text-white transition cursor-pointer flex items-center gap-1 font-bold text-xs"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden md:inline">Zoom In</span>
                </button>
              </div>

              {/* Turntable Auto-Rotate Toggle */}
              <label className="flex items-center gap-1.5 text-zinc-300 text-xs cursor-pointer select-none bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 min-h-[32px]">
                <input
                  type="checkbox"
                  checked={autoRotate}
                  onChange={(e) => {
                    setAutoRotate(e.target.checked);
                    autoRotateRef.current = e.target.checked;
                  }}
                  className="rounded border-zinc-700 accent-rose-500 cursor-pointer w-3.5 h-3.5"
                />
                <span className="text-[11px] font-medium">Turntable</span>
              </label>

              {/* Speed Multiplier (0.5x, 1x, 2x) */}
              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-[10px] font-mono min-h-[32px]">
                {[0.5, 1, 2].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSimSpeedMultiplier(s);
                      simSpeedMultiplierRef.current = s;
                    }}
                    title={`Set simulation speed to ${s}x`}
                    className={`px-2.5 py-1 rounded cursor-pointer transition ${
                      simSpeedMultiplier === s
                        ? 'bg-rose-600 text-white font-black shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Viewport Canvas Container */}
        <div
          ref={viewportContainerRef}
          className={`relative w-full ${viewportHeightClass} bg-zinc-950 rounded-2xl border border-zinc-800/80 overflow-hidden flex items-center justify-center select-none transition-all duration-200`}
        >
          {/* 1. 3D Canvas */}
          {viewportMode === '3d' && is3DSupported && (
            <canvas
              ref={canvas3DRef}
              width={960}
              height={580}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              onWheel={handleWheel}
              className="w-full h-full cursor-grab active:cursor-grabbing touch-pan-y select-none"
            />
          )}

          {/* 2. 2D MoTeC HUD Canvas */}
          {viewportMode === '2d' && (
            <canvas
              ref={canvas2DRef}
              width={960}
              height={480}
              className="w-full h-full select-none touch-pan-y"
            />
          )}

          {/* 3. Dyno Power Curves */}
          {viewportMode === 'dyno' && (
            <div className="w-full h-full p-6 flex flex-col justify-between bg-zinc-950/90 font-mono">
              <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800 pb-2">
                <span className="font-bold text-amber-400">Power Dyno & Torque Band Telemetry</span>
                <span>Peak: {Math.round(handlingData.fInitialDriveForce * 920)} HP @ 6,800 RPM</span>
              </div>

              {/* Dyno Graph SVG */}
              <div className="relative w-full h-52 my-auto">
                <svg className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  {[0.2, 0.4, 0.6, 0.8, 1.0].map((gl, i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={gl * 180}
                      x2="100%"
                      y2={gl * 180}
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Power HP Curve (Red) */}
                  <path
                    d={`M 20,180 Q 240,40 680,${Math.max(20, 180 - handlingData.fInitialDriveForce * 320)}`}
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="3.5"
                  />

                  {/* Torque Curve (Sky Blue) */}
                  <path
                    d={`M 20,140 Q 200,20 680,${Math.max(40, 180 - (handlingData.fInitialDriveForce * 240) / (handlingData.fInitialDragCoeff * 0.12))}`}
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="3"
                    strokeDasharray="4 2"
                  />
                </svg>

                {/* Legend */}
                <div className="absolute top-2 right-2 flex items-center gap-4 text-xs font-mono bg-zinc-900/90 border border-zinc-800 p-2 rounded-xl">
                  <div className="flex items-center gap-1.5 text-rose-400">
                    <span className="w-3 h-0.5 bg-rose-500 inline-block" />
                    <span>Horsepower (HP)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sky-400">
                    <span className="w-3 h-0.5 bg-sky-400 inline-block" />
                    <span>Torque (lb-ft)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-800">
                <span>1,000 RPM</span>
                <span>3,500 RPM</span>
                <span>5,500 RPM</span>
                <span>7,000 RPM (Redline)</span>
                <span>8,500 RPM</span>
              </div>
            </div>
          )}

          {/* Floating Top-Left Model & Staging Banner */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none z-10">
            <span className="text-[11px] font-mono font-black px-2.5 py-1 rounded-xl bg-black/75 border border-zinc-700 text-white backdrop-blur-md flex items-center gap-1.5 shadow-lg w-fit">
              <Car className="w-3.5 h-3.5 text-rose-400" />
              <span>{vehicleModelName}</span>
            </span>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-black/70 border border-zinc-800 text-zinc-300 backdrop-blur-md">
                Mode: <strong className="text-amber-300 uppercase">{simMode}</strong> | Dist: <strong className="text-white">{distanceFt} ft</strong>
              </span>
              {simSpeedMultiplier !== 1 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 font-bold backdrop-blur-md shadow-sm">
                  ⚡ {simSpeedMultiplier}x Sim Speed
                </span>
              )}
            </div>
          </div>

          {/* Floating Canvas Quick Zoom Controls (Top-Right HUD) */}
          {viewportMode === '3d' && (
            <div className="absolute top-3 right-3 flex items-center gap-1 z-20 pointer-events-auto">
              <div className="flex items-center bg-black/80 backdrop-blur-md border border-zinc-800 rounded-xl p-0.5 shadow-xl">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Zoom Out (or scroll down / pinch in)"
                  className="w-7 h-7 rounded-lg hover:bg-zinc-800 active:bg-rose-600 text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer transition"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  title="Reset Zoom to 100%"
                  className="px-1.5 h-7 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer transition text-[10px] font-mono font-bold min-w-[34px]"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Zoom In (or scroll up / pinch out)"
                  className="w-7 h-7 rounded-lg hover:bg-zinc-800 active:bg-rose-600 text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer transition"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Floating Live Digital Cockpit Cluster (Bottom-Right HUD) */}
          <div className="absolute bottom-3 right-3 flex flex-col items-end gap-1.5 pointer-events-none z-10">
            {/* Speedometer & Gear Readout */}
            <div className="flex items-center gap-3 bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 px-3.5 py-2 rounded-2xl shadow-2xl">
              <div className="flex flex-col items-center border-r border-zinc-800 pr-3">
                <span className="text-[9px] font-bold text-zinc-400 uppercase">Gear</span>
                <span className="text-2xl font-black text-amber-400 font-mono leading-none mt-0.5">
                  {currentGear}
                </span>
              </div>

              <div className="flex flex-col items-end">
                <div className="text-3xl font-black text-white font-mono leading-none tracking-tight flex items-baseline gap-1">
                  <span>{Math.round(speedMph)}</span>
                  <span className="text-xs text-rose-400 font-sans font-bold">MPH</span>
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  {Math.round(speedMph * 1.60934)} KM/H | {Math.round(rpm)} RPM
                </div>
              </div>
            </div>

            {/* Dynamic RPM LED Shift Lights */}
            <div className="flex items-center gap-1 bg-black/80 px-2 py-1 rounded-xl border border-zinc-800 backdrop-blur-md">
              {Array.from({ length: 12 }).map((_, idx) => {
                const stepRpm = 1000 + idx * 625;
                const isActive = rpm >= stepRpm;
                const isRedline = idx >= 9;
                return (
                  <div
                    key={idx}
                    className={`w-2 h-3.5 rounded-sm transition-all duration-75 ${
                      isActive
                        ? isRedline
                          ? 'bg-rose-500 shadow-sm shadow-rose-500 animate-pulse'
                          : idx >= 6
                          ? 'bg-amber-400 shadow-sm shadow-amber-400'
                          : 'bg-emerald-400 shadow-sm shadow-emerald-400'
                        : 'bg-zinc-800'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Interactive Keyboard Tip or Scroll to Pedals Button in Manual Mode */}
          {simMode === 'manual' && (
            <div className="absolute bottom-3 left-3 flex items-center gap-2 z-20 pointer-events-auto">
              <button
                type="button"
                onClick={() => pedalsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}
                title="Scroll down to reach driving pedals"
                className="bg-emerald-950/90 hover:bg-emerald-900 active:bg-emerald-600 border border-emerald-500/50 text-emerald-200 text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-1.5 transition cursor-pointer backdrop-blur-md"
              >
                <span>🎮 Drive Controls</span>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
              </button>

              <div className="bg-black/85 backdrop-blur-md border border-zinc-800 px-2.5 py-1.5 rounded-xl text-[10px] font-mono text-zinc-300 pointer-events-none hidden md:flex items-center gap-1.5 max-w-[200px] truncate shadow-lg">
                <span className="text-emerald-400 font-bold">⌨️</span>
                <span className="truncate">[W/S] Drive | [A/D] Steer</span>
              </div>
            </div>
          )}
        </div>

        {/* 4-Corner Live Wheel Telemetry & Manual On-Screen Control Pedals */}
        {simMode === 'manual' ? (
          <div
            ref={pedalsRef}
            id="driving-pedals-controls"
            className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-2 scroll-mt-6"
          >
            {/* On-Screen Touch Driving Controls (Mobile / Mouse friendly) */}
            <div className="flex-1 min-w-0 p-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl flex items-center justify-between gap-2 overflow-hidden shadow-lg">
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  aria-label="Steer Left"
                  onMouseDown={() => (keysPressed.current['KeyA'] = true)}
                  onMouseUp={() => (keysPressed.current['KeyA'] = false)}
                  onTouchStart={() => (keysPressed.current['KeyA'] = true)}
                  onTouchEnd={() => (keysPressed.current['KeyA'] = false)}
                  className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-rose-600 font-black text-sm transition flex items-center justify-center cursor-pointer select-none text-white border border-zinc-700 shrink-0"
                >
                  ◀
                </button>
                <button
                  type="button"
                  aria-label="Steer Right"
                  onMouseDown={() => (keysPressed.current['KeyD'] = true)}
                  onMouseUp={() => (keysPressed.current['KeyD'] = false)}
                  onTouchStart={() => (keysPressed.current['KeyD'] = true)}
                  onTouchEnd={() => (keysPressed.current['KeyD'] = false)}
                  className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-rose-600 font-black text-sm transition flex items-center justify-center cursor-pointer select-none text-white border border-zinc-700 shrink-0"
                >
                  ▶
                </button>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onMouseDown={() => (keysPressed.current['KeyS'] = true)}
                  onMouseUp={() => (keysPressed.current['KeyS'] = false)}
                  onTouchStart={() => (keysPressed.current['KeyS'] = true)}
                  onTouchEnd={() => (keysPressed.current['KeyS'] = false)}
                  className="px-3 h-10 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 font-black text-xs transition flex items-center justify-center cursor-pointer select-none active:bg-rose-600 shrink-0"
                >
                  BRAKE
                </button>
                <button
                  type="button"
                  onMouseDown={() => (keysPressed.current['KeyW'] = true)}
                  onMouseUp={() => (keysPressed.current['KeyW'] = false)}
                  onTouchStart={() => (keysPressed.current['KeyW'] = true)}
                  onTouchEnd={() => (keysPressed.current['KeyW'] = false)}
                  className="px-3.5 h-10 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-black text-xs transition flex items-center justify-center cursor-pointer select-none active:bg-emerald-600 shrink-0"
                >
                  GAS
                </button>
              </div>
            </div>

            {/* Live G-Force & G-Meter Gauges */}
            <div className="flex-1 min-w-0 p-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl grid grid-cols-3 gap-1 text-xs font-mono items-center overflow-hidden shadow-lg">
              <div className="text-center min-w-0 px-1">
                <div className="text-zinc-400 text-[9px] uppercase font-bold truncate">Lateral G</div>
                <div className="text-sm sm:text-base font-black text-rose-400 mt-0.5 truncate">
                  {typeof latG === 'number' ? latG.toFixed(2) : '0.00'} G
                </div>
              </div>
              <div className="text-center border-x border-zinc-800 min-w-0 px-1">
                <div className="text-zinc-400 text-[9px] uppercase font-bold truncate">Longitudinal G</div>
                <div className="text-sm sm:text-base font-black text-amber-400 mt-0.5 truncate">
                  {typeof lonG === 'number' ? lonG.toFixed(2) : '0.00'} G
                </div>
              </div>
              <div className="text-center min-w-0 px-1">
                <div className="text-zinc-400 text-[9px] uppercase font-bold truncate">Steer Angle</div>
                <div className="text-sm sm:text-base font-black text-sky-400 mt-0.5 truncate">
                  {typeof steerAngle === 'number' ? steerAngle.toFixed(1) : '0.0'}°
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Live 4-Wheel Corner Telemetry Grid */
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {/* FL Wheel */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5 text-xs font-mono flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase">
                <span>Front Left</span>
                <span className={tireSlipFL > 0.3 ? 'text-rose-400' : 'text-emerald-400'}>
                  {tireSlipFL > 0.3 ? 'SLIP' : 'GRIP'}
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-zinc-500 text-[10px]">Load:</span>
                <span className="text-white font-bold">{Math.round(handlingData.fMass * 0.26 + lonG * 80)} kg</span>
              </div>
              <div className="flex items-baseline justify-between text-[10px]">
                <span className="text-zinc-500">Disc:</span>
                <span className="text-amber-400">{Math.round(brakeTemp)}°C</span>
              </div>
            </div>

            {/* FR Wheel */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5 text-xs font-mono flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase">
                <span>Front Right</span>
                <span className={tireSlipFR > 0.3 ? 'text-rose-400' : 'text-emerald-400'}>
                  {tireSlipFR > 0.3 ? 'SLIP' : 'GRIP'}
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-zinc-500 text-[10px]">Load:</span>
                <span className="text-white font-bold">{Math.round(handlingData.fMass * 0.26 + lonG * 80)} kg</span>
              </div>
              <div className="flex items-baseline justify-between text-[10px]">
                <span className="text-zinc-500">Disc:</span>
                <span className="text-amber-400">{Math.round(brakeTemp)}°C</span>
              </div>
            </div>

            {/* RL Wheel */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5 text-xs font-mono flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase">
                <span>Rear Left</span>
                <span className={tireSlipRL > 0.3 ? 'text-rose-400' : 'text-emerald-400'}>
                  {tireSlipRL > 0.3 ? 'SLIP' : 'GRIP'}
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-zinc-500 text-[10px]">Load:</span>
                <span className="text-white font-bold">{Math.round(handlingData.fMass * 0.24 - lonG * 80)} kg</span>
              </div>
              <div className="flex items-baseline justify-between text-[10px]">
                <span className="text-zinc-500">Disc:</span>
                <span className="text-amber-400">{Math.round(brakeTemp * 0.85)}°C</span>
              </div>
            </div>

            {/* RR Wheel */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5 text-xs font-mono flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase">
                <span>Rear Right</span>
                <span className={tireSlipRR > 0.3 ? 'text-rose-400' : 'text-emerald-400'}>
                  {tireSlipRR > 0.3 ? 'SLIP' : 'GRIP'}
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-zinc-500 text-[10px]">Load:</span>
                <span className="text-white font-bold">{Math.round(handlingData.fMass * 0.24 - lonG * 80)} kg</span>
              </div>
              <div className="flex items-baseline justify-between text-[10px]">
                <span className="text-zinc-500">Disc:</span>
                <span className="text-amber-400">{Math.round(brakeTemp * 0.85)}°C</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
