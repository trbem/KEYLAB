import {describe,it,expect,vi,beforeEach} from 'vitest';
import {defaults,templateId} from '../src/data/catalog';
const mocks=vi.hoisted(()=>({getSession:vi.fn(),rpc:vi.fn()}));
vi.mock('../src/lib/catalog-source',()=>({getSupabase:()=>({auth:{getSession:mocks.getSession},rpc:mocks.rpc})}));
import {saveCloudBuild} from '../src/lib/cloud-builds';
const build={id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',name:'方案',templateId,selectedParts:defaults,selectedOffers:{},createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z'};
describe('云端方案同步',()=>{beforeEach(()=>{mocks.getSession.mockReset();mocks.rpc.mockReset()});it('未登录时只保留本地方案',async()=>{mocks.getSession.mockResolvedValue({data:{session:null},error:null});expect(await saveCloudBuild(build)).toBe('signed-out');expect(mocks.rpc).not.toHaveBeenCalled()});it('登录后以原子 RPC 提交方案与配件',async()=>{mocks.getSession.mockResolvedValue({data:{session:{user:{id:'user-1'}}},error:null});mocks.rpc.mockReturnValue({abortSignal:async()=>({error:null})});expect(await saveCloudBuild(build)).toBe('saved');expect(mocks.rpc).toHaveBeenCalledWith('save_build_with_items',expect.objectContaining({p_id:build.id,p_items:expect.arrayContaining([expect.objectContaining({slot:'case',product_id:'case-lavender'})])}))})});
