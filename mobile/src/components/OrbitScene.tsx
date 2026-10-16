import { useEffect, useRef } from "react";
import { Platform, View } from "react-native";

declare global {
  interface Window { THREE?: any }
}

export function OrbitScene({ dark }: { dark: boolean }) {
  const host = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== "web" || !host.current || !window.THREE) return;
    const THREE = window.THREE;
    const mount = host.current as HTMLElement;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.z = 5.2;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.setSize(mount.clientWidth || 300, mount.clientHeight || 240);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.02, 2),
      new THREE.MeshStandardMaterial({ color: dark ? 0xc4e478 : 0x536d2c, roughness: 0.32, metalness: 0.12, flatShading: true })
    );
    group.add(core);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: dark ? 0x8fb7e8 : 0x315f9b, wireframe: true, transparent: true, opacity: 0.55 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.009, 8, 120), ringMaterial);
    ring.rotation.set(0.85, 0.3, 0.4);
    group.add(ring);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.68, 0.006, 8, 120), new THREE.MeshBasicMaterial({ color: dark ? 0xc0a5e8 : 0x7450a4, transparent: true, opacity: 0.65 }));
    ring2.rotation.set(1.3, 0.2, -0.6);
    group.add(ring2);
    scene.add(new THREE.HemisphereLight(0xffffff, dark ? 0x20291a : 0xe5edda, 2));
    const key = new THREE.PointLight(0xffffff, 18);
    key.position.set(3, 3, 4);
    scene.add(key);
    let frame = 0;
    let active = true;
    const draw = () => {
      if (!active) return;
      frame = requestAnimationFrame(draw);
      group.rotation.y += 0.003;
      group.rotation.x = Math.sin(Date.now() * 0.00025) * 0.08;
      renderer.render(scene, camera);
    };
    draw();
    const resize = () => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", resize);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      scene.traverse((item: any) => {
        if (item.geometry) item.geometry.dispose();
        if (item.material) (Array.isArray(item.material) ? item.material : [item.material]).forEach((material: any) => material.dispose());
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [dark]);

  if (Platform.OS !== "web") return null;
  return <View ref={host} style={{ width: "100%", height: 250, minWidth: 0, overflow: "hidden" }} />;
}
