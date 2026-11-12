'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, RoundedBox } from '@react-three/drei';
import { useEffect, useMemo, useState } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import Link from 'next/link';
import { ace68Keys, type Ace68Key } from '@/data/ace68-layout';

const unit = 0.48;
const boardWidth = 16 * unit;
const boardDepth = 5 * unit;

function Legend({ label, width }: { label: string; width: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      context.font = `${label.length > 4 ? 30 : 38}px sans-serif`;
      context.fillStyle = '#5e6474'; context.textAlign = 'left';
      context.fillText(label.replace(' R', ''), 18, 50);
    }
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    return result;
  }, [label]);
  useEffect(() => () => texture.dispose(), [texture]);
  if (label === 'Space') return null;
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.113, 0]}><planeGeometry args={[width, .38]}/><meshBasicMaterial map={texture} transparent depthWrite={false}/></mesh>;
}

function Key({ item, selected, onSelect }: { item: Ace68Key; selected: boolean; onSelect: (key: Ace68Key) => void }) {
  const width = item.width * unit - .035;
  const x = (item.x + item.width / 2) * unit - boardWidth / 2;
  const z = (item.row + .5) * unit - boardDepth / 2;
  return <group position={[x, 0, z]} onClick={event => { event.stopPropagation(); onSelect(item); }}>
    <RoundedBox args={[width, .21, .43]} radius={.025} smoothness={2} castShadow>
      <meshPhysicalMaterial color={selected ? '#ddd5ff' : '#e4e8f2'} transparent opacity={.78} roughness={.25} metalness={.04} clearcoat={.7} clearcoatRoughness={.2}/>
    </RoundedBox>
    <Legend label={item.label} width={width}/>
  </group>;
}

function Assembly({ explosion, selected, onSelect }: { explosion: number; selected: string | null; onSelect: (key: Ace68Key) => void }) {
  return <group>
    <group position={[0, -.23 - explosion * .55, 0]}>
      <RoundedBox args={[boardWidth + .28, .24, boardDepth + .5]} radius={.06} smoothness={3} castShadow receiveShadow><meshStandardMaterial color="#9699a4" metalness={.6} roughness={.32}/></RoundedBox>
      <mesh position={[0, .14, boardDepth / 2 + .13]}><boxGeometry args={[boardWidth + .2, .08, .22]}/><meshStandardMaterial color="#c8c8cf" metalness={.6} roughness={.38}/></mesh>
      <mesh position={[0, .14, -boardDepth / 2 - .10]}><boxGeometry args={[boardWidth + .2, .08, .14]}/><meshStandardMaterial color="#b8bbc4" metalness={.55} roughness={.35}/></mesh>
      {[-1, 1].map(side => <mesh key={side} position={[side * (boardWidth / 2 + .065), .13, 0]}><boxGeometry args={[.13, .11, boardDepth]}/><meshStandardMaterial color="#b7bac3" metalness={.6} roughness={.34}/></mesh>)}
      {[0, 1, 2].map(i => <mesh key={i} position={[boardWidth / 2 - .8 + i * .19, .19, -boardDepth / 2 - .1]}><boxGeometry args={[.035, .01, .045]}/><meshBasicMaterial color={i === 0 ? '#a9bbff' : '#555965'}/></mesh>)}
    </group>
    <mesh position={[0, -.07 - explosion * .25, 0]} receiveShadow><boxGeometry args={[boardWidth, .06, boardDepth]}/><meshStandardMaterial color="#30343d" metalness={.28} roughness={.62}/></mesh>
    <group position={[0, .05 + explosion * .25, 0]}>{ace68Keys.map(item => {
      const x = (item.x + item.width / 2) * unit - boardWidth / 2;
      const z = (item.row + .5) * unit - boardDepth / 2;
      return <group key={item.id} position={[x, 0, z]}><mesh><boxGeometry args={[.27, .12, .27]}/><meshStandardMaterial color="#d3d8e1" roughness={.42}/></mesh><mesh position={[0, .075, 0]}><boxGeometry args={[.12, .07, .04]}/><meshStandardMaterial color="#e8eaf1"/></mesh><mesh position={[0, .075, 0]}><boxGeometry args={[.04, .07, .12]}/><meshStandardMaterial color="#e8eaf1"/></mesh></group>;
    })}</group>
    <group position={[0, .24 + explosion * .65, 0]}>{ace68Keys.map(item => <Key key={item.id} item={item} selected={selected === item.id} onSelect={onSelect}/>)}</group>
  </group>;
}

export default function Ace68Preview() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [explosion, setExplosion] = useState(0);
  const [selected, setSelected] = useState<Ace68Key | null>(null);
  const [cameraKey, setCameraKey] = useState(0);
  useEffect(() => { const timer = setTimeout(() => { const canvas = document.createElement('canvas'); try { setAvailable(!!(canvas.getContext('webgl2') || canvas.getContext('webgl'))); } catch { setAvailable(false); } }, 0); return () => clearTimeout(timer); }, []);
  return <main className="ace-preview"><div className="ace-preview-heading"><div><span>KEYLAB / PRODUCT STUDY</span><h1>Ace 68 GT <em>银羽</em></h1><p>68 键外观示意 · 交互式 3D 预览</p></div><Link href="/parts">← 返回配件商城</Link></div>
    <p className="ace-notice">根据商品图片制作的近似示意，内部结构、尺寸及配件兼容性未核验。非官方模型。</p>
    <div className="ace-toolbar"><button onClick={() => setExplosion(0)} aria-pressed={explosion === 0}>合体</button><button onClick={() => setExplosion(1)} aria-pressed={explosion === 1}>拆解</button><label>爆炸程度 <input aria-label="爆炸程度" type="range" min="0" max="1" step="0.01" value={explosion} onChange={event => setExplosion(Number(event.target.value))}/></label><button onClick={() => setCameraKey(value => value + 1)}>重置视角</button></div>
    <div className="ace-stage">{available === null ? <div className="canvas-fallback">正在准备 3D 预览…</div> : !available ? <div className="canvas-fallback">此浏览器无法使用 WebGL，请使用支持 WebGL 的浏览器查看 3D 预览。</div> : <Canvas key={cameraKey} camera={{ position: [5, 6.5, 7], fov: 35 }} dpr={[1, 1.5]}><color attach="background" args={['#131424']}/><ambientLight intensity={1.35}/><directionalLight position={[2, 6, 4]} intensity={2.4}/><directionalLight position={[-5, 4, -4]} color="#c3c8ff" intensity={1.2}/><Assembly explosion={explosion} selected={selected?.id ?? null} onSelect={setSelected}/><OrbitControls makeDefault enablePan minDistance={4} maxDistance={18}/></Canvas>}</div>
    <div className="ace-footer"><span>拖动旋转 · 滚轮缩放 · 右键平移 · 点击键帽</span><span>{selected ? `已选择：${selected.label}` : '选择任意键帽查看'}</span></div>
  </main>;
}
