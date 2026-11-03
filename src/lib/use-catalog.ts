'use client';
import {useEffect,useState} from 'react';
import {catalogState,loadCatalog,subscribeCatalog,CatalogState} from '@/lib/catalog-source';
export function useCatalog(){const [state,setState]=useState<CatalogState>(catalogState);useEffect(()=>{let active=true;const unsubscribe=subscribeCatalog(next=>{if(active)setState(next)});void loadCatalog().then(next=>{if(active)setState(next)});return()=>{active=false;unsubscribe()}},[]);return state}
