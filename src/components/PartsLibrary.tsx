'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useCatalog } from '@/lib/use-catalog';
import { labels, parts, slots } from '@/data/catalog';
import { money } from '@/lib/pricing';
import type { KeyboardCatalog } from '@/lib/keyboard-catalog';
import type { Slot } from '@/lib/types';
import PartVisual from './PartVisual';
import KeyboardProductCard from './KeyboardProductCard';

export default function PartsLibrary() {
  const source = useCatalog();
  const [keyboards, setKeyboards] = useState<KeyboardCatalog | null>(null);
  const [q, setQ] = useState('');
  const [slot, setSlot] = useState<Slot | 'all' | 'keyboard'>('all');
  const [material, setMaterial] = useState('all');
  const [brand, setBrand] = useState('all');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/keyboard-catalog', { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('目录请求失败');
      return response.json() as Promise<KeyboardCatalog>;
    }).then(setKeyboards).catch(() => { if (!controller.signal.aborted) setKeyboards({ status: 'invalid', products: [] }); });
    return () => controller.abort();
  }, []);
  const materials = Array.from(new Set(parts.map(p => p.material)));
  const keyboardProducts = keyboards?.products || [];
  const brands = Array.from(new Set([...parts.map(p => p.brand).filter((b): b is string => !!b), ...keyboardProducts.map(p => p.brand)])).sort();
  const featured = ['pcb-main', 'switch-linear', 'keycap-ivory', 'case-lavender', 'foam-case', 'stabilizer-main', 'plate-pc', 'foam-plate'];
  const needle = q.trim().toLowerCase();
  const foundParts = parts.filter(p => slot !== 'keyboard' && (slot === 'all' || p.slot === slot) && (material === 'all' || p.material === material) && (brand === 'all' || p.brand === brand) && (p.name + ' ' + p.description + ' ' + p.material + ' ' + (p.brand || '')).toLowerCase().includes(needle)).sort((a, b) => (featured.indexOf(a.id) < 0 ? 999 : featured.indexOf(a.id)) - (featured.indexOf(b.id) < 0 ? 999 : featured.indexOf(b.id)));
  const foundKeyboards = keyboardProducts.filter(p => (slot === 'all' || slot === 'keyboard') && material === 'all' && (brand === 'all' || p.brand === brand) && (p.name + ' ' + p.brand + ' ' + p.description + ' ' + p.specs.map(s => `${s.label} ${s.value}`).join(' ')).toLowerCase().includes(needle));
  return <main className="page"><div className="eyebrow">THE PARTS LIBRARY / 配件库</div><h1>配件商城</h1><p className="muted">探索配件，打造你的专属键盘。{source.message}</p>
    <div className="catalog-filters"><input aria-label="搜索商品" value={q} placeholder="搜索商品、品牌或规格" onChange={e => setQ(e.target.value)}/><select aria-label="筛选品牌" value={brand} onChange={e => setBrand(e.target.value)}><option value="all">所有品牌</option>{brands.map(b => <option key={b} value={b}>{b}</option>)}</select>{slot !== 'keyboard' && <select aria-label="筛选材质" value={material} onChange={e => setMaterial(e.target.value)}><option value="all">所有材质</option>{materials.map(m => <option key={m}>{m}</option>)}</select>}</div>
    <div className="filter-tabs"><button className={slot === 'all' ? 'active' : ''} onClick={() => setSlot('all')}>全部</button><button className={slot === 'keyboard' ? 'active' : ''} onClick={() => { setSlot('keyboard'); setMaterial('all'); }}>成品键盘</button>{slots.map(s => <button className={slot === s ? 'active' : ''} key={s} onClick={() => setSlot(s)}>{labels[s]}</button>)}</div>
    {keyboards && keyboards.status !== 'ready' && <p className="keyboard-catalog-message">{keyboards.status === 'missing' ? '本地成品键盘资料尚未准备。' : '本地成品键盘资料暂时不可读取。'}现有配件仍可浏览。</p>}
    <div className="catalog-grid">{foundKeyboards.map(p => <KeyboardProductCard product={p} key={p.id}/>)}{foundParts.map(p => <div className="library-card" key={p.id}><div className="library-swatch">{p.imageUrl ? <Image src={p.imageUrl} alt="" width={180} height={130} unoptimized/> : <PartVisual slot={p.slot} color={p.color}/>}</div><small>{p.isDemoData ? '演示商品' : '已录入商品'} / {labels[p.slot]}</small><h3>{p.name}</h3><p>{p.brand || '未提供品牌'} · {p.material}</p><strong>{p.price[0]?.priceCents == null ? '暂无报价' : money(p.price[0].priceCents)}</strong><Link href={'/builder?part=' + encodeURIComponent(p.id)}>加入配置 →</Link></div>)}</div>
    {!foundParts.length && !foundKeyboards.length && <p className="empty">{!keyboards && (slot === 'all' || slot === 'keyboard') ? '正在读取本地商品…' : '没有找到匹配的商品。'}</p>}
  </main>;
}
