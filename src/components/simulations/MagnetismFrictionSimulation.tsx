import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MagnetGayaMode, MagnetPolarity, SurfaceType, SurfaceProps } from '../../types/physics';
import { ParameterSlider } from '../ui/ParameterSlider';
import { FormulaCard } from '../ui/FormulaCard';
import { Rotate3d, Play, RotateCcw, ArrowRight } from 'lucide-react';

const SURFACES: Record<SurfaceType, SurfaceProps> = {
  es: {
    name: 'es',
    label: 'Es Licin',
    mu_s: 0.05,
    mu_k: 0.03,
    color: '#38bdf8',
    desc: 'Sangat licin, gaya gesek minimum, benda mudah meluncur kencang.'
  },
  kayu: {
    name: 'kayu',
    label: 'Kayu Halus',
    mu_s: 0.40,
    mu_k: 0.30,
    color: '#d97706',
    desc: 'Tekstur standar, membutuhkan dorongan wajar untuk mengatasi gesekan statis.'
  },
  aspal: {
    name: 'aspal',
    label: 'Aspal Kasar',
    mu_s: 0.70,
    mu_k: 0.55,
    color: '#64748b',
    desc: 'Permukaan bertekstur tinggi, gesekan kuat mencegah selip.'
  },
  karet: {
    name: 'karet',
    label: 'Karet Sintetis',
    mu_s: 1.00,
    mu_k: 0.80,
    color: '#10b981',
    desc: 'Daya cengkeram sangat tinggi (koefisien gesek besar).'
  }
};

export const MagnetismFrictionSimulation: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<MagnetGayaMode>('medan-magnet');

  // Magnetism parameters
  const [polarity, setPolarity] = useState<MagnetPolarity>('berlawanan'); // tarik-menarik vs tolak-menolak
  const [magnetDistance, setMagnetDistance] = useState<number>(8); // distance in cm
  const [magnetStrength, setMagnetStrength] = useState<number>(50); // Tesla/scaled

  // Friction parameters
  const [surfaceType, setSurfaceType] = useState<SurfaceType>('kayu');
  const [appliedForce, setAppliedForce] = useState<number>(35); // Newton
  const [mass, setMass] = useState<number>(10); // kg
  const [inclineAngle, setInclineAngle] = useState<number>(0); // degrees
  const [blockPos, setBlockPos] = useState<number>(0); // position along track
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // Physics calculations for friction
  const currentSurface = SURFACES[surfaceType];
  const g = 9.8; // m/s^2
  const thetaRad = (inclineAngle * Math.PI) / 180;
  const normalForce = mass * g * Math.cos(thetaRad); // N = mg cos(theta)
  const weightParallel = mass * g * Math.sin(thetaRad); // Wx = mg sin(theta)
  const maxStaticFriction = currentSurface.mu_s * normalForce; // fs_max = mu_s * N
  const kineticFriction = currentSurface.mu_k * normalForce; // fk = mu_k * N

  const netDrivingForce = appliedForce - weightParallel;
  const isMoving = Math.abs(netDrivingForce) > maxStaticFriction;
  const effectiveFriction = isMoving ? kineticFriction : Math.abs(netDrivingForce);
  const acceleration = isMoving ? (netDrivingForce - Math.sign(netDrivingForce) * kineticFriction) / mass : 0;

  // Magnetic force calculation (Coulomb's Law for magnetic poles: F ~ (B1 * B2) / r^2)
  const magneticForce = (magnetStrength * magnetStrength * 0.1) / Math.max(1, magnetDistance * magnetDistance);

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const dynamicGroupRef = useRef<THREE.Group | null>(null);
  const slidingBlockRef = useRef<THREE.Mesh | null>(null);
  const blockVelocityRef = useRef<number>(0);

  // Setup Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 10, 24);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lights
    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    const dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);
    dynamicGroupRef.current = dynamicGroup;

    let animId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (currentTime - lastTime) / 1000);
      lastTime = currentTime;
      controls.update();

      // Animate block sliding if moving
      if (mode === 'gaya-gesek' && slidingBlockRef.current && isSimulating) {
        if (isMoving) {
          blockVelocityRef.current += acceleration * dt;
          let newX = slidingBlockRef.current.position.x + blockVelocityRef.current * dt;
          if (newX > 10) {
            newX = -8;
            blockVelocityRef.current = 0;
          }
          slidingBlockRef.current.position.x = newX;
          setBlockPos(newX);
        } else {
          blockVelocityRef.current = 0;
        }
      }

      renderer.render(scene, camera);
    };
    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [mode, isMoving, acceleration, isSimulating]);

  // Build 3D Models for Magnetism or Friction Track
  useEffect(() => {
    const group = dynamicGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
    slidingBlockRef.current = null;

    if (mode === 'medan-magnet') {
      // 3D Bar Magnets (North is Red, South is Blue)
      const halfDist = magnetDistance / 2;

      // Magnet 1 (Left): Left end South (Blue), Right end North (Red)
      const m1Group = new THREE.Group();
      m1Group.position.set(-halfDist - 3, 0, 0);

      const poleMatNorth = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.3, roughness: 0.2 });
      const poleMatSouth = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.3, roughness: 0.2 });

      // Left bar: S on left, N on right
      const m1S = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.8, 1.8), poleMatSouth);
      m1S.position.x = -1.25;
      const m1N = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.8, 1.8), poleMatNorth);
      m1N.position.x = 1.25;
      m1Group.add(m1S);
      m1Group.add(m1N);
      group.add(m1Group);

      // Magnet 2 (Right):
      // If polarity === 'berlawanan' (Attraction): Left end is South (Blue), Right end is North (Red)
      // If polarity === 'sejenis' (Repulsion): Left end is North (Red), Right end is South (Blue)
      const m2Group = new THREE.Group();
      m2Group.position.set(halfDist + 3, 0, 0);

      const m2LeftMat = polarity === 'berlawanan' ? poleMatSouth : poleMatNorth;
      const m2RightMat = polarity === 'berlawanan' ? poleMatNorth : poleMatSouth;

      const m2L = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.8, 1.8), m2LeftMat);
      m2L.position.x = -1.25;
      const m2R = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.8, 1.8), m2RightMat);
      m2R.position.x = 1.25;
      m2Group.add(m2L);
      m2Group.add(m2R);
      group.add(m2Group);

      // 3D Magnetic Flux Lines (Curved lines of force)
      const lineCount = 28;
      const lineColor = polarity === 'berlawanan' ? 0x38bdf8 : 0xf97316;

      for (let i = 0; i < lineCount; i++) {
        const phi = (i / lineCount) * Math.PI * 2;
        const radiusArc = 2 + (i % 5) * 1.5;

        const points: THREE.Vector3[] = [];
        const steps = 30;

        if (polarity === 'berlawanan') {
          // Tarik Menarik: Lines connect from N of magnet 1 to S of magnet 2
          const startPt = new THREE.Vector3(-halfDist - 0.5, 0, 0);
          const endPt = new THREE.Vector3(halfDist + 0.5, 0, 0);

          for (let s = 0; s <= steps; s++) {
            const t = s / steps;
            const x = THREE.MathUtils.lerp(startPt.x, endPt.x, t);
            const arch = Math.sin(t * Math.PI) * radiusArc;
            const y = Math.cos(phi) * arch;
            const z = Math.sin(phi) * arch;
            points.push(new THREE.Vector3(x, y, z));
          }
        } else {
          // Tolak Menolak: Lines bend away from the center neutral zone
          const startPt = new THREE.Vector3(-halfDist - 0.5, 0, 0);
          for (let s = 0; s <= steps; s++) {
            const t = s / steps;
            const x = THREE.MathUtils.lerp(startPt.x, 0, t);
            const flare = Math.tan(t * (Math.PI / 2.3)) * (1.2 + (i % 4));
            const y = Math.cos(phi) * flare;
            const z = Math.sin(phi) * flare;
            points.push(new THREE.Vector3(x, y, z));
          }
        }

        const fluxGeom = new THREE.BufferGeometry().setFromPoints(points);
        const fluxMat = new THREE.LineBasicMaterial({
          color: lineColor,
          transparent: true,
          opacity: 0.55
        });
        const fluxLine = new THREE.Line(fluxGeom, fluxMat);
        group.add(fluxLine);
      }

      // Neutral Plane marker if repelling
      if (polarity === 'sejenis') {
        const neutralRing = new THREE.Mesh(
          new THREE.RingGeometry(0.5, 6, 32),
          new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.15 })
        );
        neutralRing.rotation.y = Math.PI / 2;
        group.add(neutralRing);
      }
    } else {
      // 3D Friction Testing Track
      const trackGroup = new THREE.Group();
      trackGroup.rotation.z = (inclineAngle * Math.PI) / 180;

      // Track Board
      const trackGeom = new THREE.BoxGeometry(24, 0.6, 6);
      const trackColorHex =
        surfaceType === 'es'
          ? 0x7dd3fc
          : surfaceType === 'kayu'
          ? 0xb45309
          : surfaceType === 'aspal'
          ? 0x334155
          : 0x065f46;

      const trackMat = new THREE.MeshStandardMaterial({
        color: trackColorHex,
        roughness: currentSurface.mu_s,
        metalness: surfaceType === 'es' ? 0.3 : 0.05
      });
      const track = new THREE.Mesh(trackGeom, trackMat);
      track.position.y = -0.3;
      trackGroup.add(track);

      // Testing Block
      const blockGeom = new THREE.BoxGeometry(3, 2, 3);
      const blockMat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        roughness: 0.3,
        metalness: 0.5
      });
      const block = new THREE.Mesh(blockGeom, blockMat);
      block.position.set(-8, 1, 0);
      slidingBlockRef.current = block;
      trackGroup.add(block);

      // 3D Force Vectors (Free-Body Diagram arrows)
      // 1. Gaya Tarik F (Arrow kanan)
      if (appliedForce > 0) {
        const fArrow = new THREE.ArrowHelper(
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(1.5, 0, 0),
          Math.min(6, appliedForce * 0.08),
          0x22c55e,
          0.8,
          0.4
        );
        block.add(fArrow);
      }

      // 2. Gaya Gesek f (Arrow kiri, melawan arah gerak)
      const fricArrow = new THREE.ArrowHelper(
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(-1.5, -0.8, 0),
        Math.min(5, effectiveFriction * 0.08),
        0xef4444,
        0.8,
        0.4
      );
      block.add(fricArrow);

      // 3. Gaya Normal N (Arrow tegak lurus bidang ke atas)
      const normalArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 1, 0),
        Math.min(5, normalForce * 0.04),
        0x06b6d4,
        0.8,
        0.4
      );
      block.add(normalArrow);

      group.add(trackGroup);

      // Gravity vector W (selalu vertikal ke bawah terhadap dunia)
      const gravArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(-8, 0, 0),
        3.5,
        0xfacc15,
        0.8,
        0.4
      );
      group.add(gravArrow);
    }
  }, [mode, polarity, magnetDistance, magnetStrength, surfaceType, inclineAngle, appliedForce, effectiveFriction, normalForce, currentSurface.mu_s]);

  const handleResetPosition = () => {
    if (slidingBlockRef.current) {
      slidingBlockRef.current.position.x = -8;
      blockVelocityRef.current = 0;
      setBlockPos(-8);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* 3D Visual Sandbox Canvas (Left 7 cols) */}
      <div className="lg:col-span-7 flex flex-col space-y-3">
        {/* Submode Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setMode('medan-magnet')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-all whitespace-nowrap ${
              mode === 'medan-magnet' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Garis Gaya Magnet 3D & Interaksi Kutub
          </button>
          <button
            onClick={() => setMode('gaya-gesek')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-all whitespace-nowrap ${
              mode === 'gaya-gesek' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Simulasi Gaya Gesek & Tekstur Lintasan
          </button>
        </div>

        {/* 3D WebGL Canvas Container */}
        <div className="relative w-full h-[460px] sm:h-[500px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Interactive 3D Control Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300 pointer-events-none">
            <Rotate3d className="h-3.5 w-3.5 text-cyan-400" />
            <span>Rotasi 3D Aktif (Geser / Zoom)</span>
          </div>

          {/* Friction reset action */}
          {mode === 'gaya-gesek' && (
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                onClick={handleResetPosition}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-medium shadow-md transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5 text-cyan-400" />
                <span>Reset Posisi</span>
              </button>
            </div>
          )}

          {/* Dynamic Physics HUD */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/70 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800/80 pointer-events-none">
            <span>
              {mode === 'medan-magnet' && (
                <>
                  Interaksi:{' '}
                  <span className="text-cyan-300 font-bold">
                    {polarity === 'berlawanan' ? 'TARIK-MENARIK (Kutub Tak Senama U-S)' : 'TOLAK-MENOLAK (Kutub Senama U-U)'}
                  </span>{' '}
                  · Garis gaya keluar dari Utara (Merah) menuju Selatan (Biru).
                </>
              )}
              {mode === 'gaya-gesek' && (
                <>
                  Status Balok:{' '}
                  <span className={`font-bold ${isMoving ? 'text-green-400' : 'text-amber-400'}`}>
                    {isMoving ? 'BERGERAK MELUNCUR' : 'DIAM (F ≤ fs,max)'}
                  </span>{' '}
                  · a = {acceleration.toFixed(2)} m/s² · Gesek: {effectiveFriction.toFixed(1)} N
                </>
              )}
            </span>
            <span className="font-mono text-cyan-400 shrink-0">
              {mode === 'medan-magnet' ? 'Hukum Biot-Savart & Coulomb' : 'Hukum II Newton: ΣF = m · a'}
            </span>
          </div>
        </div>
      </div>

      {/* Control Deck & Scientific Explanation (Right 5 cols) */}
      <div className="lg:col-span-5 flex flex-col space-y-4">
        {/* Dynamic Controls based on selected mode */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white">Parameter Gaya</h3>
            <span className="text-xs text-cyan-400 font-mono">
              {mode === 'medan-magnet' ? 'Fluks Magnetik' : 'Dinamika Gesekan'}
            </span>
          </div>

          {mode === 'medan-magnet' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Konfigurasi Kutub Berhadapan:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPolarity('berlawanan')}
                    className={`p-2.5 rounded-lg text-xs font-medium border text-center transition-all ${
                      polarity === 'berlawanan'
                        ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    <div className="font-semibold">Tak Senama (U - S)</div>
                    <div className="text-[10px] text-slate-400">Tarik Menarik</div>
                  </button>
                  <button
                    onClick={() => setPolarity('sejenis')}
                    className={`p-2.5 rounded-lg text-xs font-medium border text-center transition-all ${
                      polarity === 'sejenis'
                        ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    <div className="font-semibold">Senama (U - U)</div>
                    <div className="text-[10px] text-slate-400">Tolak Menolak</div>
                  </button>
                </div>
              </div>

              <ParameterSlider
                label="Jarak Antar Magnet"
                value={magnetDistance}
                min={3}
                max={15}
                step={0.5}
                unit="cm"
                symbol="r"
                onChange={setMagnetDistance}
                description="Semakin dekat jarak r, semakin kuat gaya tarik/tolak berbanding terbalik dengan kuadrat jarak (1/r²)."
              />

              <ParameterSlider
                label="Kuat Medan Magnet"
                value={magnetStrength}
                min={10}
                max={100}
                step={5}
                unit="mT"
                symbol="B"
                onChange={setMagnetStrength}
                description="Kekuatan fluks magnetik yang terpancar dari kutub batang magnet."
              />
            </div>
          )}

          {mode === 'gaya-gesek' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Tekstur Permukaan Lintasan:</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(SURFACES) as SurfaceType[]).map((type) => {
                    const surf = SURFACES[type];
                    return (
                      <button
                        key={type}
                        onClick={() => setSurfaceType(type)}
                        className={`p-2 rounded-lg text-xs font-medium border text-left transition-all ${
                          surfaceType === type
                            ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                            : 'border-slate-800 bg-slate-900 text-slate-400'
                        }`}
                      >
                        <div className="font-semibold text-slate-200">{surf.label}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          μs={surf.mu_s} · μk={surf.mu_k}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <ParameterSlider
                label="Gaya Dorong Luar (F)"
                value={appliedForce}
                min={0}
                max={120}
                step={1}
                unit="Newton"
                symbol="F"
                onChange={setAppliedForce}
                description="Gaya horizontal yang menarik/mendorong balok ke depan."
              />

              <ParameterSlider
                label="Massa Balok Uji"
                value={mass}
                min={2}
                max={25}
                step={1}
                unit="kg"
                symbol="m"
                onChange={setMass}
                description="Massa menentukan berat balok W = mg dan gaya tekan normal N terhadap lintasan."
              />

              <ParameterSlider
                label="Sudut Kemiringan Lintasan"
                value={inclineAngle}
                min={0}
                max={35}
                step={1}
                unit="°"
                symbol="θ"
                onChange={setInclineAngle}
                description="Pada bidang miring, gaya normal N = mg cos θ berkurang seiring bertambahnya sudut."
              />
            </div>
          )}
        </div>

        {/* Scientific Formulas & Theories */}
        {mode === 'medan-magnet' && (
          <FormulaCard
            title="Gaya Magnetik & Sifat Garis Gaya Fluks"
            formula="F_mag ∝ (m₁ · m₂) / r²  |  Φ = B · A · cos(θ)"
            principle={
              polarity === 'berlawanan'
                ? 'Kutub Tidak Senama (Utara - Selatan): Garis gaya magnet keluar dari kutub utara dan masuk secara kontinu ke kutub selatan, menghasilkan gaya tarik-menarik kuat.'
                : 'Kutub Senama (Utara - Utara): Garis gaya saling tolak-menolak dan melengkung menjauh, menciptakan area titik netral di tengah dengan fluks magnet bernilai nol.'
            }
            liveResult={{
              label: 'Kekuatan Gaya Relatif',
              value: `${magneticForce.toFixed(2)} N (Skala)`
            }}
            variables={[
              { symbol: 'B', meaning: 'Induksi magnetik', unit: 'Tesla' },
              { symbol: 'r', meaning: 'Jarak antar kutub magnet', unit: 'meter' },
              { symbol: 'Φ', meaning: 'Fluks magnetik', unit: 'Weber' }
            ]}
          />
        )}

        {mode === 'gaya-gesek' && (
          <FormulaCard
            title="Hukum Gesekan Statis & Kinetis (Amontons-Coulomb)"
            formula="f_s(max) = μ_s · N  |  f_k = μ_k · N  |  N = m · g · cos(θ)"
            principle={
              isMoving
                ? `Balok Bergerak: Gaya dorong F (${appliedForce} N) berhasil melampaui gesekan statis maksimum (${maxStaticFriction.toFixed(1)} N). Gesekan yang bekerja berganti menjadi kinetis f_k = ${kineticFriction.toFixed(1)} N.`
                : `Balok Diam: Gaya dorong F (${appliedForce} N) masih lebih kecil atau sama dengan gesekan statis maksimum (${maxStaticFriction.toFixed(1)} N). Benda tetap berada dalam kesetimbangan statis (a = 0).`
            }
            liveResult={{
              label: 'Gaya Gesek Statis Maks (fs_max)',
              value: `${maxStaticFriction.toFixed(1)} N`
            }}
            variables={[
              { symbol: 'μ_s', meaning: `Koefisien gesek statis (${currentSurface.mu_s})` },
              { symbol: 'μ_k', meaning: `Koefisien gesek kinetis (${currentSurface.mu_k})` },
              { symbol: 'N', meaning: `Gaya normal (${normalForce.toFixed(1)} N)` },
              { symbol: 'a', meaning: `Percepatan benda (${acceleration.toFixed(2)} m/s²)` }
            ]}
          />
        )}
      </div>
    </div>
  );
};
