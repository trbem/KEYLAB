import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parsePlayerFiles, type PlayerProfile } from './player-data';

export type PlayerSource = { status: 'ready' | 'incomplete' | 'missing' | 'disabled'; players: PlayerProfile[]; invalid: number };

/** Local staging data is only used by the development server and is never statically bundled. */
export async function loadLocalPlayers(): Promise<PlayerSource> {
  if (process.env.NODE_ENV !== 'development') return { status: 'disabled', players: [], invalid: 0 };
  const files = ['prosettings-player-gear.csv', 'prosettings-earphones.csv'];
  const results = await Promise.allSettled(files.map(file => readFile(join(process.cwd(), 'local-data', file), 'utf8')));
  const contents = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
  if (!contents.length) return { status: 'missing', players: [], invalid: 0 };
  try {
    const data = parsePlayerFiles(contents);
    return { status: contents.length < files.length || data.invalid ? 'incomplete' : 'ready', ...data };
  } catch {
    return { status: 'incomplete', players: [], invalid: 0 };
  }
}
