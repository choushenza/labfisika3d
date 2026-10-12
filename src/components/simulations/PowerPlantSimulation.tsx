import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PowerPlantType } from '../../types/physics';
import { ParameterSlider } from '../ui/ParameterSlider';
import { FormulaCard } from '../ui/FormulaCard';
import { Rotate3d, Zap, Droplets, Wind, Sun, Power } from 'lucide-react';

export const PowerPlantSimulation: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [plantType, setPlantType] = useState<PowerPlantType>('plta');

  // PLTA Hydro parameters
  const [waterFlowRate, setWaterFlowRate] = useState<number>(40); // m^3/s (Q)
  const [damHeight, setDamHeight] = useState<number>(25); // meter (h)
  const [hydroEfficiency, setHydroEfficiency] = useState<number>(85); // %

  // PLTB Wind parameters
  const [windSpeed, setWindSpeed] = useState<number>(12); // m/s
  const [bladeLength, setBladeLength] = useState<number>(30); // meter
  const [windEfficiency, setWindEfficiency] = useState<number>(45); // % (Betz limit)

  // PLTS Solar parameters
  const [solarIrradiance, setSolarIrradiance] = useState<number>(800); // W/m^2
  const [panelArea, setPanelArea] = useState<number>(150); // m^2
  const [solarEfficiency, setSolarEfficiency] = useState<number>(20); // %

  // Calculations
  // PLTA: P = eta * rho * g * Q * h (Watts)
  const rhoWater = 1000; // kg/m^3
  const g = 9.81;
  const hydroPowerKw = (hydroEfficiency / 100) * rhoWater * g * waterFlowRate * damHeight / 1000;

  // PLTB: P = 0.5 * rho_air * A * v^3 * Cp
  const rhoAir = 1.225; // kg/m^3
  const rotorArea = Math.PI * Math.pow(bladeLength, 2);
  const windPowerKw = (0.5 * rhoAir * rotorArea * Math.pow(windSpeed, 3) * (windEfficiency / 100)) / 1000;

  // PLTS: P = I * A * eta
  const solarPowerKw = (solarIrradiance * panelArea * (solarEfficiency / 100)) / 1000;

  // Active output power based on current type
  const currentOutputKw =
    plantType === 'plta' ? hydroPowerKw : plantType === 'pltb' ? windPowerKw : solarPowerKw;

  // Number of homes powered (~900W per average home)
  const homesPowered = Math.floor((currentOutputKw * 1000) / 900);

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const dynamicGroupRef = useRef<THREE.Group | null>(null);
  const rotorMeshRef = useRef<THREE.Group | null>(null);
  const generatorRotorRef = useRef<THREE.Mesh | null>(null);
  const waterParticlesRef = useRef<THREE.Points | null>(null);
  const photonParticlesRef = useRef<THREE.Points | null>(null);

  // Setup Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 8, 22);
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
    const ambLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    const dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);
    dynamicGroupRef.current = dynamicGroup;

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      controls.update();

      // Rotate Turbine Blades & Generators
      if (plantType === 'plta' && rotorMeshRef.current) {
        // Hydro turbine spin speed tied to flow rate
        const spinSpeed = (waterFlowRate / 40) * 4;
        rotorMeshRef.current.rotation.y += spinSpeed * dt;
        if (generatorRotorRef.current) {
          generatorRotorRef.current.rotation.y += spinSpeed * 2 * dt;
        }

        // Water particles flowing down penstock
        if (waterParticlesRef.current) {
          const positions = waterParticlesRef.current.geometry.attributes.position.array as Float32Array;
          for (let i = 1; i < positions.length; i += 3) {
            positions[i] -= 12 * dt * (waterFlowRate / 30);
            if (positions[i] < -3) {
              positions[i] = 7;
            }
          }
          waterParticlesRef.current.geometry.attributes.position.needsUpdate = true;
        }
      } else if (plantType === 'pltb' && rotorMeshRef.current) {
        // Wind turbine spin tied to wind speed
        const spinSpeed = (windSpeed / 12) * 3;
        rotorMeshRef.current.rotation.z += spinSpeed * dt;
        if (generatorRotorRef.current) {
          generatorRotorRef.current.rotation.x += spinSpeed * 5 * dt; // gearbox multiplier
        }
      } else if (plantType === 'plts' && photonParticlesRef.current) {
        // Sunlight photons falling into solar cells
        const positions = photonParticlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] -= 14 * dt * (solarIrradiance / 800);
          if (positions[i] < 0) {
            positions[i] = 10;
          }
        }
        photonParticlesRef.current.geometry.attributes.position.needsUpdate = true;
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
      renderer.dispose();
    };
  }, [plantType, waterFlowRate, windSpeed, solarIrradiance]);

  // Build 3D Models for PLTA, PLTB, or PLTS
  useEffect(() => {
    const group = dynamicGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
    rotorMeshRef.current = null;
    generatorRotorRef.current = null;
    waterParticlesRef.current = null;
    photonParticlesRef.current = null;

    if (plantType === 'plta') {
      // PLTA: Hydro Dam, Penstock Pipe, Turbine Runner, Generator, City Grid Lamp
      // Dam wall concrete
      const damMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
      const dam = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 4), damMat);
      dam.position.set(-6, 3, 0);
      group.add(dam);

      // Water Reservoir on top of dam
      const waterMat = new THREE.MeshPhysicalMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.65,
        roughness: 0.1
      });
      const waterReservoir = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 3.8), waterMat);
      waterReservoir.position.set(-8, 5.5, 0);
      group.add(waterReservoir);

      // Penstock pipe (diagonal pipe down to turbine)
      const pipeGeom = new THREE.CylinderGeometry(0.9, 0.9, 8, 24);
      const pipeMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
      const pipe = new THREE.Mesh(pipeGeom, pipeMat);
      pipe.position.set(-2, 2, 0);
      pipe.rotation.z = -Math.PI / 4;
      group.add(pipe);

      // Water flow particles inside penstock
      const particleCount = 200;
      const pGeom = new THREE.BufferGeometry();
      const pPositions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        pPositions[i * 3] = -2 + (Math.random() - 0.5) * 0.8;
        pPositions[i * 3 + 1] = Math.random() * 8 - 1;
        pPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
      }
      pGeom.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
      const pMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.25, transparent: true, opacity: 0.8 });
      const waterPoints = new THREE.Points(pGeom, pMat);
      waterParticlesRef.current = waterPoints;
      group.add(waterPoints);

      // Hydro Turbine Runner (Blades)
      const turbineRunner = new THREE.Group();
      turbineRunner.position.set(1.5, -2, 0);

      const hubGeom = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 24);
      const hubMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.7 });
      const hub = new THREE.Mesh(hubGeom, hubMat);
      turbineRunner.add(hub);

      // 6 curved turbine blades
      for (let b = 0; b < 6; b++) {
        const bladeGeom = new THREE.BoxGeometry(1.6, 0.1, 0.5);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8 });
        const blade = new THREE.Mesh(bladeGeom, bladeMat);
        blade.position.x = Math.cos((b / 6) * Math.PI * 2) * 1.2;
        blade.position.z = Math.sin((b / 6) * Math.PI * 2) * 1.2;
        blade.rotation.y = (b / 6) * Math.PI * 2 + 0.4;
        turbineRunner.add(blade);
      }
      rotorMeshRef.current = turbineRunner;
      group.add(turbineRunner);

      // Generator Stator & Rotor above turbine
      const genHousingGeom = new THREE.CylinderGeometry(1.8, 1.8, 2.2, 32);
      const genHousingMat = new THREE.MeshPhysicalMaterial({
        color: 0x1e293b,
        transparent: true,
        opacity: 0.5,
        roughness: 0.3
      });
      const genHousing = new THREE.Mesh(genHousingGeom, genHousingMat);
      genHousing.position.set(1.5, 0.5, 0);
      group.add(genHousing);

      // Copper coils & magnetic rotor inside
      const rotorGeom = new THREE.CylinderGeometry(1.2, 1.2, 1.8, 16);
      const rotorMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
      const genRotor = new THREE.Mesh(rotorGeom, rotorMat);
      genRotor.position.set(1.5, 0.5, 0);
      generatorRotorRef.current = genRotor;
      group.add(genRotor);

      // Glowing power line & Light bulb output
      const wireGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(1.5, 1.6, 0),
        new THREE.Vector3(6, 1.6, 0),
        new THREE.Vector3(6, 3, 0)
      ]);
      const wire = new THREE.Line(wireGeom, new THREE.LineBasicMaterial({ color: 0x22c55e, linewidth: 3 }));
      group.add(wire);

      // Bulb Mesh
      const bulbGeom = new THREE.SphereGeometry(1, 24, 24);
      const bulbMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xfacc15,
        emissiveIntensity: Math.min(2.0, currentOutputKw / 2000),
        roughness: 0.1
      });
      const bulb = new THREE.Mesh(bulbGeom, bulbMat);
      bulb.position.set(6, 3.8, 0);
      group.add(bulb);
    } else if (plantType === 'pltb') {
      // PLTB: Wind Turbine Tower, Nacelle, 3 Aerodynamic Rotor Blades, Gearbox, Generator
      // Tower
      const towerGeom = new THREE.CylinderGeometry(0.6, 1.2, 14, 32);
      const towerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.4 });
      const tower = new THREE.Mesh(towerGeom, towerMat);
      tower.position.set(0, -1, 0);
      group.add(tower);

      // Nacelle (Engine Housing at top)
      const nacelleGeom = new THREE.BoxGeometry(2.4, 1.6, 4.5);
      const nacelleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });
      const nacelle = new THREE.Mesh(nacelleGeom, nacelleMat);
      nacelle.position.set(0, 6, 0.5);
      group.add(nacelle);

      // 3 Blades Rotor
      const rotorGroup = new THREE.Group();
      rotorGroup.position.set(0, 6, 3);

      const noseCone = new THREE.Mesh(
        new THREE.ConeGeometry(0.9, 1.6, 24),
        new THREE.MeshStandardMaterial({ color: 0x0284c7 })
      );
      noseCone.rotation.x = Math.PI / 2;
      rotorGroup.add(noseCone);

      // 3 Aerodynamic blades 120 deg apart
      for (let i = 0; i < 3; i++) {
        const bladeMesh = new THREE.Mesh(
          new THREE.ConeGeometry(0.4, 7.5, 16),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 })
        );
        bladeMesh.position.y = 3.6;
        const bladePivot = new THREE.Group();
        bladePivot.rotation.z = (i * Math.PI * 2) / 3;
        bladePivot.add(bladeMesh);
        rotorGroup.add(bladePivot);
      }
      rotorMeshRef.current = rotorGroup;
      group.add(rotorGroup);

      // High-speed Generator inside nacelle
      const genMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 1.5, 16),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 })
      );
      genMesh.position.set(0, 6, -0.6);
      generatorRotorRef.current = genMesh;
      group.add(genMesh);

      // Transformer and Grid Substation at base
      const subStation = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 2, 2.5),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 })
      );
      subStation.position.set(5, -6.5, 0);
      group.add(subStation);
    } else {
      // PLTS: Solar PV Panel (PN Junction cross-section), Sunlight photons, Electron flow, Inverter
      // Sun sphere
      const sunGeom = new THREE.SphereGeometry(2, 24, 24);
      const sunMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      const sun = new THREE.Mesh(sunGeom, sunMat);
      sun.position.set(-8, 9, -5);
      group.add(sun);

      // Sunlight Photons Stream
      const photonCount = 150;
      const photonGeom = new THREE.BufferGeometry();
      const photonPos = new Float32Array(photonCount * 3);
      for (let p = 0; p < photonCount; p++) {
        photonPos[p * 3] = (Math.random() - 0.5) * 8;
        photonPos[p * 3 + 1] = Math.random() * 10;
        photonPos[p * 3 + 2] = (Math.random() - 0.5) * 6;
      }
      photonGeom.setAttribute('position', new THREE.BufferAttribute(photonPos, 3));
      const photonPoints = new THREE.Points(
        photonGeom,
        new THREE.PointsMaterial({ color: 0xfef08a, size: 0.35, transparent: true, opacity: 0.85 })
      );
      photonParticlesRef.current = photonPoints;
      group.add(photonPoints);

      // 3D Solar Panel Mount
      const panelGroup = new THREE.Group();
      panelGroup.rotation.x = -Math.PI / 6;

      // Photovoltaic Silicon Layers:
      // Anti-reflective Glass coating
      const glassLayer = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.1, 6),
        new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4, roughness: 0.05 })
      );
      glassLayer.position.y = 0.35;
      panelGroup.add(glassLayer);

      // N-type Silicon (Negative / Excess Electrons)
      const nTypeLayer = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.25, 6),
        new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.3 })
      );
      nTypeLayer.position.y = 0.15;
      panelGroup.add(nTypeLayer);

      // P-N Junction Depletion Boundary
      const pnLayer = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.05, 6),
        new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.5 })
      );
      pnLayer.position.y = 0;
      panelGroup.add(pnLayer);

      // P-type Silicon (Positive / Electron Holes)
      const pTypeLayer = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.25, 6),
        new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.3 })
      );
      pTypeLayer.position.y = -0.15;
      panelGroup.add(pTypeLayer);

      // Metal base frame
      const frameMesh = new THREE.Mesh(
        new THREE.BoxGeometry(8.4, 0.4, 6.4),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 })
      );
      frameMesh.position.y = -0.45;
      panelGroup.add(frameMesh);
      group.add(panelGroup);

      // Inverter Box (DC to AC Converter)
      const inverterMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
      const inverter = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 1.5), inverterMat);
      inverter.position.set(7, -2, 0);
      group.add(inverter);
    }
  }, [plantType, currentOutputKw]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* 3D Visual Sandbox Canvas (Left 7 cols) */}
      <div className="lg:col-span-7 flex flex-col space-y-3">
        {/* Plant Type Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setPlantType('plta')}
            className={`flex items-center gap-2 px-3 py-1.5 font-medium rounded-lg transition-all whitespace-nowrap ${
              plantType === 'plta' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Droplets className="h-3.5 w-3.5" />
            <span>PLTA (Air / Hydro)</span>
          </button>
          <button
            onClick={() => setPlantType('pltb')}
            className={`flex items-center gap-2 px-3 py-1.5 font-medium rounded-lg transition-all whitespace-nowrap ${
              plantType === 'pltb' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wind className="h-3.5 w-3.5" />
            <span>PLTB (Kincir Angin / Bayu)</span>
          </button>
          <button
            onClick={() => setPlantType('plts')}
            className={`flex items-center gap-2 px-3 py-1.5 font-medium rounded-lg transition-all whitespace-nowrap ${
              plantType === 'plts' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
            <span>PLTS (Panel Surya / Solar)</span>
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

          {/* Live Power Generation Metric Badge */}
          <div className="absolute top-3 right-3 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-cyan-500/30 shadow-lg">
            <Zap className="h-4 w-4 text-amber-400 animate-pulse" />
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Daya Listrik Dihasilkan:</span>
              <span className="font-mono text-sm font-bold text-cyan-400 tabular-nums">
                {currentOutputKw.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kW
              </span>
            </div>
          </div>

          {/* Dynamic Physics HUD */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/70 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800/80 pointer-events-none">
            <span>
              {plantType === 'plta' && (
                <>
                  Energi Potensial Air (Ep=mgh) → Kinetik memutar Sudu Turbin → Induksi Elektromagnet Generator → Daya Listrik (kW).
                </>
              )}
              {plantType === 'pltb' && (
                <>
                  Energi Kinetik Angin → Gaya Angkat Aerodinamis Sudu → Gearbox Pengali Putaran → Generator AC 3-Fasa.
                </>
              )}
              {plantType === 'plts' && (
                <>
                  Foton Matahari (h·f) → Eksitasi Elektron Semikonduktor Silikon (P-N Junction) → Arus DC → Inverter AC.
                </>
              )}
            </span>
            <span className="font-mono text-cyan-400 shrink-0">
              ≈ {homesPowered.toLocaleString('id-ID')} Rumah Tangga
            </span>
          </div>
        </div>
      </div>

      {/* Control Deck & Scientific Explanation (Right 5 cols) */}
      <div className="lg:col-span-5 flex flex-col space-y-4">
        {/* Dynamic Controls based on selected plant type */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white">Parameter Pembangkit</h3>
            <span className="text-xs text-cyan-400 font-mono">
              {plantType === 'plta' && 'Pembangkit Hidro'}
              {plantType === 'pltb' && 'Pembangkit Aerodinamis'}
              {plantType === 'plts' && 'Pembangkit Fotovoltaik'}
            </span>
          </div>

          {plantType === 'plta' && (
            <div className="space-y-4">
              <ParameterSlider
                label="Debit Aliran Air (Q)"
                value={waterFlowRate}
                min={10}
                max={100}
                step={5}
                unit="m³/s"
                symbol="Q"
                onChange={setWaterFlowRate}
                description="Volume air bendungan yang mengalir melalui pipa pesat setiap detiknya."
              />

              <ParameterSlider
                label="Ketinggian Jatuh Air (Head h)"
                value={damHeight}
                min={10}
                max={60}
                step={2}
                unit="meter"
                symbol="h"
                onChange={setDamHeight}
                description="Ketinggian permukaan reservoir air bendungan relatif terhadap turbin."
              />

              <ParameterSlider
                label="Efisiensi Total Turbin & Generator"
                value={hydroEfficiency}
                min={50}
                max={95}
                step={1}
                unit="%"
                symbol="η"
                onChange={setHydroEfficiency}
                description="Efisiensi konversi mekanik ke elektrik turbin air modern."
              />
            </div>
          )}

          {plantType === 'pltb' && (
            <div className="space-y-4">
              <ParameterSlider
                label="Kecepatan Angin (v)"
                value={windSpeed}
                min={3}
                max={25}
                step={0.5}
                unit="m/s"
                symbol="v"
                onChange={setWindSpeed}
                description="Daya angin meningkat secara eksponensial sebanding dengan pangkat tiga kecepatan angin (v³)."
              />

              <ParameterSlider
                label="Panjang Sudu Kincir (R)"
                value={bladeLength}
                min={15}
                max={60}
                step={5}
                unit="meter"
                symbol="R"
                onChange={setBladeLength}
                description="Jari-jari sapuan baling-baling menentukan luas area tangkapan angin A = π · R²."
              />

              <ParameterSlider
                label="Koefisien Daya Sudu (Cp)"
                value={windEfficiency}
                min={20}
                max={59}
                step={1}
                unit="%"
                symbol="Cp"
                onChange={setWindEfficiency}
                description="Batas teoretis Hukum Betz menyatakan efisiensi maksimum kincir angin adalah 59.3%."
              />
            </div>
          )}

          {plantType === 'plts' && (
            <div className="space-y-4">
              <ParameterSlider
                label="Intensitas Radiasi Sinar Matahari"
                value={solarIrradiance}
                min={200}
                max={1200}
                step={50}
                unit="W/m²"
                symbol="I"
                onChange={setSolarIrradiance}
                description="Fluks radiasi foton surya yang jatuh tegak lurus pada permukaan panel surya."
              />

              <ParameterSlider
                label="Total Luas Permukaan Panel"
                value={panelArea}
                min={20}
                max={500}
                step={10}
                unit="m²"
                symbol="A"
                onChange={setPanelArea}
                description="Total area penampang sel surya monokristalin atau polikristalin."
              />

              <ParameterSlider
                label="Efisiensi Sel Fotovoltaik"
                value={solarEfficiency}
                min={10}
                max={26}
                step={1}
                unit="%"
                symbol="η"
                onChange={setSolarEfficiency}
                description="Persentase foton matahari yang berhasil dikonversi menjadi energi listrik."
              />
            </div>
          )}
        </div>

        {/* Scientific Formulas & Theories */}
        {plantType === 'plta' && (
          <FormulaCard
            title="Persamaan Daya Listrik Hidroelektrik (PLTA)"
            formula="P = η · ρ · g · Q · h  |  E = m · g · h"
            principle="Air yang tersimpan di ketinggian memiliki energi potensial gravitasi Ep. Saat katup dibuka, air berakselerasi melalui penstock mengubah Ep menjadi energi kinetik Ek. Semburan air menabrak sudu turbin Francis/Pelton memutar poros rotor magnet, memicu induksi elektromagnetik Faraday pada kumparan stator."
            liveResult={{
              label: 'Total Daya Listrik Output',
              value: `${hydroPowerKw.toFixed(1)} kW`
            }}
            variables={[
              { symbol: 'η', meaning: `Efisiensi sistem (${hydroEfficiency}%)` },
              { symbol: 'ρ', meaning: 'Massa jenis air (1000 kg/m³)' },
              { symbol: 'Q', meaning: 'Debit aliran air', unit: 'm³/s' },
              { symbol: 'h', meaning: 'Ketinggian jatuh efektif', unit: 'm' }
            ]}
          />
        )}

        {plantType === 'pltb' && (
          <FormulaCard
            title="Persamaan Daya Kincir Angin & Batas Betz (PLTB)"
            formula="P = 1/2 · ρ · A · v³ · Cp  |  Cp ≤ 16/27 (59.3%)"
            principle="Udara yang bergerak membawa massa dan energi kinetik. Karena daya berbanding lurus dengan kubik kecepatan angin (v³), peningkatan kecepatan angin 2x lipat akan melipatgandakan potensi daya listrik hingga 8x lipat. Gearbox mengubah putaran pelan sudu (~15 rpm) menjadi putaran tinggi (~1500 rpm) untuk generator."
            liveResult={{
              label: 'Daya Kincir Angin (PLTB)',
              value: `${windPowerKw.toFixed(1)} kW`
            }}
            variables={[
              { symbol: 'ρ', meaning: 'Massa jenis udara (~1.225 kg/m³)' },
              { symbol: 'A', meaning: 'Luas sapuan rotor (π·R²)', unit: 'm²' },
              { symbol: 'v', meaning: 'Kecepatan angin', unit: 'm/s' },
              { symbol: 'Cp', meaning: 'Koefisien daya Betz' }
            ]}
          />
        )}

        {plantType === 'plts' && (
          <FormulaCard
            title="Persamaan Efek Fotovoltaik & Konversi Surya (PLTS)"
            formula="P = I · A · η  |  E_foton = h · f ≥ E_bandgap"
            principle="Foton cahaya matahari dengan energi kuantum E=hf menembus sambungan semikonduktor PN silikon. Foton diserap atom, mengeksitasi elektron pita valensi melompati pita celah energi (bandgap) menuju pita konduksi. Medan listrik internal sambungan PN mengarahkan aliran elektron bebas menjadi arus searah (DC)."
            liveResult={{
              label: 'Daya Panel Surya (PLTS)',
              value: `${solarPowerKw.toFixed(1)} kW`
            }}
            variables={[
              { symbol: 'I', meaning: 'Intensitas iradiansi surya', unit: 'W/m²' },
              { symbol: 'A', meaning: 'Luas aktif sel silikon', unit: 'm²' },
              { symbol: 'η', meaning: 'Efisiensi konversi fotovoltaik' },
              { symbol: 'h', meaning: 'Konstanta Planck (6.626×10⁻³⁴ J·s)' }
            ]}
          />
        )}
      </div>
    </div>
  );
};
