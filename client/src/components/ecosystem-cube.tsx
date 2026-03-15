import { useRef, useEffect } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

interface EcosystemCubeProps {
  className?: string;
}

export function EcosystemCube({ className }: EcosystemCubeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;

    // Scene
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      1,
      1000
    );
    camera.position.set(0, 0, 4);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // ---- Environment map for glass refraction ----
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x000000);
    const emitterGeo = new THREE.SphereGeometry(2, 16, 16);
    [
      { color: 0xff88cc, pos: [20, 12, 12] },
      { color: 0x00ffaa, pos: [-20, -12, -12] },
      { color: 0xffcc00, pos: [0, 20, -12] },
      { color: 0x00d4ff, pos: [-12, 0, 20] },
      { color: 0xff00ff, pos: [12, -15, 5] },
      { color: 0x88ff00, pos: [-5, 15, -20] },
    ].forEach(({ color, pos }) => {
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(emitterGeo, mat);
      mesh.position.set(pos[0], pos[1], pos[2]);
      envScene.add(mesh);
    });
    const envMap = pmremGenerator.fromScene(envScene, 0.04).texture;
    scene.environment = envMap;
    pmremGenerator.dispose();
    emitterGeo.dispose();

    // ---- Starfield ----
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.65,
      transparent: true,
    });
    const starVertices: number[] = [];
    for (let i = 0; i < 15000; i++) {
      starVertices.push(
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000
      );
    }
    starGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starVertices, 3)
    );
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // ---- Lights ----
    const ambientLight = new THREE.AmbientLight(0xffddbb, 0.05);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xff88cc, 0.8);
    keyLight.position.set(1, 1, 1).normalize();
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00ffaa, 0.8);
    rimLight.position.set(-1, -1, -1).normalize();
    scene.add(rimLight);

    const pointLight = new THREE.PointLight(0xffcc00, 8, 6);
    pointLight.position.set(0, 2, 10);
    scene.add(pointLight);

    const accentLight = new THREE.PointLight(0x00d4ff, 5, 6);
    accentLight.position.set(-3, 1, 6);
    scene.add(accentLight);

    // ---- 4x4x4 glass cube grid ----
    const gridContainer = new THREE.Group();
    scene.add(gridContainer);
    gridContainer.position.x = -2;

    const gridSize = 4;
    const spacing = 1.1;
    const geometry = new RoundedBoxGeometry(0.7, 0.7, 0.7, 6, 0.1);

    const cubes: THREE.Mesh[] = [];
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        for (let z = 0; z < gridSize; z++) {
          const material = new THREE.MeshPhysicalMaterial({
            transmission: 0.92,
            roughness: 0.0,
            metalness: 0.15,
            clearcoat: 1.0,
            clearcoatRoughness: 0.0,
            ior: 2.0,
            thickness: 0.8,
            color: 0x010204,
            envMapIntensity: 1.2,
            reflectivity: 0.8,
            sheen: 0.3,
            sheenColor: new THREE.Color(0x00d4ff),
          });

          const cube = new THREE.Mesh(geometry, material);
          cube.position.set(
            (x - (gridSize - 1) / 2) * spacing,
            (y - (gridSize - 1) / 2) * spacing,
            (z - (gridSize - 1) / 2) * spacing
          );
          cube.userData = {
            originalTransmission: 0.92,
            originalClearcoat: 1.0,
            originalEnvMapIntensity: 1.2,
          };
          gridContainer.add(cube);
          cubes.push(cube);
        }
      }
    }

    // ---- Mouse interaction ----
    const targetRotation = { x: 0, y: 0 };
    const targetPosition = { x: -2, y: 0 };

    const onMouseMove = (e: MouseEvent) => {
      const mx = (e.clientX / window.innerWidth) * 2 - 1;
      const my = -(e.clientY / window.innerHeight) * 2 + 1;
      targetRotation.x = my * 0.3;
      targetRotation.y = mx * 0.3;
      targetPosition.x = -2 + mx * 0.5;
      targetPosition.y = my * 0.5;
    };
    window.addEventListener("mousemove", onMouseMove);

    // ---- Scroll-based effects (matching oeconomia.tech) ----
    // On scroll: shrink, move right, move back, rotate, fade
    let targetScale = 1;
    let targetZOffset = 0;
    let targetXOffset = 0;
    let currentZOffset = 0;
    let currentXOffset = 0;
    let scrollRotation = 0;

    const scrollConfig = {
      minScale: 0.5,
      maxScale: 1,
      scaleSpeed: 0.3,
      maxZOffset: 1,
      maxXOffset: 5,
      minOpacity: 0.1,
      scrollRotationSpeed: 1,
      scrollTrigger: 1,
    };

    const onScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const scrollProgress = Math.min(
        Math.max(scrollY / (windowHeight * scrollConfig.scrollTrigger), 0),
        1
      );

      // Scale
      targetScale =
        scrollConfig.maxScale -
        scrollProgress * (scrollConfig.maxScale - scrollConfig.minScale);

      // Move backward
      targetZOffset = scrollProgress * scrollConfig.maxZOffset;

      // Move right
      targetXOffset = scrollProgress * scrollConfig.maxXOffset;

      // Fade cube materials
      cubes.forEach((c) => {
        const mat = c.material as THREE.MeshPhysicalMaterial;
        const ud = c.userData;
        mat.opacity = 1 - scrollProgress * (1 - scrollConfig.minOpacity);
        mat.transmission = ud.originalTransmission * (1 - scrollProgress * 0.7);
        mat.clearcoat = ud.originalClearcoat * (1 - scrollProgress * 0.5);
        mat.envMapIntensity =
          ud.originalEnvMapIntensity * (1 - scrollProgress * 0.5);
        mat.needsUpdate = true;
      });

      // Rotation
      scrollRotation = scrollProgress * scrollConfig.scrollRotationSpeed;
    };
    window.addEventListener("scroll", onScroll);

    // ---- Animation loop ----
    let animId = 0;
    const animate = () => {
      if (disposed) return;
      animId = requestAnimationFrame(animate);

      // Smooth scroll interpolation
      currentZOffset +=
        (targetZOffset - currentZOffset) * scrollConfig.scaleSpeed;
      currentXOffset +=
        (targetXOffset - currentXOffset) * scrollConfig.scaleSpeed;

      const currentScale = gridContainer.scale.x;
      const scaleChange =
        (targetScale - currentScale) * scrollConfig.scaleSpeed;
      gridContainer.scale.set(
        currentScale + scaleChange,
        currentScale + scaleChange,
        currentScale + scaleChange
      );

      // Combine mouse + scroll for rotation and position
      gridContainer.rotation.x +=
        (targetRotation.x + scrollRotation - gridContainer.rotation.x) * 0.1;
      gridContainer.rotation.y +=
        (targetRotation.y + scrollRotation - gridContainer.rotation.y) * 0.1;
      gridContainer.position.x +=
        (targetPosition.x + currentXOffset - gridContainer.position.x) * 0.1;
      gridContainer.position.y +=
        (targetPosition.y - gridContainer.position.y) * 0.1;
      gridContainer.position.z = -currentZOffset;

      // Orbiting lights
      const t = Date.now() * 0.001;
      pointLight.position.x = Math.sin(t) * 3;
      pointLight.position.z = Math.cos(t) * 3;
      accentLight.position.x = Math.cos(t * 0.7) * 4;
      accentLight.position.y = Math.sin(t * 0.5) * 2;

      // Starfield rotation
      stars.rotation.x += 0.0005;
      stars.rotation.y += 0.0005;

      renderer.render(scene, camera);
    };
    animate();

    // ---- Resize ----
    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // ---- Cleanup ----
    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      envMap.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      geometry.dispose();
      cubes.forEach((c) => {
        (c.material as THREE.MeshPhysicalMaterial).dispose();
      });
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className={className} />;
}
