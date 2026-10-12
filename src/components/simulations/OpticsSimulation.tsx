import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OpticsMode, MirrorType } from '../../types/physics';
import { ParameterSlider } from '../ui/ParameterSlider';
import { FormulaCard } from '../ui/FormulaCard';
import { Rotate3d, Eye, Sparkles, Layers, HelpCircle } from 'lucide-react';

export const OpticsSimulation: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [subMode, setSubMode] = useState<OpticsMode>('prisma');

  // Prisma Parameters
  const [incidentAngle, setIncidentAngle] = useState<number>(45); // degrees
  const [prismMaterial, setPrismMaterial] = useState<string>('crown'); // crown (1.52), flint (1.66), diamond (2.42)
  const [lightMode, setLightMode] = useState<'white' | 'laser'>('white');

  // Mirror Parameters
  const [mirrorType, setMirrorType] = useState<MirrorType>('cekung');
  const [focalLength, setFocalLength] = useState<number>(6); // cm
  const [objectDistance, setObjectDistance] = useState<number>(10); // cm
  const [objectHeight, setObjectHeight] = useState<number>(4); // cm

  // Periscope Parameters
  const [periscopeMirrorAngle, setPeriscopeMirrorAngle] = useState<number>(45);

  // Pensil Air Parameters
  const [liquidIndex, setLiquidIndex] = useState<number>(1.33);

  // References for three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const dynamicGroupRef = useRef<THREE.Group | null>(null);

  // Calculation for mirror image
  const f = mirrorType === 'datar' ? Infinity : mirrorType === 'cekung' ? focalLength : -focalLength;
  let imageDistance = 0;
  let magnification = 1;
  let isReal = true;
  let isUpright = true;

  if (mirrorType === 'datar') {
    imageDistance = -objectDistance;
    magnification = 1;
    isReal = false;
    isUpright = true;
  } else {
    // 1/f = 1/s + 1/s' => 1/s' = 1/f - 1/s => s' = (s * f) / (s - f)
    const diff = objectDistance - f;
    if (Math.abs(diff) < 0.001) {
      imageDistance = Infinity; // di tak hingga
      magnification = Infinity;
    } else {
      imageDistance = (objectDistance * f) / diff;
      magnification = Math.abs(imageDistance / objectDistance);
      isReal = imageDistance > 0;
      isUpright = (imageDistance / objectDistance) < 0; // if s' is negative (virtual), upright
    }
  }

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
    renderer.shadowMap.enabled = true;
    mountRef.current.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controlsRef.current = controls;

    // Ambient & directional lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    // Floor grid
    const grid = new THREE.GridHelper(30, 30, 0x1e293b, 0x0f172a);
    grid.position.y = -4;
    scene.add(grid);

    const dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);
    dynamicGroupRef.current = dynamicGroup;

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
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
  }, []);

  // Update 3D elements based on submode & parameters
  useEffect(() => {
    const group = dynamicGroupRef.current;
    if (!group) return;

    // Clear old geometry
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
    }

    if (subMode === 'prisma') {
      // Build Triangular Prism
      const prismHeight = 6;
      const prismSide = 6;
      const shape = new THREE.Shape();
      const hTri = (Math.sqrt(3) / 2) * prismSide;
      shape.moveTo(0, hTri / 2);
      shape.lineTo(-prismSide / 2, -hTri / 2);
      shape.lineTo(prismSide / 2, -hTri / 2);
      shape.closePath();

      const extrudeSettings = { depth: prismHeight, bevelEnabled: false };
      const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geom.center();

      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x93c5fd,
        transparent: true,
        opacity: 0.35,
        roughness: 0.05,
        transmission: 0.9,
        ior: prismMaterial === 'diamond' ? 2.42 : prismMaterial === 'flint' ? 1.66 : 1.52,
        reflectivity: 0.5,
        clearcoat: 1.0,
      });

      const prismMesh = new THREE.Mesh(geom, glassMat);
      prismMesh.rotation.x = Math.PI / 2;
      group.add(prismMesh);

      // Prism stand
      const standGeom = new THREE.CylinderGeometry(2, 2.4, 0.4, 32);
      const standMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
      const stand = new THREE.Mesh(standGeom, standMat);
      stand.position.y = -3.5;
      group.add(stand);

      // Screen / Target plate where rainbow lands
      const screenGeom = new THREE.BoxGeometry(0.2, 7, 7);
      const screenMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
      const screen = new THREE.Mesh(screenGeom, screenMat);
      screen.position.set(9, 0, 0);
      group.add(screen);

      // Light source lamp
      const lampGeom = new THREE.CylinderGeometry(0.5, 0.7, 2, 16);
      const lampMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 });
      const lamp = new THREE.Mesh(lampGeom, lampMat);
      const rad = (incidentAngle * Math.PI) / 180;
      lamp.position.set(-10 * Math.cos(rad), 0, -10 * Math.sin(rad));
      lamp.lookAt(0, 0, 0);
      group.add(lamp);

      // Incident ray (White or Laser)
      const rayPoints = [
        new THREE.Vector3(-9 * Math.cos(rad), 0, -9 * Math.sin(rad)),
        new THREE.Vector3(-1.8, 0, 0)
      ];
      const rayGeom = new THREE.BufferGeometry().setFromPoints(rayPoints);
      const rayMat = new THREE.LineBasicMaterial({
        color: lightMode === 'white' ? 0xffffff : 0x22c55e,
        linewidth: 4
      });
      const incidentLine = new THREE.Line(rayGeom, rayMat);
      group.add(incidentLine);

      // Dispersion rays (Rainbow spectrum Red to Violet)
      const spectrum = [
        { color: 0xef4444, name: 'Merah (700nm)', dev: 0.75 },
        { color: 0xf97316, name: 'Jingga (620nm)', dev: 0.80 },
        { color: 0xeab308, name: 'Kuning (580nm)', dev: 0.85 },
        { color: 0x22c55e, name: 'Hijau (530nm)', dev: 0.90 },
        { color: 0x06b6d4, name: 'Biru (470nm)', dev: 0.95 },
        { color: 0x8b5cf6, name: 'Ungu (400nm)', dev: 1.02 }
      ];

      const rayList = lightMode === 'white' ? spectrum : [spectrum[3]];

      rayList.forEach((spec, idx) => {
        // Dispersion bends through prism and out to screen
        const midPoint = new THREE.Vector3(0, (idx - 2.5) * 0.1, 0.2);
        const yOffset = (idx - 2.5) * 0.6 * spec.dev;
        const screenPoint = new THREE.Vector3(8.9, yOffset, (idx - 2.5) * 0.3);

        const internalGeom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-1.8, 0, 0),
          midPoint
        ]);
        const internalLine = new THREE.Line(
          internalGeom,
          new THREE.LineBasicMaterial({ color: spec.color, transparent: true, opacity: 0.8 })
        );
        group.add(internalLine);

        const refractedGeom = new THREE.BufferGeometry().setFromPoints([midPoint, screenPoint]);
        const refractedLine = new THREE.Line(
          refractedGeom,
          new THREE.LineBasicMaterial({ color: spec.color, linewidth: 3 })
        );
        group.add(refractedLine);

        // Rainbow spot on screen
        const spotGeom = new THREE.PlaneGeometry(0.3, 0.4);
        const spotMat = new THREE.MeshBasicMaterial({ color: spec.color, side: THREE.DoubleSide });
        const spot = new THREE.Mesh(spotGeom, spotMat);
        spot.position.copy(screenPoint);
        spot.position.x -= 0.05;
        spot.rotation.y = Math.PI / 2;
        group.add(spot);
      });
    } else if (subMode === 'pensil-air') {
      // 3D Glass Beaker with Water & Submerged Pencil
      const beakerGeom = new THREE.CylinderGeometry(3.5, 3.5, 7, 32, 1, true);
      const beakerMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.25,
        transmission: 0.95,
        roughness: 0.05,
        side: THREE.DoubleSide
      });
      const beaker = new THREE.Mesh(beakerGeom, beakerMat);
      group.add(beaker);

      // Water Cylinder
      const waterGeom = new THREE.CylinderGeometry(3.4, 3.4, 4.5, 32);
      const waterMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.45,
        transmission: 0.85,
        roughness: 0.1,
        ior: liquidIndex
      });
      const water = new THREE.Mesh(waterGeom, waterMat);
      water.position.y = -1.2;
      group.add(water);

      // Pencil - Upper part (in air)
      const upperPencilGeom = new THREE.CylinderGeometry(0.25, 0.25, 5, 16);
      const pencilMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
      const upperPencil = new THREE.Mesh(upperPencilGeom, pencilMat);
      upperPencil.position.set(-0.6, 3, 0);
      upperPencil.rotation.z = -Math.PI / 6;
      group.add(upperPencil);

      // Pencil - Lower part (in liquid, visually displaced/broken!)
      const displacement = (liquidIndex - 1.0) * 0.9;
      const lowerPencilGeom = new THREE.CylinderGeometry(0.28, 0.28, 4.5, 16);
      const lowerPencilMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
      const lowerPencil = new THREE.Mesh(lowerPencilGeom, lowerPencilMat);
      lowerPencil.position.set(-0.6 + displacement, -1.5, 0);
      lowerPencil.rotation.z = -Math.PI / 8; // Bent angle!
      group.add(lowerPencil);

      // Air-Liquid interface ring
      const ringGeom = new THREE.RingGeometry(3.3, 3.45, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, side: THREE.DoubleSide, opacity: 0.6, transparent: true });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.y = 1.05;
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
    } else if (subMode === 'periskop') {
      // 3D Periscope Z-Tube with 2 inclined 45 deg mirrors
      const tubeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 });
      
      // Upper horizontal tube
      const topTube = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 2), tubeMat);
      topTube.position.set(-2, 4, 0);
      group.add(topTube);

      // Vertical central shaft
      const vertTube = new THREE.Mesh(new THREE.BoxGeometry(2, 7, 2), tubeMat);
      vertTube.position.set(0, 0.5, 0);
      group.add(vertTube);

      // Lower horizontal tube
      const btmTube = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 2), tubeMat);
      btmTube.position.set(2, -3, 0);
      group.add(btmTube);

      // Upper Mirror (inclined at periscopeMirrorAngle)
      const mirrorMat = new THREE.MeshPhysicalMaterial({
        color: 0xe2e8f0,
        metalness: 0.95,
        roughness: 0.05,
        clearcoat: 1
      });
      const topMirror = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.8), mirrorMat);
      topMirror.position.set(0, 4, 0);
      topMirror.rotation.z = (periscopeMirrorAngle * Math.PI) / 180;
      group.add(topMirror);

      // Lower Mirror (at 45 deg)
      const btmMirror = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.8), mirrorMat);
      btmMirror.position.set(0, -3, 0);
      btmMirror.rotation.z = (periscopeMirrorAngle * Math.PI) / 180;
      group.add(btmMirror);

      // Light beam traveling through periscope
      const rayMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 });
      
      // Ray 1: Target to upper mirror
      const r1 = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-6, 4, 0), new THREE.Vector3(0, 4, 0)]),
        rayMat
      );
      // Ray 2: Upper mirror down to lower mirror
      const r2 = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 4, 0), new THREE.Vector3(0, -3, 0)]),
        rayMat
      );
      // Ray 3: Lower mirror out to observer eye
      const r3 = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -3, 0), new THREE.Vector3(6, -3, 0)]),
        rayMat
      );
      group.add(r1);
      group.add(r2);
      group.add(r3);

      // Target Object (Red beacon)
      const targetGeom = new THREE.ConeGeometry(0.7, 1.8, 16);
      const targetMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
      const target = new THREE.Mesh(targetGeom, targetMat);
      target.position.set(-6, 4, 0);
      target.rotation.z = -Math.PI / 2;
      group.add(target);

      // Observer eye representation
      const eyeGeom = new THREE.SphereGeometry(0.6, 16, 16);
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2 });
      const eye = new THREE.Mesh(eyeGeom, eyeMat);
      eye.position.set(6, -3, 0);
      group.add(eye);
    } else if (subMode === 'cermin') {
      // 3D Optical Bench: Cermin Datar / Cekung / Cembung
      // Optical axis line
      const axisGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-14, 0, 0),
        new THREE.Vector3(14, 0, 0)
      ]);
      const axisLine = new THREE.Line(
        axisGeom,
        new THREE.LineDashedMaterial({ color: 0x475569, dashSize: 0.5, gapSize: 0.2 })
      );
      group.add(axisLine);

      // Mirror mesh
      if (mirrorType === 'datar') {
        const mirrorGeom = new THREE.BoxGeometry(0.2, 8, 4);
        const mirrorMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });
        const mirror = new THREE.Mesh(mirrorGeom, mirrorMat);
        group.add(mirror);
      } else {
        // Curved mirror (Concave or Convex)
        const curveGeom = new THREE.CylinderGeometry(4, 4, 4, 32, 1, true, 0, Math.PI / 3);
        const mirrorMat = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          metalness: 0.95,
          roughness: 0.1,
          side: THREE.DoubleSide
        });
        const mirror = new THREE.Mesh(curveGeom, mirrorMat);
        mirror.rotation.z = Math.PI / 2;
        mirror.rotation.y = mirrorType === 'cekung' ? Math.PI / 3 : -Math.PI / 3;
        group.add(mirror);
      }

      // Focal point F marker and Center of curvature C marker
      if (mirrorType !== 'datar') {
        const fPos = mirrorType === 'cekung' ? -focalLength : focalLength;
        const cPos = fPos * 2;

        const fPoint = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        fPoint.position.set(fPos, 0, 0);
        group.add(fPoint);

        const cPoint = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0xa855f7 })
        );
        cPoint.position.set(cPos, 0, 0);
        group.add(cPoint);
      }

      // Real Object (Candle Arrow) on left side
      const objArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(-objectDistance, 0, 0),
        objectHeight,
        0x22c55e,
        0.8,
        0.4
      );
      group.add(objArrow);

      // Calculated Image Arrow
      if (Number.isFinite(imageDistance)) {
        const imgX = mirrorType === 'datar' ? objectDistance : (imageDistance > 0 ? -imageDistance : -imageDistance);
        const imgH = objectHeight * magnification;
        const imgDir = isUpright ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, -1, 0);

        const imgArrow = new THREE.ArrowHelper(
          imgDir,
          new THREE.Vector3(imgX, 0, 0),
          Math.min(10, Math.max(0.5, imgH)),
          isReal ? 0xef4444 : 0xec4899,
          0.6,
          0.3
        );
        group.add(imgArrow);

        // Ray lines
        const topOfObj = new THREE.Vector3(-objectDistance, objectHeight, 0);
        const ray1 = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([topOfObj, new THREE.Vector3(0, objectHeight, 0)]),
          new THREE.LineBasicMaterial({ color: 0xfacc15, linewidth: 2 })
        );
        group.add(ray1);
      }
    }
  }, [subMode, incidentAngle, prismMaterial, lightMode, mirrorType, focalLength, objectDistance, objectHeight, periscopeMirrorAngle, liquidIndex, f, imageDistance, magnification, isReal, isUpright]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* 3D Visual Sandbox Canvas (Left 7 cols) */}
      <div className="lg:col-span-7 flex flex-col space-y-3">
        {/* Submode Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setSubMode('prisma')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
              subMode === 'prisma' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Prisma & Pelangi
          </button>
          <button
            onClick={() => setSubMode('pensil-air')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
              subMode === 'pensil-air' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pensil dalam Air
          </button>
          <button
            onClick={() => setSubMode('periskop')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
              subMode === 'periskop' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Periskop
          </button>
          <button
            onClick={() => setSubMode('cermin')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
              subMode === 'cermin' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cermin Datar, Cekung & Cembung
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

          {/* Canvas status hint */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/70 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800/80 pointer-events-none">
            <span>
              {subMode === 'prisma' && 'Dispersi cahaya: Frekuensi ungu tertinggi dibiaskan paling tajam.'}
              {subMode === 'pensil-air' && 'Hukum Snellius: Kecepatan cahaya melambat dalam air, membuat pensil tampak patah.'}
              {subMode === 'periskop' && 'Dua cermin 45° memantulkan cahaya 90° berurutan ke mata pengamat.'}
              {subMode === 'cermin' && `Bayangan: ${isReal ? 'Nyata' : 'Maya'} · ${isUpright ? 'Tegak' : 'Terbalik'} · M=${magnification === Infinity ? '∞' : magnification.toFixed(2)}x`}
            </span>
            <span className="font-mono text-cyan-400 shrink-0">Hukum Snellius & Pemantulan</span>
          </div>
        </div>
      </div>

      {/* Control Deck & Scientific Explanation (Right 5 cols) */}
      <div className="lg:col-span-5 flex flex-col space-y-4">
        {/* Dynamic Controls based on selected submode */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white">Parameter Eksperimen</h3>
            <span className="text-xs text-cyan-400 font-mono">
              {subMode === 'prisma' && 'Dispersi Optik'}
              {subMode === 'pensil-air' && 'Pembiasan Medium'}
              {subMode === 'periskop' && 'Pemantulan Ganda'}
              {subMode === 'cermin' && 'Optika Geometri'}
            </span>
          </div>

          {subMode === 'prisma' && (
            <div className="space-y-4">
              <ParameterSlider
                label="Sudut Datang Sinar"
                value={incidentAngle}
                min={15}
                max={75}
                step={1}
                unit="°"
                symbol="θ₁"
                onChange={setIncidentAngle}
                description="Sudut kemiringan berkas sinar yang masuk ke permukaan sisi prisma."
              />

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Bahan Kaca Prisma (Indeks Bias n):</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'crown', label: 'Mahkota', n: '1.52' },
                    { id: 'flint', label: 'Flint', n: '1.66' },
                    { id: 'diamond', label: 'Berlian', n: '2.42' },
                  ].map((mat) => (
                    <button
                      key={mat.id}
                      onClick={() => setPrismMaterial(mat.id)}
                      className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        prismMaterial === mat.id
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold">{mat.label}</div>
                      <div className="font-mono text-[10px] text-slate-500">n = {mat.n}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Sumber Berkas Cahaya:</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLightMode('white')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-all ${
                      lightMode === 'white'
                        ? 'border-cyan-500 bg-cyan-500/20 text-white'
                        : 'border-slate-800 text-slate-400'
                    }`}
                  >
                    Polikromatik (Putih / Pelangi)
                  </button>
                  <button
                    onClick={() => setLightMode('laser')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-all ${
                      lightMode === 'laser'
                        ? 'border-green-500 bg-green-500/20 text-green-300'
                        : 'border-slate-800 text-slate-400'
                    }`}
                  >
                    Monokromatik (Laser 532nm)
                  </button>
                </div>
              </div>
            </div>
          )}

          {subMode === 'pensil-air' && (
            <div className="space-y-4">
              <ParameterSlider
                label="Indeks Bias Cairan"
                value={liquidIndex}
                min={1.0}
                max={1.6}
                step={0.01}
                unit="n"
                symbol="n₂"
                onChange={setLiquidIndex}
                description="Semakin besar indeks bias cairan, semakin tajam cahaya dibelokkan mendekati garis normal."
              />

              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { name: 'Udara Kosong', n: 1.0 },
                  { name: 'Air Murni', n: 1.33 },
                  { name: 'Gliserin / Minyak', n: 1.47 }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setLiquidIndex(item.n)}
                    className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-center text-xs hover:border-cyan-500/50 transition-colors"
                  >
                    <div className="text-slate-300 font-medium">{item.name}</div>
                    <div className="text-[10px] font-mono text-cyan-400">n = {item.n}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {subMode === 'periskop' && (
            <div className="space-y-4">
              <ParameterSlider
                label="Sudut Kemiringan Cermin Atas"
                value={periscopeMirrorAngle}
                min={30}
                max={60}
                step={1}
                unit="°"
                symbol="α"
                onChange={setPeriscopeMirrorAngle}
                description="Periskop sempurna menggunakan sudut tepat 45° agar pantulan cahaya berbelok 90° sempurna."
              />
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <span className="font-semibold text-cyan-400 block">Prinsip Kerja Periskop:</span>
                <p>
                  Sinar dari sasaran menabrak cermin atas dengan sudut datang 45° dan dipantulkan 45° tegak lurus ke bawah, lalu diterima cermin bawah dan dipantulkan kembali 90° langsung ke mata pengamat kapal selam.
                </p>
              </div>
            </div>
          )}

          {subMode === 'cermin' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Tipe Cermin:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['datar', 'cekung', 'cembung'] as MirrorType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setMirrorType(type)}
                      className={`p-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                        mirrorType === type
                          ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {mirrorType !== 'datar' && (
                <ParameterSlider
                  label="Jarak Fokus Cermin"
                  value={focalLength}
                  min={3}
                  max={12}
                  step={0.5}
                  unit="cm"
                  symbol="f"
                  onChange={setFocalLength}
                />
              )}

              <ParameterSlider
                label="Jarak Benda ke Cermin"
                value={objectDistance}
                min={2}
                max={20}
                step={0.5}
                unit="cm"
                symbol="s"
                onChange={setObjectDistance}
              />

              <ParameterSlider
                label="Tinggi Benda"
                value={objectHeight}
                min={1}
                max={8}
                step={0.5}
                unit="cm"
                symbol="h"
                onChange={setObjectHeight}
              />
            </div>
          )}
        </div>

        {/* Scientific Formulas & Theory */}
        {subMode === 'prisma' && (
          <FormulaCard
            title="Hukum Pembiasan Snellius & Dispersi Cauchy"
            formula="n₁ · sin(θ₁) = n₂ · sin(θ₂) | n(λ) = A + B / λ²"
            principle="Cahaya putih tersusun atas berbagai panjang gelombang. Cahaya merah (λ ~ 700 nm) memiliki indeks bias lebih kecil dibandingkan cahaya ungu (λ ~ 400 nm), sehingga ungu dibelokkan lebih kuat dan terurai menjadi spektrum pelangi."
            variables={[
              { symbol: 'n₁, n₂', meaning: 'Indeks bias medium udara dan kaca' },
              { symbol: 'θ₁, θ₂', meaning: 'Sudut datang & sudut bias', unit: 'derajat' },
              { symbol: 'λ', meaning: 'Panjang gelombang cahaya', unit: 'nm' },
              { symbol: 'δ', meaning: 'Sudut deviasi sinar prisma', unit: 'derajat' },
            ]}
          />
        )}

        {subMode === 'pensil-air' && (
          <FormulaCard
            title="Pembiasan Cahaya pada Dua Medium Berbeda"
            formula="sin(θ₁) / sin(θ₂) = n₂ / n₁ = v₁ / v₂"
            principle="Saat berkas cahaya merambat dari medium rapat optik tinggi (air n=1.33) ke medium kurang rapat (udara n=1.0), sinar dibiaskan menjauhi garis normal, membuat posisi semu pensil tampak terangkat dan patah."
            variables={[
              { symbol: 'n₁', meaning: 'Indeks bias udara (~1.0)' },
              { symbol: 'n₂', meaning: 'Indeks bias air murni (~1.333)' },
              { symbol: 'v', meaning: 'Cepat rambat cahaya dalam medium', unit: 'm/s' },
            ]}
          />
        )}

        {subMode === 'periskop' && (
          <FormulaCard
            title="Hukum Pemantulan Cahaya (Snellius)"
            formula="Sudut Datang (θi) = Sudut Pantul (θr)"
            principle="Sinar datang, garis normal, dan sinar pantul terletak pada satu bidang datar. Pada cermin datar periskop dengan sudut 45°, sinar berbelok 90° tepat dua kali sehingga menghasilkan bayangan maya yang tegak sempurna."
            variables={[
              { symbol: 'θi', meaning: 'Sudut sinar datang terhadap normal' },
              { symbol: 'θr', meaning: 'Sudut sinar pantul terhadap normal' },
              { symbol: 'Δθ', meaning: 'Deviasi sudut pantulan per cermin (90°)' },
            ]}
          />
        )}

        {subMode === 'cermin' && (
          <FormulaCard
            title="Persamaan Gauss Cermin Lengkung"
            formula="1/f = 1/s + 1/s' | M = |s'/s| = |h'/h|"
            principle={
              mirrorType === 'cekung'
                ? 'Cermin cekung bersifat konvergen (mengumpulkan sinar). Titik fokus bernilai positif. Bayangan bergantung posisi benda di ruang I, II, atau III.'
                : mirrorType === 'cembung'
                ? 'Cermin cembung bersifat divergen (menyebarkan sinar). Titik fokus bernilai negatif. Bayangan selalu maya, tegak, dan diperkecil (cocok untuk spion).'
                : 'Cermin datar menghasilkan bayangan maya, tegak, dan sama besar (s = -s\', M = 1).'
            }
            liveResult={{
              label: 'Jarak Bayangan (s\')',
              value: Number.isFinite(imageDistance) ? `${imageDistance.toFixed(2)} cm` : 'Tak Hingga (∞)'
            }}
            variables={[
              { symbol: 'f', meaning: 'Jarak fokus cermin', unit: 'cm' },
              { symbol: 's', meaning: 'Jarak benda ke cermin', unit: 'cm' },
              { symbol: 's\'', meaning: 'Jarak bayangan hasil pantulan', unit: 'cm' },
              { symbol: 'M', meaning: 'Perbesaran linier bayangan' },
            ]}
          />
        )}
      </div>
    </div>
  );
};
