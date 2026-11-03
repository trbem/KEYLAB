import {describe,it,expect} from 'vitest';
import {byId,defaults} from '../src/data/catalog';
import {check,resetCompatibilityRules,setCompatibilityRules} from '../src/lib/compatibility';
describe('数据库规则',()=>{it('缺少可选轴下垫不会使 PCB 未验证',()=>{expect(check('pcb',byId('pcb-main')!,defaults).status).toBe('compatible')});it('缺失必要规则时不得默认兼容',()=>{setCompatibilityRules([]);try{expect(check('pcb',byId('pcb-main')!,defaults).status).toBe('unknown')}finally{resetCompatibilityRules()}})});
