import {describe,it,expect} from 'vitest';
import {layouts} from '../src/data/layouts';
import {defaultsFor,byId} from '../src/data/catalog';
import {check} from '../src/lib/compatibility';
describe('预置配列',()=>{it('具备正确键数与唯一键位',()=>{expect(layouts.map(x=>x.keys.length)).toEqual([61,81,87,104]);for(const layout of layouts)expect(new Set(layout.keys.map(k=>k.id)).size).toBe(layout.count)});it('默认配件互相适配',()=>{for(const layout of layouts){const selected=defaultsFor(layout.id);expect(check('case',byId(selected.case)!,selected).status).toBe('compatible');expect(check('keycaps',byId(selected.keycaps)!,selected).status).toBe('compatible')}})});
