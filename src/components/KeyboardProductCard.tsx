'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { money } from '@/lib/pricing';
import type { KeyboardProduct } from '@/lib/keyboard-catalog';
import PartVisual from './PartVisual';

export default function KeyboardProductCard({ product }: { product: KeyboardProduct }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { if (!product.imageUrl || loaded) return; const timer = setTimeout(() => setFailed(true), 8000); return () => clearTimeout(timer); }, [product.imageUrl, loaded]);
  return <article className="library-card keyboard-card"><div className="library-swatch">{product.imageUrl && !failed && <Image src={product.imageUrl} alt={product.name} width={180} height={130} unoptimized style={{ visibility: loaded ? 'visible' : 'hidden' }} onLoad={() => setLoaded(true)} onError={() => setFailed(true)}/>} {(!product.imageUrl || failed || !loaded) && <div className="keyboard-image-fallback"><PartVisual slot="keycaps"/><span>{!product.imageUrl ? '暂无商品图' : failed ? '商品图暂不可用' : '商品图加载中…'}</span></div>}</div><small>采集商品 · 成品键盘</small><h3>{product.name}</h3><p>{product.brand}</p><strong>{product.priceCents === null ? '暂无报价' : `参考起价 ${money(product.priceCents)}`}</strong><p className="keyboard-capture">{product.priceCents !== null && product.priceSource ? `价格来源：${product.priceSource} · 采集于 ${product.priceCapturedAt ?? product.capturedAt}` : `资料采集于 ${product.capturedAt}`} · 价格为采集快照，以商家页面为准</p><details className="keyboard-specs"><summary>商品资料与规格</summary><p>{product.description || '暂无商品描述'}</p>{product.specs.map((spec, index) => <div key={`${spec.label}-${index}`}><b>{spec.label}</b><span>{spec.value}</span></div>)}{product.sourceUrl && <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer">查看资料来源 ↗</a>}</details>{product.id === 'maicong-cff15f9046e82c031b81b2e756cc47cc' && <Link className="keyboard-preview-link" href="/parts/ace68">查看银羽 3D 示意 ↗</Link>}{product.purchaseUrl ? <a className="keyboard-link" href={product.purchaseUrl} target="_blank" rel="noopener noreferrer">查看购买链接 ↗</a> : product.sourceUrl ? <a className="keyboard-link" href={product.sourceUrl} target="_blank" rel="noopener noreferrer">查看官网 ↗</a> : <span className="keyboard-link-unavailable">暂无商品链接</span>}</article>;
}
