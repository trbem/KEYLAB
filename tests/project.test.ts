import {describe,it,expect} from 'vitest';
import { parseProject } from '../src/lib/project';
import { defaults, templateId } from '../src/data/catalog';
const project={format:'keylab-project',version:1,build:{templateId,selectedParts:defaults,designs:{},name:'test'}};
describe('工程文件',()=>{it('读取合法工程',()=>{expect(parseProject(project).templateId).toBe(templateId)});it('拒绝未知配列与无效图案',()=>{expect(()=>parseProject({...project,build:{...project.build,templateId:'bogus'}})).toThrow();expect(()=>parseProject({...project,build:{...project.build,designs:{Q:{color:'wrong'}}}})).toThrow()})});
