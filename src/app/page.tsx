'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {useState} from 'react';
const HeroModel=dynamic(()=>import('@/components/HeroModel'),{ssr:false,loading:()=> <div className="canvas-fallback">正在加载键盘模型…</div>});
export default function Home(){const [exploded,setExploded]=useState(true);return <main className="home home-new"><div className="home-copy"><h1>打造属于你的<br/><em>机械键盘</em></h1><p>3D 在线组装 · 自由搭配 · 兼容性检测</p><div className="home-actions"><Link className="button primary" href="/builder">开始 DIY 组装 <span>→</span></Link><button className="demo-button" aria-pressed={!exploded} onClick={()=>setExploded(!exploded)}>▷ 观看演示</button></div></div><div className="home-art"><div className="orb"/><div className="hero-ring hero-ring-one"/><div className="hero-ring hero-ring-two"/><div className="home-canvas"><HeroModel exploded={exploded}/></div></div><div className="hero-features"><Link href="/builder"><i>◇</i><span><b>3D 拆解组装</b><small>自由搭配</small></span></Link><Link href="/parts"><i>▦</i><span><b>精选演示配件</b><small>一站选配</small></span></Link><Link href="/my-builds"><i>✧</i><span><b>保存你的方案</b><small>随时继续设计</small></span></Link><Link href="/builder"><i>ϟ</i><span><b>兼容性检测</b><small>清楚了解搭配</small></span></Link></div></main>}

