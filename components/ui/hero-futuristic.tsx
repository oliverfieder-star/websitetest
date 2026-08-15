"use client";

/**
 * Adaptiert von der 21st.dev-Vorlage "hero-futuristic":
 * Tiefenkarten-Scan über einem echten Handwerksmotiv (Higgsfield).
 * Statt Rot scannt hier warmes Amber — das Licht der Werkstatt.
 * Fällt auf WebGL2 zurück, wenn WebGPU fehlt; rendert ein statisches
 * Bild mit CSS-Scanlinie, wenn gar kein 3D-Kontext möglich ist oder
 * reduzierte Bewegung gewünscht wird.
 */

import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { useAspect, useTexture } from "@react-three/drei";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three/webgpu";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";
import type { Mesh } from "three";

import {
  abs,
  blendScreen,
  float,
  mod,
  mx_cell_noise_float,
  oneMinus,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  pass,
  mix,
  add,
} from "three/tsl";

const TEXTUREMAP = { src: "/images/hero.jpg" };
const DEPTHMAP = { src: "/images/hero-depth.jpg" };

/** Bildseitenverhältnis der Hero-Textur (3:2) */
const WIDTH = 300;
const HEIGHT = 200;

extend(THREE as unknown as Parameters<typeof extend>[0]);

const PostProcessing = ({
  strength = 1,
  threshold = 1,
}: {
  strength?: number;
  threshold?: number;
}) => {
  const { gl, scene, camera } = useThree();
  const progressRef = useRef<{ value: number }>({ value: 0 });

  const render = useMemo(() => {
    const postProcessing = new THREE.PostProcessing(
      gl as unknown as THREE.WebGPURenderer
    );
    const scenePass = pass(scene, camera);
    const scenePassColor = scenePass.getTextureNode("output");
    const bloomPass = bloom(scenePassColor, strength, 0.5, threshold);

    const uScanProgress = uniform(0);
    progressRef.current = uScanProgress;

    // Amber-Scanlinie statt Rot: das Werkstattlicht liest das Bild.
    const uvY = uv().y;
    const scanWidth = float(0.05);
    const scanLine = smoothstep(0, scanWidth, abs(uvY.sub(uScanProgress)));
    const amberOverlay = vec3(1.0, 0.62, 0.25)
      .mul(oneMinus(scanLine))
      .mul(0.35);

    const withScanEffect = mix(
      scenePassColor,
      add(scenePassColor, amberOverlay),
      smoothstep(0.9, 1.0, oneMinus(scanLine))
    );

    const final = withScanEffect.add(bloomPass);
    postProcessing.outputNode = final;
    return postProcessing;
  }, [camera, gl, scene, strength, threshold]);

  useFrame(({ clock }) => {
    progressRef.current.value =
      Math.sin(clock.getElapsedTime() * 0.4) * 0.5 + 0.5;
    render.renderAsync();
  }, 1);

  return null;
};

const Scene = () => {
  const [rawMap, depthMap] = useTexture([TEXTUREMAP.src, DEPTHMAP.src]);

  const meshRef = useRef<Mesh>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (rawMap && depthMap) setVisible(true);
  }, [rawMap, depthMap]);

  const { material, uniforms } = useMemo(() => {
    const uPointer = uniform(new THREE.Vector2(0));
    const uProgress = uniform(0);

    const strength = 0.01;

    const tDepthMap = texture(depthMap);
    const tMap = texture(
      rawMap,
      uv().add(tDepthMap.r.mul(uPointer).mul(strength))
    );

    const aspect = float(WIDTH).div(HEIGHT);
    const tUv = vec2(uv().x.mul(aspect), uv().y);

    const tiling = vec2(140.0);
    const tiledUv = mod(tUv.mul(tiling), 2.0).sub(1.0);

    const brightness = mx_cell_noise_float(tUv.mul(tiling).div(2));

    const dist = float(tiledUv.length());
    const dot = float(smoothstep(0.5, 0.49, dist)).mul(brightness);

    const flow = oneMinus(smoothstep(0, 0.02, abs(tDepthMap.sub(uProgress))));

    // Punktraster in Amber statt Rot: die "Lesespur" der KI.
    const mask = dot.mul(flow).mul(vec3(10, 5.2, 1.6));

    const final = blendScreen(tMap, mask);

    const material = new THREE.MeshBasicNodeMaterial({
      colorNode: final,
      transparent: true,
      opacity: 0,
    });

    return { material, uniforms: { uPointer, uProgress } };
  }, [rawMap, depthMap]);

  const [w, h] = useAspect(WIDTH, HEIGHT);

  useFrame(({ clock }) => {
    uniforms.uProgress.value =
      Math.sin(clock.getElapsedTime() * 0.4) * 0.5 + 0.5;
    if (meshRef.current?.material) {
      const mat = meshRef.current.material as { opacity?: number };
      if (typeof mat.opacity === "number") {
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, visible ? 1 : 0, 0.07);
      }
    }
  });

  useFrame(({ pointer }) => {
    uniforms.uPointer.value = pointer;
  });

  const scaleFactor = 1.05;
  return (
    <mesh
      ref={meshRef}
      scale={[w * scaleFactor, h * scaleFactor, 1]}
      material={material}
    >
      <planeGeometry />
    </mesh>
  );
};

const TITLE_WORDS = ["Handwerk", "bleibt."];
const TITLE_WORDS_2 = ["Papierkram", "geht."];
const SUBTITLE =
  "KI und Automatisierung für Handwerksbetriebe in Bayern — eingerichtet, bis es im Alltag läuft.";

function HeroCopy() {
  const all = [...TITLE_WORDS, ...TITLE_WORDS_2];
  const [visibleWords, setVisibleWords] = useState(0);
  const [subtitleVisible, setSubtitleVisible] = useState(false);

  useEffect(() => {
    if (visibleWords < all.length) {
      const t = setTimeout(() => setVisibleWords(visibleWords + 1), 350);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setSubtitleVisible(true), 500);
    return () => clearTimeout(t);
  }, [visibleWords, all.length]);

  const renderLine = (words: string[], offset: number, amber: boolean) => (
    <div className="flex justify-center gap-[0.35em] overflow-hidden">
      {words.map((word, i) => {
        const idx = offset + i;
        return (
          <span
            key={idx}
            className={`${idx < visibleWords ? "fade-in" : ""} ${
              amber ? "text-amber" : "text-schrift"
            }`}
            style={{
              animationDelay: `${idx * 0.14}s`,
              opacity: idx < visibleWords ? undefined : 0,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-6">
      <p
        className={`mb-6 text-[11px] font-semibold uppercase tracking-[0.3em] text-amber md:text-xs ${
          visibleWords > 0 ? "fade-in" : "opacity-0"
        }`}
      >
        Mainfranken Digital
      </p>
      <h1 className="font-display text-center text-[clamp(2.4rem,8vw,6.5rem)] font-bold uppercase leading-[1.02] tracking-tight">
        {renderLine(TITLE_WORDS, 0, false)}
        {renderLine(TITLE_WORDS_2, TITLE_WORDS.length, true)}
      </h1>
      <div className="mt-6 max-w-xl overflow-hidden text-center text-sm text-gedimmt md:text-lg">
        <p
          className={subtitleVisible ? "fade-in-subtitle" : ""}
          style={{
            animationDelay: `${all.length * 0.14 + 0.15}s`,
            opacity: subtitleVisible ? undefined : 0,
          }}
        >
          {SUBTITLE}
        </p>
      </div>
      <div
        className={`pointer-events-auto mt-10 flex flex-wrap items-center justify-center gap-5 ${
          subtitleVisible ? "fade-in-subtitle" : "opacity-0"
        }`}
        style={{ animationDelay: `${all.length * 0.14 + 0.5}s` }}
      >
        <a
          href="#kontakt"
          className="rounded-full bg-amber px-8 py-4 text-base font-semibold text-tinte shadow-[0_12px_40px_-12px_rgba(232,163,77,0.6)] transition-transform hover:-translate-y-0.5 hover:bg-amber-hell"
        >
          Erstgespräch vereinbaren
        </a>
        <p className="text-sm text-gedimmt">
          oder direkt anrufen:{" "}
          <strong className="whitespace-nowrap text-schrift">
            [PLATZHALTER Telefon]
          </strong>
        </p>
      </div>
    </div>
  );
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HeroFuturistic() {
  const [mode, setMode] = useState<"pending" | "canvas" | "static">("pending");

  useEffect(() => {
    setMode(prefersReducedMotion() ? "static" : "canvas");
  }, []);

  return (
    <section aria-label="Einstieg" className="relative h-svh overflow-hidden">
      <HeroCopy />

      {mode === "canvas" ? (
        <div className="absolute inset-0">
          <Canvas
            flat
            onCreated={() => {}}
            fallback={<StaticHero />}
            gl={async (props) => {
              const renderer = new THREE.WebGPURenderer({
                ...(props as ConstructorParameters<
                  typeof THREE.WebGPURenderer
                >[0]),
                forceWebGL:
                  typeof navigator !== "undefined" && !("gpu" in navigator),
              });
              await renderer.init();
              return renderer;
            }}
          >
            <PostProcessing />
            <Scene />
          </Canvas>
        </div>
      ) : (
        <StaticHero />
      )}

      {/* Scrim: hält die Typo auch über hellen Bildstellen lesbar */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_60%_55%_at_50%_46%,rgba(10,14,20,0.62),rgba(10,14,20,0.28)_60%,transparent_82%)]"
      />

      <a
        href="#aufgaben"
        className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 text-[11px] font-semibold uppercase tracking-[0.25em] text-gedimmt transition-colors hover:text-amber"
      >
        Entdecken ↓
      </a>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-nacht to-transparent" />
    </section>
  );
}

/** Fallback ohne 3D: Standbild plus CSS-Scanlinie. */
function StaticHero() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={TEXTUREMAP.src}
        alt=""
        className="h-full w-full object-cover opacity-70"
      />
      <div className="scanline" />
      <div className="absolute inset-0 bg-nacht/45" />
    </div>
  );
}

export default HeroFuturistic;
