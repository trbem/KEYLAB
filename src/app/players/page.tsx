import Link from 'next/link';
import { loadLocalPlayers } from '@/lib/player-data-server';
import { searchPlayers, type GearCategory, type PlayerProfile } from '@/lib/player-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const labels: Record<GearCategory, string> = { keyboard: '键盘', mouse: '鼠标', headset: '头戴耳机', earphones: '入耳耳机', mousepad: '鼠标垫', monitor: '显示器' };
const order: GearCategory[] = ['keyboard', 'mouse', 'headset', 'earphones', 'mousepad', 'monitor'];
const pageSize = 12;
const one = (value: string | string[] | undefined) => typeof value === 'string' ? value : '';

function pageLink(game: string, query: string, page: number) {
  const params = new URLSearchParams();
  if (game !== 'all') params.set('game', game);
  if (query) params.set('q', query);
  if (page > 1) params.set('page', String(page));
  const suffix = params.toString();
  return '/players' + (suffix ? `?${suffix}` : '');
}

function PlayerCard({ player }: { player: PlayerProfile }) {
  const href = `/players?${new URLSearchParams({ game: player.game, player: player.name })}`;
  return <Link href={href} className="player-card"><div className="player-card-top"><span className="player-avatar" aria-hidden="true">{player.name.charAt(0).toUpperCase()}</span><span className="player-game">{player.game}</span></div><h2>{player.name}</h2><p>外设资料 <span>·</span> 未核验</p><div className="player-card-gear">{order.slice(0, 3).map(category => { const item = player.gear.find(gear => gear.category === category); return <div key={category}><span>{labels[category]}</span><b>{item?.model || '未提供'}</b></div>; })}</div><div className="player-card-action">查看外设配置 <span>↗</span></div></Link>;
}

function PlayerDetail({ player }: { player: PlayerProfile }) {
  return <section className="player-detail"><Link className="player-back" href={pageLink(player.game, '', 1)}>← 返回选手列表</Link><div className="player-detail-header"><span className="player-avatar player-avatar-large" aria-hidden="true">{player.name.charAt(0).toUpperCase()}</span><div><div className="player-game">{player.game} / 外设资料</div><h2>{player.name}</h2><p>资料来自本地整理，来源与时间未知，具体使用情况未核验。</p></div></div><div className="player-detail-grid">{order.map(category => { const items = player.gear.filter(gear => gear.category === category); return <article key={category}><span>{labels[category]}</span>{items.length ? items.map(item => <strong key={item.id}>{item.model}</strong>) : <strong className="player-missing">未提供</strong>}<small>来源未提供 · 时间未知</small></article>; })}</div><p className="player-detail-note">本页为资料整理预览，型号可能变化；不代表当前在售、价格或配件兼容性。</p></section>;
}

export default async function PlayersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const game = ['CS2', 'VALORANT'].includes(one(params.game)) ? one(params.game) : 'all';
  const query = one(params.q).trim().slice(0, 100);
  const selected = one(params.player);
  const source = await loadLocalPlayers();
  const player = selected ? source.players.find(item => item.game === game && item.name === selected) : undefined;
  const found = searchPlayers(source.players, game, query);
  const pages = Math.max(1, Math.ceil(found.length / pageSize));
  const page = Math.min(pages, Math.max(1, Number.parseInt(one(params.page), 10) || 1));
  const visible = found.slice((page - 1) * pageSize, page * pageSize);

  return <main className="players-page"><div className="players-heading"><div><div className="eyebrow">PRO SETUPS / 选手外设资料</div><h1>从选手的配置，<br/><em>找到你的灵感。</em></h1><p>浏览键盘、鼠标与耳机搭配，发现你感兴趣的设备。</p></div><div className="players-heading-mark" aria-hidden="true"><span>PLAY</span><b>YOUR<br/>SETUP.</b><i>✦</i></div></div><div className="players-notice"><span>资料待核验</span><p>本地整理数据，来源与时间未提供，型号可能已变化。请勿将其视为实时或已验证的选手配置。</p></div>{source.status === 'disabled' ? <div className="players-empty"><h2>本地资料预览未启用</h2><p>当前页面不会在生产构建中加载本地待核验资料。</p></div> : source.status === 'missing' ? <div className="players-empty"><h2>还没有本地资料</h2><p>请先按数据整理说明准备选手外设文件。</p><Link href="/">返回首页 →</Link></div> : <>{source.status === 'incomplete' && <p className="players-warning">部分资料文件缺失或格式异常，请检查本地数据。</p>}{selected && !player ? <div className="players-empty"><h2>没有找到这位选手</h2><Link href="/players">返回选手列表 →</Link></div> : player ? <PlayerDetail player={player}/> : <><div className="players-toolbar"><div className="players-filter" aria-label="选择游戏">{[['all', '全部游戏'], ['CS2', 'CS2'], ['VALORANT', 'VALORANT']].map(([value, label]) => <Link key={value} href={pageLink(value, query, 1)} className={game === value ? 'active' : ''} aria-current={game === value ? 'page' : undefined}>{label}</Link>)}</div><form className="players-search" action="/players"><label className="sr-only" htmlFor="player-search">搜索选手或设备</label><input id="player-search" name="q" type="search" defaultValue={query} placeholder="搜索选手或设备"/>{game !== 'all' && <input type="hidden" name="game" value={game}/>}<button type="submit">搜索 ↗</button></form></div><div className="players-list-heading"><div><span>THE PLAYER INDEX</span><h2>{game === 'all' ? '选手配置' : `${game} 选手配置`}</h2></div><p>共 {found.length} 条选手游戏记录</p></div>{visible.length ? <div className="players-grid">{visible.map(item => <PlayerCard key={`${item.game}-${item.name}`} player={item}/>)}</div> : <div className="players-empty"><h2>没有找到匹配结果</h2><p>试试其他选手名称或设备型号。</p><Link href="/players">清除筛选 →</Link></div>}{pages > 1 && <nav className="players-pagination" aria-label="选手列表分页">{page > 1 ? <Link href={pageLink(game, query, page - 1)}>← 上一页</Link> : <span>← 上一页</span>}<span>{page} / {pages}</span>{page < pages ? <Link href={pageLink(game, query, page + 1)}>下一页 →</Link> : <span>下一页 →</span>}</nav>}</>}</>}</main>;
}
