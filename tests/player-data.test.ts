import { describe, expect, it } from 'vitest';
import { parsePlayerFiles, searchPlayers } from '../src/lib/player-data';

const header = 'id,game,player,team,category,brand,model,source_url,observed_at,checked_at,data_status,notes';

describe('选手外设本地预览', () => {
  it('按游戏和选手聚合设备，并可按名称和设备型号搜索', () => {
    const data = parsePlayerFiles([
      `${header}\n1,CS2,Demo,,keyboard,,"Keyboard, One",,,,unverified,\n2,CS2,Demo,,mouse,,Mouse One,,,,unverified,\n3,VALORANT,Demo,,keyboard,,Keyboard Two,,,,unverified,\n`,
      `${header}\n4,CS2,Demo,,earphones,,Earphone One,,,,unverified,\n`,
    ]);
    expect(data.invalid).toBe(0);
    expect(data.players).toHaveLength(2);
    expect(searchPlayers(data.players, 'CS2', 'keyboard, one')[0].gear).toHaveLength(3);
    expect(searchPlayers(data.players, 'VALORANT', 'demo')).toHaveLength(1);
    expect(searchPlayers(data.players, 'all', 'missing')).toHaveLength(0);
  });

  it('拒绝错误表头，并记录重复或不完整的条目', () => {
    expect(() => parsePlayerFiles(['id,player\n1,Demo'])).toThrow();
    const data = parsePlayerFiles([`${header}\n1,CS2,Demo,,keyboard,,Board,,,,unverified,\n1,CS2,Demo,,mouse,,Mouse,,,,unverified,\n2,CS2,,,mouse,,Mouse,,,,unverified,\n`]);
    expect(data.players).toHaveLength(1);
    expect(data.players[0].gear).toHaveLength(1);
    expect(data.invalid).toBe(2);
  });
});
