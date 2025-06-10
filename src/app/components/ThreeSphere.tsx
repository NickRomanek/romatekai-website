import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeSphere() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Sphere geometry
    const geometry = new THREE.SphereGeometry(1.3, 64, 32);
    const colors = [];
    const positionAttribute = geometry.attributes.position;
    for (let i = 0; i < positionAttribute.count; i++) {
      const y = positionAttribute.getY(i);
      const lightness = (y + 1) * 0.5;
      const r = (179 + (37 - 179) * (1 - lightness)) / 255;
      const g = (217 + (99 - 217) * (1 - lightness)) / 255;
      const b = (255 + (235 - 255) * (1 - lightness)) / 255;
      colors.push(r, g, b);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      wireframe: false,
      transparent: false
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    camera.position.z = 3;
    rendererRef.current = renderer;
    sphereRef.current = sphere;
    const rotationSpeedX = (Math.random() - 0.5) * 0.02;
    const rotationSpeedY = (Math.random() - 0.5) * 0.02;
    const rotationSpeedZ = (Math.random() - 0.5) * 0.015;
    function animate() {
      animationIdRef.current = requestAnimationFrame(animate);
      if (sphereRef.current) {
        sphereRef.current.rotation.x += rotationSpeedX;
        sphereRef.current.rotation.y += rotationSpeedY;
        sphereRef.current.rotation.z += rotationSpeedZ;
      }
      renderer.render(scene, camera);
    }
    animate();
    const handleResize = () => {
      if (container && renderer) {
        renderer.setSize(container.offsetWidth, container.offsetHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (container && renderer?.domElement) {
        container.removeChild(renderer.domElement);
      }
      if (renderer) {
        renderer.dispose();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="sphere-container mx-auto"
      style={{ width: '128px', height: '128px' }}
    />
  );
} 