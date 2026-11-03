import { byId } from '@/data/catalog';
import { Selection, Slot } from './types';
export function price(selected:Selection, offers:Partial<Record<Slot,string>>) { let total=0, missing=0; const lines=Object.entries(selected).flatMap(([slot,id])=>{const part=byId(id); if(!part){missing++;return []} const offer=part.price.find(o=>o.id===offers[slot as Slot]) ?? part.price[0]; if(!offer || offer.priceCents===null) missing++; else total+=offer.priceCents; return [{slot:slot as Slot,part,offer}];}); return {total,missing,lines}; }
export const money=(cents:number)=>'¥'+(cents/100).toFixed(2);
