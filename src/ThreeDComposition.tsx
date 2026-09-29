import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  AbsoluteFill,
} from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';

export type ThreeDModelType = 'smartphone' | 'coin' | 'box' | 'geometric' | 'custom-glb';
export type ThreeDMotionType = 'spin' | 'float' | 'orbit' | 'spring-pop';
export type ThreeDLightingPreset = 'cyber' | 'luxury' | 'obsidian' | 'clean';
export type AspectRatioId = 'portrait' | 'landscape' | 'square';

export interface ThreeDVideoProps {
  [key: string]: unknown;
  modelType?: ThreeDModelType;
  customGlbUrl?: string;
  motionType?: ThreeDMotionType;
  motionSpeed?: number;
  lightingPreset?: ThreeDLightingPreset;
  material?: {
    color?: string;
    metalness?: number;
    roughness?: number;
    wireframe?: boolean;
  };
  textOverlay?: {
    headline?: string;
    subtext?: string;
    badge?: string;
    ctaText?: string;
  };
  durationSec?: number;
  aspectRatio?: AspectRatioId;
  audioPreset?: string;
}

export const defaultThreeDProps: ThreeDVideoProps = {
  modelType: 'smartphone',
  motionType: 'spin',
  motionSpeed: 1,
  lightingPreset: 'cyber',
  material: {
    color: '#06b6d4',
    metalness: 0.85,
    roughness: 0.2,
    wireframe: false,
  },
  textOverlay: {
    badge: '3D SHOWCASE',
    headline: 'Visualisasi 3D *Masa Depan*',
    subtext: 'Engine video motion 3D berbasis WebGL, Three.js & Remotion.',
    ctaText: 'Explore 3D Studio',
  },
  durationSec: 5,
  aspectRatio: 'portrait',
  audioPreset: 'tech-bright',
};

// ============================================================================
// STUDIO LIGHTING COMPONENT
// ============================================================================
const StudioLighting: React.FC<{ preset: ThreeDLightingPreset }> = ({ preset }) => {
  switch (preset) {
    case 'cyber':
      return (
        <>
          <ambientLight intensity={0.4} color="#06b6d4" />
          <directionalLight position={[5, 8, 5]} intensity={2.0} color="#ec4899" />
          <pointLight position={[-5, -3, -2]} intensity={2.8} color="#3b82f6" />
          <pointLight position={[0, 4, 3]} intensity={1.5} color="#06b6d4" />
        </>
      );
    case 'luxury':
      return (
        <>
          <ambientLight intensity={0.45} color="#fef3c7" />
          <directionalLight position={[4, 8, 4]} intensity={2.2} color="#f59e0b" />
          <pointLight position={[-4, -2, -3]} intensity={1.8} color="#fbbf24" />
          <pointLight position={[3, 2, 4]} intensity={1.4} color="#ffffff" />
        </>
      );
    case 'obsidian':
      return (
        <>
          <ambientLight intensity={0.2} color="#0f172a" />
          <directionalLight position={[0, 9, 3]} intensity={2.8} color="#ffffff" />
          <pointLight position={[-4, -3, -2]} intensity={1.8} color="#6366f1" />
          <pointLight position={[4, 2, 3]} intensity={1.4} color="#a855f7" />
        </>
      );
    case 'clean':
    default:
      return (
        <>
          <ambientLight intensity={0.65} color="#ffffff" />
          <directionalLight position={[5, 8, 5]} intensity={1.6} color="#ffffff" />
          <directionalLight position={[-5, -4, -3]} intensity={0.9} color="#cbd5e1" />
        </>
      );
  }
};

// ============================================================================
// PRESET MESH COMPONENT
// ============================================================================
const PresetMesh: React.FC<{
  modelType: ThreeDModelType;
  materialConfig: NonNullable<ThreeDVideoProps['material']>;
  accentColor: string;
}> = ({ modelType, materialConfig, accentColor }) => {
  const metalness = Number.isFinite(materialConfig.metalness) ? materialConfig.metalness! : 0.8;
  const roughness = Number.isFinite(materialConfig.roughness) ? materialConfig.roughness! : 0.2;
  const wireframe = Boolean(materialConfig.wireframe);
  const color = materialConfig.color || accentColor;

  if (modelType === 'coin') {
    return (
      <group>
        {/* Main Coin Cylinder */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.35, 1.35, 0.16, 64]} />
          <meshStandardMaterial
            color={color}
            metalness={Math.max(0.7, metalness)}
            roughness={Math.min(0.25, roughness)}
            wireframe={wireframe}
          />
        </mesh>
        {/* Raised Outer Edge Ring (Front) */}
        <mesh position={[0, 0, 0.082]}>
          <ringGeometry args={[1.05, 1.28, 64]} />
          <meshStandardMaterial color="#ffffff" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Center Star Emblem */}
        <mesh position={[0, 0, 0.083]}>
          <circleGeometry args={[0.55, 32]} />
          <meshStandardMaterial color={color} metalness={0.9} roughness={0.15} />
        </mesh>
      </group>
    );
  }

  if (modelType === 'box') {
    return (
      <group>
        {/* Product Box Cube */}
        <mesh>
          <boxGeometry args={[1.8, 1.8, 1.8]} />
          <meshStandardMaterial
            color={color}
            metalness={metalness}
            roughness={roughness}
            wireframe={wireframe}
          />
        </mesh>
        {/* Inner Glowing Accent Edge */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(1.82, 1.82, 1.82)]} />
          <lineBasicMaterial color="#ffffff" linewidth={2} />
        </lineSegments>
      </group>
    );
  }

  if (modelType === 'geometric') {
    return (
      <group>
        {/* Neon Cyber Torus Knot */}
        <mesh>
          <torusKnotGeometry args={[1.05, 0.32, 128, 32]} />
          <meshStandardMaterial
            color={color}
            metalness={metalness}
            roughness={roughness}
            wireframe={wireframe}
          />
        </mesh>
      </group>
    );
  }

  // Default: Smartphone Mockup
  return (
    <group>
      {/* Smartphone Outer Body / Chassis */}
      <mesh>
        <boxGeometry args={[1.8, 3.6, 0.16]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.9}
          roughness={0.15}
          wireframe={wireframe}
        />
      </mesh>
      {/* Shiny Metallic Perimeter Edge Bezel */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.84, 3.64, 0.14]} />
        <meshStandardMaterial
          color={color}
          metalness={0.95}
          roughness={0.1}
        />
      </mesh>
      {/* Glossy Screen Glass Front */}
      <mesh position={[0, 0, 0.082]}>
        <planeGeometry args={[1.68, 3.48]} />
        <meshStandardMaterial
          color="#090d16"
          metalness={0.5}
          roughness={0.05}
        />
      </mesh>
      {/* Dynamic Screen App Preview Panel */}
      <mesh position={[0, 0, 0.084]}>
        <planeGeometry args={[1.56, 3.32]} />
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.3}
          opacity={0.88}
          transparent
        />
      </mesh>
      {/* Top Camera Speaker Notch */}
      <mesh position={[0, 1.55, 0.086]}>
        <planeGeometry args={[0.42, 0.08]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  );
};

// ============================================================================
// 2D OVERLAY TYPOGRAPHY LAYER
// ============================================================================
const ThreeDOverlay: React.FC<{
  text?: ThreeDVideoProps['textOverlay'];
  accentColor: string;
  fps: number;
  frame: number;
}> = ({ text, accentColor, fps, frame }) => {
  if (!text) return null;

  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 110, mass: 0.8 },
  });

  const translateY = interpolate(enterSpring, [0, 1], [40, 0]);
  const opacity = interpolate(enterSpring, [0, 1], [0, 1]);

  const renderRichHeadline = (str: string) => {
    const parts = str.split(/(\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        const textContent = part.slice(1, -1);
        return (
          <span
            key={i}
            style={{
              position: 'relative',
              display: 'inline-block',
              padding: '0 8px',
              color: '#ffffff',
              fontWeight: 900,
            }}
          >
            <span
              style={{
                position: 'absolute',
                inset: '10% 0 10% 0',
                background: `linear-gradient(90deg, ${accentColor} 0%, rgba(255,255,255,0.2) 100%)`,
                borderRadius: 8,
                zIndex: -1,
                boxShadow: `0 0 25px ${accentColor}`,
              }}
            />
            {textContent}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '70px 50px',
        zIndex: 10,
        opacity,
        transform: `translateY(${translateY}px)`,
        fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Top Header Badge */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {text.badge && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              borderRadius: 999,
              background: 'rgba(15, 23, 42, 0.75)',
              border: `1px solid ${accentColor}80`,
              boxShadow: `0 0 20px ${accentColor}40`,
              backdropFilter: 'blur(16px)',
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: '#ffffff',
              textTransform: 'uppercase',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: accentColor,
                boxShadow: `0 0 10px ${accentColor}`,
              }}
            />
            {text.badge}
          </div>
        )}
      </div>

      {/* Bottom Text & Call to Action */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 16,
        }}
      >
        {text.headline && (
          <h1
            style={{
              fontSize: 56,
              fontWeight: 900,
              lineHeight: 1.15,
              color: '#ffffff',
              margin: 0,
              textShadow: '0 4px 30px rgba(0,0,0,0.8)',
              maxWidth: 900,
            }}
          >
            {renderRichHeadline(text.headline)}
          </h1>
        )}

        {text.subtext && (
          <p
            style={{
              fontSize: 22,
              fontWeight: 500,
              lineHeight: 1.4,
              color: 'rgba(255, 255, 255, 0.8)',
              margin: 0,
              maxWidth: 720,
              textShadow: '0 2px 20px rgba(0,0,0,0.7)',
            }}
          >
            {text.subtext}
          </p>
        )}

        {text.ctaText && (
          <div
            style={{
              marginTop: 10,
              padding: '16px 36px',
              borderRadius: 14,
              background: `linear-gradient(135deg, ${accentColor} 0%, #3b82f6 100%)`,
              color: '#ffffff',
              fontSize: 20,
              fontWeight: 800,
              boxShadow: `0 8px 30px ${accentColor}60`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span>{text.ctaText}</span>
            <span style={{ fontSize: 22 }}>→</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN 3D VIDEO COMPOSITION
// ============================================================================
export const ThreeDMainVideo: React.FC<ThreeDVideoProps> = ({
  modelType = 'smartphone',
  motionType = 'spin',
  motionSpeed = 1,
  lightingPreset = 'cyber',
  material = defaultThreeDProps.material!,
  textOverlay = defaultThreeDProps.textOverlay,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Entrance spring scale
  const enterScale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.9 },
  });

  const speed = Number.isFinite(motionSpeed) ? Math.max(0.2, motionSpeed) : 1;
  let rotX = 0;
  let rotY = 0;
  let rotZ = 0;
  let posY = 0;
  let scaleMultiplier = enterScale;

  if (motionType === 'spin') {
    rotY = frame * 0.032 * speed;
    rotX = Math.sin(frame * 0.02 * speed) * 0.16;
    posY = Math.sin(frame * 0.04 * speed) * 0.12;
  } else if (motionType === 'float') {
    posY = Math.sin(frame * 0.06 * speed) * 0.25;
    rotX = Math.sin(frame * 0.03 * speed) * 0.18;
    rotY = Math.cos(frame * 0.025 * speed) * 0.22;
  } else if (motionType === 'orbit') {
    rotY = frame * 0.045 * speed;
    rotX = 0.32 + Math.sin(frame * 0.025 * speed) * 0.12;
    posY = Math.cos(frame * 0.03 * speed) * 0.14;
  } else if (motionType === 'spring-pop') {
    const popCycle = (frame % (fps * 2));
    const popSpring = spring({ frame: popCycle, fps, config: { damping: 10, stiffness: 160 } });
    rotY = frame * 0.02 * speed + (popSpring * 0.4);
    scaleMultiplier = enterScale * (0.9 + popSpring * 0.15);
  }

  // Camera field of view and distance based on aspect ratio
  const cameraZ = width > height ? 4.2 : 5.4;
  const accentColor = material.color || '#06b6d4';

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 50% 40%, #0d121f 0%, #06080e 70%, #020305 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Background Subtle Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      {/* WebGL 3D Canvas */}
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ fov: 50, position: [0, 0, cameraZ] }}
        style={{
          position: 'absolute',
          inset: 0,
        }}
      >
        <StudioLighting preset={lightingPreset} />
        <group
          position={[0, posY, 0]}
          rotation={[rotX, rotY, rotZ]}
          scale={[scaleMultiplier, scaleMultiplier, scaleMultiplier]}
        >
          <PresetMesh
            modelType={modelType}
            materialConfig={material}
            accentColor={accentColor}
          />
        </group>
      </ThreeCanvas>

      {/* 2D Typography & Badge Overlay */}
      <ThreeDOverlay
        text={textOverlay}
        accentColor={accentColor}
        fps={fps}
        frame={frame}
      />
    </AbsoluteFill>
  );
};
