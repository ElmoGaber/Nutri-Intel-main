import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Environment, Stars } from "@react-three/drei";
import { useRef, useState, useEffect, Suspense } from "react";
import type { Mesh, Group } from "three";

function AnimatedSphere({ position, color, speed, distort, scale = 1 }: { position: [number, number, number]; color: string; speed: number; distort: number; scale?: number }) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.4;
      ref.current.rotation.x = state.clock.elapsedTime * 0.2;
      ref.current.rotation.z = state.clock.elapsedTime * 0.15;
    }
  });
  return (
    <mesh ref={ref} position={position} scale={scale}>
      <sphereGeometry args={[0.4, 64, 64]} />
      <MeshDistortMaterial color={color} speed={2.5} distort={distort} roughness={0.15} metalness={0.9} />
    </mesh>
  );
}

function FloatingRing({ position, color, rotationSpeed, scale = 1 }: { position: [number, number, number]; color: string; rotationSpeed: number; scale?: number }) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * rotationSpeed;
      ref.current.rotation.z = state.clock.elapsedTime * rotationSpeed * 0.5;
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.2;
    }
  });
  return (
    <mesh ref={ref} position={position} scale={scale}>
      <torusGeometry args={[0.6, 0.08, 16, 100]} />
      <meshStandardMaterial color={color} metalness={0.95} roughness={0.05} emissive={color} emissiveIntensity={0.3} />
    </mesh>
  );
}

function DNAHelix() {
  const groupRef = useRef<Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.4;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });

  const points = [];
  for (let i = 0; i < 24; i++) {
    const t = i * 0.5;
    points.push(
      { pos: [Math.cos(t) * 0.9, t * 0.18 - 2.2, Math.sin(t) * 0.9] as [number, number, number], color: "#3b82f6" },
      { pos: [Math.cos(t + Math.PI) * 0.9, t * 0.18 - 2.2, Math.sin(t + Math.PI) * 0.9] as [number, number, number], color: "#06b6d4" }
    );
  }

  return (
    <group ref={groupRef} position={[3, 0, -2]}>
      {points.map((p, i) => (
        <mesh key={i} position={p.pos}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function PulsingCore() {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
      ref.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.55, 32, 32]} />
      <meshStandardMaterial
        color="#06b6d4"
        emissive="#06b6d4"
        emissiveIntensity={1.2}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}

function CenterPiece() {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.2;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group ref={ref} position={[0, 0, 0]}>
      <Float speed={2.5} rotationIntensity={0.4} floatIntensity={0.6}>
        {/* Central icosahedron */}
        <mesh>
          <icosahedronGeometry args={[1.2, 1]} />
          <MeshDistortMaterial color="#3b82f6" speed={2} distort={0.35} roughness={0.05} metalness={0.95} wireframe />
        </mesh>
        {/* Inner glowing core */}
        <PulsingCore />
      </Float>
    </group>
  );
}

function OrbitRing({ radius, speed, color }: { radius: number; speed: number; color: string }) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = Math.PI / 2 + Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
      ref.current.rotation.z = state.clock.elapsedTime * speed;
    }
  });
  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, 0.012, 16, 100]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.6} />
    </mesh>
  );
}

function ParticleField() {
  const groupRef = useRef<Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.06;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.04) * 0.05;
    }
  });

  const particles = [];
  for (let i = 0; i < 80; i++) {
    const x = (Math.random() - 0.5) * 14;
    const y = (Math.random() - 0.5) * 10;
    const z = (Math.random() - 0.5) * 10 - 3;
    const size = 0.015 + Math.random() * 0.025;
    particles.push({ pos: [x, y, z] as [number, number, number], size });
  }

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i} position={p.pos}>
          <sphereGeometry args={[p.size, 8, 8]} />
          <meshBasicMaterial color={i % 3 === 0 ? "#8b5cf6" : i % 3 === 1 ? "#60a5fa" : "#06b6d4"} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <pointLight position={[-5, 3, -5]} intensity={0.8} color="#3b82f6" />
      <pointLight position={[5, -3, 5]} intensity={0.8} color="#06b6d4" />
      <pointLight position={[0, 5, 0]} intensity={0.4} color="#8b5cf6" />

      <CenterPiece />
      <ParticleField />

      {/* Orbit rings around center */}
      <OrbitRing radius={2} speed={0.3} color="#3b82f6" />
      <OrbitRing radius={2.8} speed={-0.2} color="#8b5cf6" />
      <OrbitRing radius={3.5} speed={0.15} color="#06b6d4" />

      <AnimatedSphere position={[-2.5, -0.5, -1]} color="#3b82f6" speed={1.5} distort={0.45} scale={1.1} />
      <AnimatedSphere position={[2.8, 0.8, -1.5]} color="#06b6d4" speed={1.2} distort={0.35} />
      <AnimatedSphere position={[-1.5, 1.5, -2]} color="#8b5cf6" speed={1.8} distort={0.5} scale={0.9} />
      <AnimatedSphere position={[1.5, -1, -1]} color="#10b981" speed={1} distort={0.4} />
      <AnimatedSphere position={[0, -2, -1.5]} color="#f59e0b" speed={1.3} distort={0.3} scale={0.7} />

      <FloatingRing position={[-3, 1, -3]} color="#3b82f6" rotationSpeed={0.6} scale={1.2} />
      <FloatingRing position={[3.5, -0.5, -2]} color="#06b6d4" rotationSpeed={0.8} />
      <FloatingRing position={[0, 2.5, -3]} color="#8b5cf6" rotationSpeed={0.4} scale={0.8} />

      <DNAHelix />

      <Stars radius={50} depth={50} count={1500} factor={4} saturation={0.5} fade speed={1.5} />

      <Environment preset="city" />
    </>
  );
}

export default function Intro3D({ onComplete }: { onComplete: () => void }) {
  const [opacity, setOpacity] = useState(1);
  const [show, setShow] = useState(true);
  const [textVisible, setTextVisible] = useState(false);
  const [subtitleVisible, setSubtitleVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const textTimer = setTimeout(() => setTextVisible(true), 400);
    const subTimer = setTimeout(() => setSubtitleVisible(true), 900);

    // Progress bar
    const startTime = Date.now();
    const duration = 6000;
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min((elapsed / duration) * 100, 100));
    }, 50);

    const timer = setTimeout(() => {
      setOpacity(0);
      setTimeout(() => {
        setShow(false);
        onComplete();
      }, 800);
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(textTimer);
      clearTimeout(subTimer);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setOpacity(0);
    setTimeout(() => {
      setShow(false);
      onComplete();
    }, 400);
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-950 via-blue-950/90 to-gray-950"
      style={{ opacity, transition: "opacity 0.8s ease-in-out" }}
    >
      <div className="w-full h-full relative">
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
            <Scene />
          </Canvas>
        </Suspense>

        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-gray-950/60 via-transparent to-gray-950/30" />

        {/* Overlay text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{
            opacity: textVisible ? 1 : 0,
            transform: textVisible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.95)",
            transition: "opacity 1.2s ease-out, transform 1.2s ease-out",
          }}
        >
          <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent mb-3 drop-shadow-2xl tracking-tight">
            Nutri-Intel
          </h1>
          <div
            style={{
              opacity: subtitleVisible ? 1 : 0,
              transform: subtitleVisible ? "translateY(0)" : "translateY(10px)",
              transition: "opacity 0.8s ease-out 0.2s, transform 0.8s ease-out 0.2s",
            }}
          >
            <p className="text-sm md:text-lg text-blue-200/60 tracking-[0.35em] uppercase font-light">
              AI-Powered Nutrition Intelligence
            </p>
          </div>
        </div>

        {/* Progress bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute bottom-6 right-6 px-5 py-2 text-sm text-white/30 hover:text-white/80 transition-all border border-white/10 rounded-full hover:border-white/30 hover:bg-white/5 backdrop-blur-sm"
        >
          Skip &rarr;
        </button>

        {/* Loading dots */}
        <div className="absolute bottom-6 left-6 flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
