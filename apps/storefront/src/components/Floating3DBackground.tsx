import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';

function BackgroundGeometries() {
    const torusRef = useRef<THREE.Mesh>(null);
    const icosahedronRef = useRef<THREE.Mesh>(null);
    const cylinderRef = useRef<THREE.Mesh>(null);
    const { camera } = useThree();

    // Mouse parallax for camera
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 0.4;
            const y = (e.clientY / window.innerHeight - 0.5) * -0.2;
            camera.position.x += (x - camera.position.x) * 0.02;
            camera.position.y += (y - camera.position.y) * 0.02;
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [camera]);

    useFrame((_state, delta) => {
        if (torusRef.current) {
            torusRef.current.rotation.x += delta * 0.08;
            torusRef.current.rotation.y += delta * 0.12;
        }
        if (icosahedronRef.current) {
            icosahedronRef.current.rotation.x -= delta * 0.15;
            icosahedronRef.current.rotation.y -= delta * 0.08;
        }
        if (cylinderRef.current) {
            cylinderRef.current.rotation.y += delta * 0.2;
            cylinderRef.current.rotation.z += delta * 0.05;
        }
    });

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
            <directionalLight position={[-5, -5, 5]} intensity={0.5} color="#ff6b5b" />
            <Environment preset="city" />

            {/* Primary: Glassy TorusKnot (Brand Blue) */}
            <Float speed={1.5} rotationIntensity={0.5} floatIntensity={2}>
                <mesh ref={torusRef} position={[2.5, 0.5, -2]} scale={1.2}>
                    <torusKnotGeometry args={[1, 0.3, 128, 32]} />
                    <MeshTransmissionMaterial
                        backside
                        backsideThickness={1}
                        samples={4}
                        thickness={2}
                        chromaticAberration={0.08}
                        anisotropy={0.2}
                        distortion={0.3}
                        distortionScale={0.3}
                        temporalDistortion={0.05}
                        iridescence={1.2}
                        iridescenceIOR={1.2}
                        iridescenceThicknessRange={[0, 1400]}
                        color="#3b4c6b"
                    />
                </mesh>
            </Float>

            {/* Secondary: Floating Gem (Brand Red/Coral) */}
            <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
                <mesh ref={icosahedronRef} position={[-3, -1, -5]} scale={1.8}>
                    <icosahedronGeometry args={[1, 0]} />
                    <MeshTransmissionMaterial
                        backside
                        samples={3}
                        thickness={1}
                        chromaticAberration={1}
                        color="#ff6b5b"
                        transmission={0.92}
                        opacity={0.8}
                        transparent={true}
                    />
                </mesh>
            </Float>

            {/* Tertiary: Cylinder (Grill-inspired shape) */}
            <Float speed={1.2} rotationIntensity={0.8} floatIntensity={1}>
                <mesh ref={cylinderRef} position={[0.5, -2.5, -3]} scale={0.8}>
                    <cylinderGeometry args={[0.6, 0.6, 1.5, 16]} />
                    <MeshTransmissionMaterial
                        backside
                        samples={2}
                        thickness={0.8}
                        chromaticAberration={0.5}
                        color="#1a1a1a"
                        transmission={0.85}
                        opacity={0.6}
                        transparent={true}
                    />
                </mesh>
            </Float>
        </>
    );
}

export default function Floating3DBackground() {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-50 overflow-hidden">
            <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                <BackgroundGeometries />
            </Canvas>
        </div>
    );
}
