import { parse } from 'csv-parse/sync';

export type PlayerGame = 'CS2' | 'VALORANT';
export type GearCategory = 'keyboard' | 'mouse' | 'headset' | 'earphones' | 'mousepad' | 'monitor';
export type PlayerGear = { id: string; category: GearCategory; model: string };
export type PlayerProfile = { game: PlayerGame; name: string; gear: PlayerGear[] };

const categories = new Set<GearCategory>(['keyboard', 'mouse', 'headset', 'earphones', 'mousepad', 'monitor']);
const columns = ['id', 'game', 'player', 'team', 'category', 'brand', 'model', 'source_url', 'observed_at', 'checked_at', 'data_status', 'notes'];

/** Group a local staging file without treating its contents as verified facts. */
export function parsePlayerFiles(files: string[]): { players: PlayerProfile[]; invalid: number } {
  const players = new Map<string, PlayerProfile>();
  const ids = new Set<string>();
  let invalid = 0;
  for (const content of files) {
    const rows: string[][] = parse(content, { bom: true, skip_empty_lines: true });
    const header = rows.shift();
    if (!header || header.length !== columns.length || new Set(header).size !== columns.length || columns.some(name => !header.includes(name))) throw new Error('Invalid player data header');
    for (const cells of rows) {
      const row = Object.fromEntries(header.map((name, index) => [name, (cells[index] ?? '').trim()]));
      const game = row.game as PlayerGame;
      const category = row.category as GearCategory;
      if (!row.id || !row.player || !row.model || !['CS2', 'VALORANT'].includes(game) || !categories.has(category) || ids.has(row.id)) { invalid++; continue; }
      ids.add(row.id);
      const key = `${game}\u0000${row.player.toLowerCase()}`;
      let player = players.get(key);
      if (!player) { player = { game, name: row.player, gear: [] }; players.set(key, player); }
      player.gear.push({ id: row.id, category, model: row.model });
    }
  }
  return { players: [...players.values()].sort((a, b) => a.name.localeCompare(b.name, 'en') || a.game.localeCompare(b.game)), invalid };
}

export function searchPlayers(players: PlayerProfile[], game: string, query: string): PlayerProfile[] {
  const needle = query.trim().toLocaleLowerCase();
  return players.filter(player => (game === 'all' || player.game === game) && (!needle || player.name.toLocaleLowerCase().includes(needle) || player.gear.some(item => item.model.toLocaleLowerCase().includes(needle))));
}
