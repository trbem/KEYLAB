import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import ThemeToggle from '@/components/ThemeToggle';
import CloudStatus from '@/components/CloudStatus';
export const metadata:Metadata={title:'KEYLAB — 造一把自己的键盘',description:'一间为键盘爱好者准备的 3D 组装工作室'};
export default function Layout({children}:{children:React.ReactNode}) {return <html lang="zh-CN" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:"try{document.documentElement.dataset.theme=localStorage.getItem('keylab-theme')==='green'?'green':'purple'}catch(e){}"}}/></head><body><header className="topbar"><Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">K</span><b>KEYLAB</b></Link><nav><Link href="/">首页</Link><Link href="/builder">DIY 组装</Link><Link href="/parts">配件商城</Link><Link href="/players">选手外设</Link><Link href="/community">社区</Link><Link href="/my-builds">我的配置</Link></nav><div className="top-right"><CloudStatus/><ThemeToggle/><Link className="nav-cta" href="/builder">开始组装 →</Link></div></header>{children}</body></html>}
