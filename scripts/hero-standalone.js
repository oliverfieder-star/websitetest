/**
 * Eigenständiger Werklicht-Hero für die Einzeldatei-Vorschau.
 * Gleicher Depth-Scan-Effekt wie components/ui/hero-futuristic.tsx,
 * ohne React — plus die Wow-Schicht:
 *   - Boot-Sweep: eine schnelle, helle Lesewelle beim Laden,
 *     die dann in den ruhigen Dauer-Scan übergeht
 *   - Maus-Parallax mit sanfter Neigung des Bildes
 *   - langsamer Ken-Burns-Zoomdrift
 *   - cinematische Vignette im Post-Processing
 * Assets kommen als Data-URIs über window.__HERO_ASSETS.
 */

import * as THREE from "three/webgpu";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";
import {
  abs,
  add,
  blendScreen,
  float,
  length,
  mix,
  mod,
  mx_cell_noise_float,
  oneMinus,
  pass,
  smoothstep,
  sub,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
} from "three/tsl";

const IMG_ASPECT = 3 / 2;
const INTRO_DAUER = 2.2; // Sekunden Boot-Sweep

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export async function startHero(container) {
  const assets = window.__HERO_ASSETS;
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  container.appendChild(canvas);

  const renderer = new THREE.WebGPURenderer({
    canvas,
    antialias: true,
    forceWebGL: typeof navigator !== "undefined" && !("gpu" in navigator),
  });
  await renderer.init();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
  camera.position.z = 5;

  const loader = new THREE.TextureLoader();
  const [rawMap, depthMap] = await Promise.all([
    loader.loadAsync(assets.img),
    loader.loadAsync(assets.depth),
  ]);
  rawMap.colorSpace = THREE.SRGBColorSpace;

  // ── Material: Tiefen-Parallax + Punktraster-Lesespur ──
  const uPointer = uniform(new THREE.Vector2(0, 0));
  const uProgress = uniform(0);
  const uBoost = uniform(1); // heller während des Boot-Sweeps

  const tDepthMap = texture(depthMap);
  const tMap = texture(rawMap, uv().add(tDepthMap.r.mul(uPointer).mul(0.02)));

  const aspectNode = float(IMG_ASPECT);
  const tUv = vec2(uv().x.mul(aspectNode), uv().y);
  const tiling = vec2(140.0);
  const tiledUv = mod(tUv.mul(tiling), 2.0).sub(1.0);
  const brightness = mx_cell_noise_float(tUv.mul(tiling).div(2));
  const dist = float(tiledUv.length());
  const dot = float(smoothstep(0.5, 0.49, dist)).mul(brightness);
  const flow = oneMinus(smoothstep(0, 0.02, abs(tDepthMap.sub(uProgress))));
  const mask = dot.mul(flow).mul(vec3(10, 5.2, 1.6)).mul(uBoost);

  const material = new THREE.MeshBasicNodeMaterial({
    colorNode: blendScreen(tMap, mask),
    transparent: true,
    opacity: 0,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  scene.add(mesh);

  // ── Post: Bloom + Amber-Scanlinie + Vignette ──
  const post = new THREE.PostProcessing(renderer);
  const scenePass = pass(scene, camera);
  const scenePassColor = scenePass.getTextureNode("output");
  const bloomPass = bloom(scenePassColor, 1, 0.5, 1);

  const uScan = uniform(0);
  const scanLine = smoothstep(0, 0.05, abs(uv().y.sub(uScan)));
  const amberOverlay = vec3(1.0, 0.62, 0.25)
    .mul(oneMinus(scanLine))
    .mul(float(0.35).mul(uBoost));
  const withScan = mix(
    scenePassColor,
    add(scenePassColor, amberOverlay),
    smoothstep(0.9, 1.0, oneMinus(scanLine))
  );
  const vignette = oneMinus(
    smoothstep(0.55, 1.25, length(sub(uv(), vec2(0.5))).mul(1.5)).mul(0.45)
  );
  post.outputNode = withScan.add(bloomPass).mul(vignette);

  // ── Layout: Fläche deckend einpassen (Cover) ──
  function layout() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const vh = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    const vw = vh * camera.aspect;
    let cw = vw;
    let ch = cw / IMG_ASPECT;
    if (ch < vh) {
      ch = vh;
      cw = ch * IMG_ASPECT;
    }
    mesh.userData.baseW = cw * 1.08;
    mesh.userData.baseH = ch * 1.08;
  }
  layout();
  window.addEventListener("resize", layout);

  // ── Zeiger sanft nachziehen ──
  const zielPointer = new THREE.Vector2(0, 0);
  window.addEventListener("pointermove", (e) => {
    zielPointer.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );
  });

  const uhr = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const t = uhr.getElapsedTime();

    // Boot-Sweep → ruhiger Dauer-Scan (stetig, ohne Sprung)
    let progress;
    if (t < INTRO_DAUER) {
      progress = easeInOut(t / INTRO_DAUER);
      uBoost.value = 1.7 - 0.7 * (t / INTRO_DAUER);
    } else {
      progress = 0.5 + 0.5 * Math.cos((t - INTRO_DAUER) * 0.4);
      uBoost.value = 1;
    }
    uProgress.value = progress;
    uScan.value = progress;

    // Zeiger-Parallax + Neigung
    uPointer.value.lerp(zielPointer, 0.06);
    mesh.rotation.y = uPointer.value.x * 0.05;
    mesh.rotation.x = -uPointer.value.y * 0.04;

    // Ken-Burns-Drift
    const k = 1.02 + 0.035 * Math.sin(t * 0.07);
    mesh.scale.set(mesh.userData.baseW * k, mesh.userData.baseH * k, 1);

    // Weiches Erscheinen
    material.opacity = THREE.MathUtils.lerp(material.opacity, 1, 0.06);

    post.renderAsync();
  });
}

// Autostart: reduzierte Bewegung oder Init-Fehler → statischer Fallback.
const wrap = document.getElementById("hero-canvas");
const fallback = document.getElementById("hero-fallback");
const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduziert && wrap) {
  startHero(wrap).catch((err) => {
    console.warn("3D-Hero nicht verfügbar, zeige Standbild:", err);
    wrap.remove();
    if (fallback) fallback.hidden = false;
  });
} else if (fallback) {
  if (wrap) wrap.remove();
  fallback.hidden = false;
}
