'use client';
import {useEffect,useState} from 'react';
export default function ThemeToggle(){const [theme,setTheme]=useState<'purple'|'green'>('purple');useEffect(()=>{const timer=setTimeout(()=>setTheme(document.documentElement.dataset.theme==='green'?'green':'purple'),0);return()=>clearTimeout(timer)},[]);return <button className="theme-toggle" onClick={()=>{const next=theme==='purple'?'green':'purple';setTheme(next);document.documentElement.dataset.theme=next;try{localStorage.setItem('keylab-theme',next)}catch{}}} aria-label="切换主题">◐ {theme==='purple'?'紫色':'荧光绿'}</button>}
