import { describe,it,expect } from 'vitest';
import { byId, defaults } from '../src/data/catalog';
import { check } from '../src/lib/compatibility';
import { price } from '../src/lib/pricing';
describe('兼容性',()=>{
 it('验证已知匹配',()=>expect(check('case',byId('case-silver')!,defaults).status).toBe('compatible'));
 it('拒绝冲突',()=>expect(check('case',byId('case-bad')!,defaults).status).toBe('incompatible'));
 it('资料不足时显示未验证',()=>expect(check('keycaps',byId('keycap-unknown')!,defaults).status).toBe('unknown'));
 it('提示加厚棉',()=>expect(check('plate_foam',byId('foam-plate-thick')!,defaults).status).toBe('warning'));
 it('拒绝错误槽位',()=>expect(check('pcb',byId('case-black')!,defaults).status).toBe('incompatible'));
});
describe('价格',()=>{
 it('按整数分汇总并识别缺价',()=>{const r=price({...defaults,keycaps:'keycap-unknown'},{});expect(r.missing).toBe(1);expect(r.total).toBe(122300)});
 it('使用用户所选报价',()=>{const r=price({case:'case-black'},{case:'case-black-external'});expect(r.lines[0].offer.sourceType).toBe('external');expect(r.total).toBe(45900)});
});

