import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SoundMode } from '../../types/physics';
import { ParameterSlider } from '../ui/ParameterSlider';
import { FormulaCard } from '../ui/FormulaCard';
import { soundEngine } from '../../utils/audio';
import { Volume2, VolumeX, Play, Rotate3d, Waves, ShieldCheck } from 'lucide-react';

export const SoundSimulation: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [soundMode, setSoundMode] = useState<SoundMode>('longitudinal');

  // Longitudinal Wave Parameters
  const [frequency, setFrequency] = useState<number>(440); // Hz
  const [amplitude, setAmplitude] = useState<number>(1.5); // cm displacement
  const [airSpeed, setAirSpeed] = useState<number>(340); // m/s
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Echo / Room Reflection Parameters
  const [roomDistance, setRoomDistance] = useState<number>(20); // meters (dinding pemantul)
  const [wallMaterial, setWallMaterial] = useState<'beton' | 'kayu' | 'busa'>('beton'); // acoustic foam vs hard concrete
  const [isEchoDamped, setIsEchoDamped] = useState<boolean>(false);

  // Derived calculations
  const wavelength = airSpeed / frequency; // lambda = v / f (meter)
  const echoDelay = (2 * roomDistance) / airSpeed; // detik: 2d / v
  const isGema = roomDistance >= 17; // Gema terdengar jelas jika jarak >= ~17m (delay >= 0.1s)

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const dynamicGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<{ mesh: THREE.InstancedMesh; basePositions: number[] } | null>(null);
  const pulseRaysRef = useRef<THREE.Mesh[]>([]);

  // Setup Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 10, 26);
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
    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    const dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);
    dynamicGroupRef.current = dynamicGroup;

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      controls.update();

      // Dynamic particle oscillation for longitudinal wave
      if (particlesRef.current && soundMode === 'longitudinal') {
        const { mesh, basePositions } = particlesRef.current;
        const dummy = new THREE.Object3D();
        const count = basePositions.length / 3;
        const omega = 2 * Math.PI * (frequency / 100); // scaled visual speed
        const k = (2 * Math.PI) / (wavelength * 3);

        for (let i = 0; i < count; i++) {
          const x0 = basePositions[i * 3];
          const y0 = basePositions[i * 3 + 1];
          const z0 = basePositions[i * 3 + 2];

          // Longitudinal oscillation along X axis: displacement parallel to wave propagation
          const dx = amplitude * 0.4 * Math.sin(k * x0 - omega * elapsedTime);
          dummy.position.set(x0 + dx, y0, z0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }

      // Room wave rings animation
      if (pulseRaysRef.current.length > 0) {
        pulseRaysRef.current.forEach((ring, idx) => {
          const speedFactor = 4;
          const currentScale = ((elapsedTime * speedFactor + idx * 2) % 18) + 0.5;
          ring.scale.set(currentScale, currentScale, currentScale);

          // Dampening opacity fade
          const maxDist = 18;
          const opacity = Math.max(0, 1 - currentScale / maxDist) * (isEchoDamped || wallMaterial === 'busa' ? 0.3 : 0.8);
          if (ring.material instanceof THREE.MeshBasicMaterial) {
            ring.material.opacity = opacity;
          }
        });
      }

      renderer.render(scene, camera);
    };
    animate();

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
      soundEngine.stop();
      renderer.dispose();
    };
  }, [soundMode, frequency, amplitude, wavelength, wallMaterial, isEchoDamped]);

  // Build Scene Models for Sound
  useEffect(() => {
    const group = dynamicGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
    particlesRef.current = null;
    pulseRaysRef.current = [];

    if (soundMode === 'longitudinal') {
      // 3D Speaker Cone & Acoustic Tube
      // Speaker Housing
      const speakerHousingGeom = new THREE.CylinderGeometry(3.5, 2.5, 2, 32);
      const speakerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
      const speaker = new THREE.Mesh(speakerHousingGeom, speakerMat);
      speaker.rotation.z = Math.PI / 2;
      speaker.position.set(-13, 0, 0);
      group.add(speaker);

      // Vibrating Diaphragm
      const coneGeom = new THREE.ConeGeometry(3, 1.5, 32, 1, true);
      const coneMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
      const cone = new THREE.Mesh(coneGeom, coneMat);
      cone.rotation.z = -Math.PI / 2;
      cone.position.set(-11.8, 0, 0);
      group.add(cone);

      // Transparent Acoustic Waveguide Tube
      const tubeGeom = new THREE.CylinderGeometry(3.8, 3.8, 24, 32, 1, true);
      const tubeMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15,
        transmission: 0.9,
        roughness: 0.1,
        side: THREE.DoubleSide
      });
      const tube = new THREE.Mesh(tubeGeom, tubeMat);
      tube.rotation.z = Math.PI / 2;
      tube.position.set(0, 0, 0);
      group.add(tube);

      // Air Molecules: 3D Instanced Mesh (particles oscillating longitudinally)
      const particleGeom = new THREE.SphereGeometry(0.12, 8, 8);
      const particleMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.4,
        roughness: 0.2
      });

      const cols = 45; // along length
      const rows = 12; // radially
      const totalParticles = cols * rows;
      const instancedMesh = new THREE.InstancedMesh(particleGeom, particleMat, totalParticles);
      const basePos: number[] = [];

      let idx = 0;
      for (let c = 0; c < cols; c++) {
        const x = -11 + (c / (cols - 1)) * 22;
        for (let r = 0; r < rows; r++) {
          const angle = (r / rows) * Math.PI * 2;
          const radius = (Math.random() * 0.7 + 0.2) * 3.2;
          const y = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;

          basePos.push(x, y, z);

          const dummy = new THREE.Object3D();
          dummy.position.set(x, y, z);
          dummy.updateMatrix();
          instancedMesh.setMatrixAt(idx++, dummy.matrix);
        }
      }
      instancedMesh.instanceMatrix.needsUpdate = true;
      group.add(instancedMesh);
      particlesRef.current = { mesh: instancedMesh, basePositions: basePos };

      // Axis labels indicator (Compression / Kerapatan & Rarefaction / Renggangan)
      const bannerGeom = new THREE.PlaneGeometry(24, 1.2);
      const bannerMat = new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.7 });
      const banner = new THREE.Mesh(bannerGeom, bannerMat);
      banner.position.set(0, -4.8, 0);
      group.add(banner);
    } else {
      // Room Acoustic: Pemantulan Bunyi (Gaung vs Gema) & Peredam Suara
      // Room Box Walls
      const roomW = 28;
      const roomH = 12;
      const roomD = 18;

      // Floor & Ceiling
      const floorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomD), floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -5;
      group.add(floor);

      // Back reflecting wall
      const wallMatColor =
        wallMaterial === 'beton'
          ? 0x64748b
          : wallMaterial === 'kayu'
          ? 0xb45309
          : 0x1e293b;

      const wallMat = new THREE.MeshStandardMaterial({
        color: wallMatColor,
        roughness: wallMaterial === 'busa' ? 0.95 : 0.4,
        metalness: 0.1
      });
      const backWall = new THREE.Mesh(new THREE.BoxGeometry(0.8, roomH, roomD), wallMat);
      backWall.position.set(13, 1, 0);
      group.add(backWall);

      // Acoustic Foam Wedges (Peredam Piramida) on the wall if busa selected or soundMode is peredam
      if (wallMaterial === 'busa' || soundMode === 'peredam') {
        const wedgeMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.95 });
        const wedgeGeom = new THREE.ConeGeometry(0.5, 1.2, 4);

        for (let py = -4; py <= 6; py += 1.2) {
          for (let pz = -7; pz <= 7; pz += 1.2) {
            const wedge = new THREE.Mesh(wedgeGeom, wedgeMat);
            wedge.rotation.z = -Math.PI / 2;
            wedge.position.set(12.3, py, pz);
            group.add(wedge);
          }
        }
      }

      // Sound Speaker source on the left
      const speakerMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
      const speakerMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 2), speakerMat);
      speakerMesh.position.set(-10, -2, 0);
      group.add(speakerMesh);

      // Person / Listener in the center
      const personMat = new THREE.MeshStandardMaterial({ color: 0x10b981 });
      const personBody = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 2.5, 16), personMat);
      personBody.position.set(-2, -2.5, 0);
      const personHead = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), personMat);
      personHead.position.set(-2, -0.9, 0);
      group.add(personBody);
      group.add(personHead);

      // Sound Wave Pulses (Expanding spherical wireframe waves)
      const rings: THREE.Mesh[] = [];
      for (let r = 0; r < 4; r++) {
        const ringGeom = new THREE.RingGeometry(0.9, 1.1, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: wallMaterial === 'busa' ? 0x06b6d4 : 0xf43f5e,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8
        });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.position.set(-10, -2, 0);
        ringMesh.rotation.y = Math.PI / 2;
        group.add(ringMesh);
        rings.push(ringMesh);
      }
      pulseRaysRef.current = rings;
    }
  }, [soundMode, wallMaterial]);

  // Handle Audio playback
  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      soundEngine.stop();
      setIsPlayingAudio(false);
    } else {
      soundEngine.playTone(frequency, soundMode === 'pemantulan', wallMaterial === 'busa');
      setIsPlayingAudio(true);
    }
  };

  const handleTestPulse = () => {
    soundEngine.playPulse(frequency, isGema ? 2 : 5, wallMaterial === 'busa' || soundMode === 'peredam');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* 3D Visual Sandbox Canvas (Left 7 cols) */}
      <div className="lg:col-span-7 flex flex-col space-y-3">
        {/* Submode Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => {
              setSoundMode('longitudinal');
              soundEngine.stop();
              setIsPlayingAudio(false);
            }}
            className={`px-3 py-1.5 font-medium rounded-lg transition-all whitespace-nowrap ${
              soundMode === 'longitudinal' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Gelombang Longitudinal Partikel
          </button>
          <button
            onClick={() => {
              setSoundMode('pemantulan');
              soundEngine.stop();
              setIsPlayingAudio(false);
            }}
            className={`px-3 py-1.5 font-medium rounded-lg transition-all whitespace-nowrap ${
              soundMode === 'pemantulan' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pemantulan (Gaung vs Gema)
          </button>
          <button
            onClick={() => {
              setSoundMode('peredam');
              setWallMaterial('busa');
              soundEngine.stop();
              setIsPlayingAudio(false);
            }}
            className={`px-3 py-1.5 font-medium rounded-lg transition-all whitespace-nowrap ${
              soundMode === 'peredam' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Peredam Suara Akustik
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

          {/* Audio Synthesizer Quick Trigger Button */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={handleToggleAudio}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all ${
                isPlayingAudio
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              {isPlayingAudio ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              <span>{isPlayingAudio ? 'Matikan Suara' : 'Dengarkan Frekuensi'}</span>
            </button>
          </div>

          {/* Live Physics HUD */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/70 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800/80 pointer-events-none">
            <span>
              {soundMode === 'longitudinal' && (
                <>
                  Partikel bergetar harmonis sejajar arah rambat · <span className="text-cyan-300 font-semibold">Kerapatan (tekanan tinggi)</span> & <span className="text-slate-300">Renggangan (tekanan rendah)</span>
                </>
              )}
              {soundMode === 'pemantulan' && (
                <>
                  Status Akustik: <span className="text-cyan-300 font-bold">{isGema ? 'GEMA (Echo)' : 'GAUNG (Reverberation)'}</span> · Jeda rambat: <span className="font-mono">{echoDelay.toFixed(3)} s</span>
                </>
              )}
              {soundMode === 'peredam' && (
                <>
                  Peredam Piramida Poros: Energi gelombang diserap menjadi panas di rongga busa akustik (Koefisien serap α &gt; 0.85).
                </>
              )}
            </span>
            <span className="font-mono text-cyan-400 shrink-0">v = λ · f</span>
          </div>
        </div>
      </div>

      {/* Control Deck & Scientific Explanation (Right 5 cols) */}
      <div className="lg:col-span-5 flex flex-col space-y-4">
        {/* Dynamic Controls based on selected submode */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white">Parameter Akustik</h3>
            <span className="text-xs text-cyan-400 font-mono">
              {soundMode === 'longitudinal' && 'Gelombang Tekanan'}
              {soundMode === 'pemantulan' && 'Refleksi Ruang'}
              {soundMode === 'peredam' && 'Disipasi Akustik'}
            </span>
          </div>

          <ParameterSlider
            label="Frekuensi Nada Bunyi"
            value={frequency}
            min={100}
            max={1000}
            step={10}
            unit="Hz"
            symbol="f"
            onChange={(val) => {
              setFrequency(val);
              soundEngine.setFrequency(val);
            }}
            description="Tinggi rendahnya nada ditentukan oleh frekuensi getaran partikel per detik."
          />

          {soundMode === 'longitudinal' && (
            <>
              <ParameterSlider
                label="Amplitudo Getaran Speaker"
                value={amplitude}
                min={0.5}
                max={3.0}
                step={0.1}
                unit="cm"
                symbol="A"
                onChange={setAmplitude}
                description="Kuat lemahnya bunyi berkaitan dengan amplitudo simpangan gelombang."
              />

              <ParameterSlider
                label="Cepat Rambat Bunyi di Udara (20°C)"
                value={airSpeed}
                min={300}
                max={400}
                step={5}
                unit="m/s"
                symbol="v"
                onChange={setAirSpeed}
                description="Pada suhu 20°C, cepat rambat bunyi normal di udara adalah sekitar 340-343 m/s."
              />
            </>
          )}

          {soundMode === 'pemantulan' && (
            <>
              <ParameterSlider
                label="Jarak Dinding Pemantul"
                value={roomDistance}
                min={5}
                max={40}
                step={1}
                unit="meter"
                symbol="d"
                onChange={setRoomDistance}
                description="Jika jarak d < 17m suara pantul bertumpuk (Gaung). Jika d ≥ 17m suara pantul terdengar terpisah (Gema)."
              />

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Material Dinding:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'beton', label: 'Beton Keras', desc: 'Pemantul kuat' },
                    { id: 'kayu', label: 'Kayu Triplek', desc: 'Serap sebagian' },
                    { id: 'busa', label: 'Busa Akustik', desc: 'Serap total' }
                  ].map((mat) => (
                    <button
                      key={mat.id}
                      onClick={() => setWallMaterial(mat.id as 'beton' | 'kayu' | 'busa')}
                      className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        wallMaterial === mat.id
                          ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400'
                      }`}
                    >
                      <div className="font-semibold">{mat.label}</div>
                      <div className="text-[10px] text-slate-500">{mat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleTestPulse}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                <Play className="h-3.5 w-3.5 text-cyan-400" />
                <span>Uji Tembak Pulsa Bunyi (Dengar Pantulan)</span>
              </button>
            </>
          )}

          {soundMode === 'peredam' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs font-semibold">Mekanisme Kerja Busa Akustik Piramida</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Bentuk baji piramida memecah arah gelombang pantulan. Gelombang bunyi merambat masuk ke pori-pori mikro busa, menyebabkan gesekan molekuler udara yang mengubah energi getaran mekanik menjadi energi kalor (panas), mencegah terjadinya gaung.
                </p>
              </div>

              <button
                onClick={handleTestPulse}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                <Play className="h-3.5 w-3.5 text-cyan-400" />
                <span>Uji Pulsa Bunyi di Ruang Berperedam</span>
              </button>
            </div>
          )}
        </div>

        {/* Scientific Formulas */}
        {soundMode === 'longitudinal' && (
          <FormulaCard
            title="Persamaan Dasar Gelombang Mekanik Bunyi"
            formula="v = λ · f  |  λ = v / f"
            principle="Bunyi adalah gelombang longitudinal mekanik yang membutuhkan medium perambatan. Partikel medium tidak berpindah secara permanen, melainkan berosilasi bolak-balik menghasilkan area kerapatan (tekanan tinggi) dan renggangan (tekanan rendah)."
            liveResult={{
              label: 'Panjang Gelombang (λ)',
              value: `${wavelength.toFixed(2)} meter`
            }}
            variables={[
              { symbol: 'v', meaning: 'Cepat rambat bunyi', unit: 'm/s' },
              { symbol: 'λ', meaning: 'Panjang gelombang', unit: 'm' },
              { symbol: 'f', meaning: 'Frekuensi bunyi', unit: 'Hz' },
              { symbol: 'T', meaning: 'Periode gelombang (1/f)', unit: 's' }
            ]}
          />
        )}

        {soundMode === 'pemantulan' && (
          <FormulaCard
            title="Hukum Pemantulan Bunyi & Jarak Penghalang"
            formula="d = (v · Δt) / 2  |  Δt = 2d / v"
            principle={
              isGema
                ? 'GEMA (Echo): Jarak pemantul cukup jauh (≥ 17 m). Jeda waktu kedatangan bunyi pantul cukup lama (Δt ≥ 0.1 s) sehingga telinga manusia dapat membedakan bunyi asli dan bunyi pantul secara utuh.'
                : 'GAUNG / KERDAM: Jarak pemantul dekat (< 17 m). Bunyi pantul datang bersamaan saat bunyi asli belum selesai diucapkan, mengakibatkan suara terdengar tidak jelas dan bising.'
            }
            liveResult={{
              label: 'Jeda Pantul Bunyi (Δt)',
              value: `${echoDelay.toFixed(3)} detik`
            }}
            variables={[
              { symbol: 'd', meaning: 'Jarak sumber bunyi ke dinding', unit: 'm' },
              { symbol: 'v', meaning: 'Cepat rambat bunyi di udara', unit: 'm/s' },
              { symbol: 'Δt', meaning: 'Waktu tempuh bolak-balik', unit: 's' }
            ]}
          />
        )}

        {soundMode === 'peredam' && (
          <FormulaCard
            title="Koefisien Penyerapan Akustik (Absorption Coefficient)"
            formula="I_serap = α · I_datang  |  I_pantul = (1 - α) · I_datang"
            principle="Bahan peredam memiliki koefisien serap mendekati 1 (α ~ 0.85 - 0.98). Energi gelombang yang masuk ke jaringan busa sel terbuka didispersikan oleh gesekan viskos udara dengan serat mikro, menyerap lebih dari 90% intensitas bunyi."
            liveResult={{
              label: 'Daya Redam Busa Akustik',
              value: 'α = 0.92 (92% terserap)'
            }}
            variables={[
              { symbol: 'α', meaning: 'Koefisien absorbsi akustik (0 s.d 1)' },
              { symbol: 'I_datang', meaning: 'Intensitas bunyi datang', unit: 'W/m²' },
              { symbol: 'I_pantul', meaning: 'Intensitas bunyi yang memantul', unit: 'W/m²' }
            ]}
          />
        )}
      </div>
    </div>
  );
};
