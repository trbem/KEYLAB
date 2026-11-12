'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { addComment, isModerator, listComments, listMyInteractions, listPosts, listReports, publishPost, requestCommunityLogin, resolveReport, setInteraction, submitReport, type CommunityComment, type CommunityPost, type CommunityReport, type CommunitySession } from '@/lib/community';

const date = (value: string) => { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString('zh-CN'); };
const author = (id: string) => `玩家 ${id.slice(0, 6)}`;
const errorText = (error: unknown) => error instanceof Error ? error.message : '操作失败，请稍后重试。';

function PostCard({ post, liked, favorited, busy, onOpen, onLike, onFavorite }: { post: CommunityPost; liked: boolean; favorited: boolean; busy: boolean; onOpen: () => void; onLike: () => void; onFavorite: () => void }) {
  return <article className="community-card"><button className="community-cover" onClick={onOpen} aria-label={`查看 ${post.title}`}>
    {post.imageUrl ? <Image src={post.imageUrl} alt="" width={800} height={500} unoptimized/> : <span className="community-cover-art"><i>✳</i><b>YOUR<br/>SETUP.</b><small>KEYLAB COMMUNITY</small></span>}
  </button><div className="community-card-body"><div className="community-card-meta"><span>{author(post.author_id)}</span><time dateTime={post.created_at}>{date(post.created_at)}</time></div><button className="community-post-title" onClick={onOpen}>{post.title}</button><p>{post.body}</p>{post.device_list && <div className="community-device-preview">{post.device_list}</div>}<div className="community-card-actions"><button disabled={busy} aria-pressed={liked} onClick={onLike}>{liked ? '♥ 已赞' : '♡ 点赞'}</button><button disabled={busy} aria-pressed={favorited} onClick={onFavorite}>{favorited ? '★ 已收藏' : '☆ 收藏'}</button><button onClick={onOpen}>查看讨论 ↗</button></div></div></article>;
}

export default function Community() {
  const [session, setSession] = useState<CommunitySession>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritePosts, setFavoritePosts] = useState<CommunityPost[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState('');
  const [moderator, setModerator] = useState(false);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [dialog, setDialog] = useState<'login' | 'compose' | 'post' | 'reports' | null>(null);
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [deviceList, setDeviceList] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [selected, setSelected] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState('');
  const [comment, setComment] = useState('');
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try { const next = await listPosts(); setPosts(next); setError(''); }
    catch (err) { setError(errorText(err)); }
    finally { if (!quiet) setLoading(false); }
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) { const timer = setTimeout(() => setSessionReady(true), 0); return () => clearTimeout(timer); }
    let active = true;
    const update = (user: { id: string; email?: string } | null) => { if (active) { setSession(user ? { id: user.id, email: user.email } : null); setSessionReady(true); } };
    const timeout = setTimeout(() => { if (active) setSessionReady(true); }, 8000);
    supabase.auth.getSession().then(({ data }) => update(data.session?.user || null)).catch(() => update(null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => update(next?.user || null));
    return () => { active = false; clearTimeout(timeout); subscription.unsubscribe(); };
  }, []);

  useEffect(() => { const initial = setTimeout(() => void refresh(), 0); const timer = setInterval(() => void refresh(true), 90000); return () => { clearTimeout(initial); clearInterval(timer); }; }, [refresh]);
  useEffect(() => {
    let active = true;
    if (session) {
      void Promise.all([listMyInteractions(session.id), isModerator(session.id)]).then(([interactions, isAdmin]) => { if (active) { setLikes(interactions.likes); setFavorites(interactions.favorites); setModerator(isAdmin); } }).catch(() => { if (active) setNotice('互动状态暂时不可用，请稍后重试。'); });
    } else {
      const timer = setTimeout(() => { if (active) { setLikes(new Set()); setFavorites(new Set()); setModerator(false); } }, 0);
      return () => { active = false; clearTimeout(timer); };
    }
    return () => { active = false; };
  }, [session]);
  useEffect(() => { if (!image) return; const url = URL.createObjectURL(image); const timer = setTimeout(() => setPreview(url), 0); return () => { clearTimeout(timer); URL.revokeObjectURL(url); }; }, [image]);
  useEffect(() => { if (filter !== 'favorites' || !session) return; let active = true; const load = () => { setFavoritesLoading(true); setFavoritesError(''); void listPosts([...favorites]).then(next => { if (active) setFavoritePosts(next); }).catch(err => { if (active) setFavoritesError(errorText(err)); }).finally(() => { if (active) setFavoritesLoading(false); }); }; const initial = setTimeout(load, 0); const timer = setInterval(load, 90000); return () => { active = false; clearTimeout(initial); clearInterval(timer); }; }, [filter, session, favorites]);

  const requireLogin = () => { if (!session) { setDialog('login'); return false; } return true; };
  const loadComments = async (postId: string) => { setCommentsLoading(true); setCommentsError(''); try { setComments(await listComments(postId)); } catch (err) { setCommentsError(errorText(err)); } finally { setCommentsLoading(false); } };
  const loadReports = async () => { setReportsLoading(true); setReportsError(''); try { setReports(await listReports()); } catch (err) { setReportsError(errorText(err)); } finally { setReportsLoading(false); } };
  const openPost = async (post: CommunityPost) => { setSelected(post); setComments([]); setComment(''); setDialog('post'); await loadComments(post.id); };
  const toggle = async (kind: 'likes' | 'favorites', postId: string) => {
    if (!requireLogin() || !session) return;
    const values = kind === 'likes' ? likes : favorites;
    setBusy(true);
    try { await setInteraction(kind, postId, session.id, values.has(postId)); const next = new Set(values); if (next.has(postId)) next.delete(postId); else next.add(postId); (kind === 'likes' ? setLikes : setFavorites)(next); }
    catch (err) { setNotice(errorText(err)); }
    finally { setBusy(false); }
  };
  const report = async (postId: string, commentId: string | null) => {
    if (!requireLogin()) return;
    const reason = window.prompt('请填写举报原因（最多 500 字）');
    if (reason === null) return;
    setBusy(true);
    try { await submitReport(postId, commentId, reason); setNotice('举报已提交，感谢反馈。'); }
    catch (err) { setNotice(errorText(err)); }
    finally { setBusy(false); }
  };
  const visible = filter === 'favorites' ? favoritePosts : posts;

  return <main className="community-page"><header className="community-hero"><div><div className="eyebrow">COMMUNITY / 玩家社区</div><h1>你的桌面，<br/><em>你的灵感。</em></h1><p>分享你的键盘与外设搭配，发现更多玩家的独特创意。</p><button className="button primary" disabled={!sessionReady} onClick={() => { if (requireLogin()) setDialog('compose'); }}>发布分享 ↗</button></div><div className="community-hero-art" aria-hidden="true"><div className="community-art-orbit"/><div className="community-art-card"><small>KEYLAB COMMUNITY</small><b>MAKE IT<br/><em>YOURS.</em></b><span>✳</span></div><p>CREATE · SHARE · DISCOVER</p></div></header>
    <section className="community-content"><div className="community-section-head"><div><div className="eyebrow">THE FEED / 灵感广场</div><h2>玩家分享</h2><p>在这里，记录属于你的桌面故事。每次显示最多 50 篇。</p></div><div className="community-tabs"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>最新分享</button><button className={filter === 'favorites' ? 'active' : ''} onClick={() => { if (requireLogin()) setFilter('favorites'); }}>我的收藏</button>{moderator && <button onClick={() => { setDialog('reports'); void loadReports(); }}>举报管理</button>}</div></div>
      {loading || (filter === 'favorites' && favoritesLoading) ? <div className="community-empty"><b>正在加载分享…</b><p>请稍候。</p></div> : error || (filter === 'favorites' && favoritesError) ? <div className="community-empty"><b>暂时无法加载社区</b><p>{error || favoritesError}</p><button onClick={() => { setFilter('all'); void refresh(); }}>重新加载</button></div> : visible.length ? <div className="community-grid">{visible.map(post => <PostCard key={post.id} post={post} liked={likes.has(post.id)} favorited={favorites.has(post.id)} busy={busy} onOpen={() => void openPost(post)} onLike={() => void toggle('likes', post.id)} onFavorite={() => void toggle('favorites', post.id)}/>)}</div> : <div className="community-empty"><b>{filter === 'favorites' ? '还没有收藏的分享' : '还没有分享，来发布第一篇吧'}</b><p>{filter === 'favorites' ? '喜欢的搭配可以收藏在这里。' : '上传图片，写下你的外设搭配和想法。'}</p><button onClick={() => { if (filter === 'favorites') setFilter('all'); else if (requireLogin()) setDialog('compose'); }}>{filter === 'favorites' ? '浏览分享' : '发布分享'}</button></div>}
    </section>
    {notice && <div className="toast" role="status" onClick={() => setNotice('')}>{notice} <span>×</span></div>}
    {dialog && <div className="community-modal-backdrop" onClick={() => !busy && setDialog(null)}><section className="community-modal" role="dialog" aria-modal="true" aria-label={dialog === 'login' ? '邮箱登录' : dialog === 'compose' ? '发布分享' : dialog === 'reports' ? '举报管理' : '分享详情'} onClick={event => event.stopPropagation()}><button className="community-modal-close" aria-label="关闭" disabled={busy} onClick={() => setDialog(null)}>×</button>
      {dialog === 'login' && <><div className="eyebrow">WELCOME TO KEYLAB</div><h2>邮箱登录</h2><p className="community-modal-copy">浏览无需登录；发布和互动时，用邮箱接收登录链接。</p><form onSubmit={event => { event.preventDefault(); setBusy(true); void requestCommunityLogin(email, window.location.origin + '/community').then(() => { setNotice('登录链接已发送，请查收邮件。'); setDialog(null); }).catch(err => setNotice(errorText(err))).finally(() => setBusy(false)); }}><label>邮箱地址<input type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com"/></label><button className="button primary" disabled={busy}>发送登录链接 →</button></form></>}
      {dialog === 'compose' && <><div className="eyebrow">CREATE YOUR STORY</div><h2>发布你的搭配</h2><p className="community-modal-copy">写下你的想法，可以附上一张图片和设备清单。</p><form onSubmit={event => { event.preventDefault(); if (!session) { setDialog('login'); return; } setBusy(true); void publishPost({ title, body, deviceList, image, userId: session.id }).then(async () => { setTitle(''); setBody(''); setDeviceList(''); setImage(null); setPreview(''); setDialog(null); await refresh(); setNotice('分享已发布。'); }).catch(err => setNotice(errorText(err))).finally(() => setBusy(false)); }}><label>标题 <span>{title.length}/100</span><input value={title} maxLength={100} required onChange={event => setTitle(event.target.value)} placeholder="给你的搭配起个名字"/></label><label>分享内容 <span>{body.length}/5000</span><textarea value={body} maxLength={5000} required rows={5} onChange={event => setBody(event.target.value)} placeholder="介绍一下你的桌面、配色或使用心得"/></label><label>设备清单（可选）<textarea value={deviceList} maxLength={1000} rows={3} onChange={event => setDeviceList(event.target.value)} placeholder="键盘、鼠标、耳机……"/></label><label>搭配图片（可选，JPG / PNG / WebP，最大 5 MB）<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { setPreview(''); setImage(event.target.files?.[0] || null); }}/></label>{preview && <Image src={preview} alt="待发布的搭配图片预览" width={600} height={300} unoptimized className="community-image-preview"/>}<button className="button primary" disabled={busy}>发布分享 →</button></form></>}
      {dialog === 'post' && selected && <><div className="eyebrow">PLAYER STORY</div><h2>{selected.title}</h2><p className="community-modal-copy">{author(selected.author_id)} · {date(selected.created_at)}</p>{selected.imageUrl && <Image src={selected.imageUrl} alt="玩家分享的搭配" width={800} height={500} unoptimized className="community-post-image"/>}<p className="community-post-body">{selected.body}</p>{selected.device_list && <div className="community-detail-devices"><b>设备清单</b><p>{selected.device_list}</p></div>}<div className="community-detail-actions"><button disabled={busy} onClick={() => void toggle('likes', selected.id)}>{likes.has(selected.id) ? '♥ 已赞' : '♡ 点赞'}</button><button disabled={busy} onClick={() => void toggle('favorites', selected.id)}>{favorites.has(selected.id) ? '★ 已收藏' : '☆ 收藏'}</button><button disabled={busy} onClick={() => void report(selected.id, null)}>举报帖子</button></div><h3 className="community-comments-title">讨论</h3>{commentsLoading ? <p className="community-modal-copy">正在加载评论…</p> : commentsError ? <p className="community-modal-copy">{commentsError} <button onClick={() => void loadComments(selected.id)}>重试</button></p> : comments.length ? <div className="community-comments">{comments.map(item => <div key={item.id}><b>{author(item.author_id)}</b><time dateTime={item.created_at}>{date(item.created_at)}</time><p>{item.body}</p><button disabled={busy} onClick={() => void report(selected.id, item.id)}>举报</button></div>)}</div> : <p className="community-modal-copy">还没有评论，来分享你的想法。</p>}<form onSubmit={event => { event.preventDefault(); if (!requireLogin()) return; setBusy(true); void addComment(selected.id, comment).then(async () => { setComment(''); await loadComments(selected.id); setNotice('评论已发送。'); }).catch(err => setNotice(errorText(err))).finally(() => setBusy(false)); }}><label>发表评论<textarea rows={3} maxLength={1000} required value={comment} onChange={event => setComment(event.target.value)} placeholder="写下你的想法"/></label><button className="button primary" disabled={busy}>发送评论 →</button></form></>}
      {dialog === 'reports' && <><div className="eyebrow">MODERATION</div><h2>举报管理</h2><p className="community-modal-copy">处理后可隐藏被举报内容，或仅标记为已处理。</p>{reportsLoading ? <p className="community-modal-copy">正在加载举报…</p> : reportsError ? <p className="community-modal-copy">{reportsError} <button onClick={() => void loadReports()}>重试</button></p> : reports.length ? <div className="community-report-list">{reports.map(item => <article key={item.id}><small>{item.comment_id ? '评论举报' : '帖子举报'} · {date(item.created_at)}</small><p>举报原因：{item.reason}</p><div className="community-report-content"><b>{item.post?.title || '帖子内容不可用'}</b><p>{item.comment_id ? item.comment?.body || '评论内容不可用' : item.post?.body}</p><span>当前状态：{(item.comment_id ? item.comment?.status : item.post?.status) === 'hidden' ? '已隐藏' : '可见或未知'}</span></div><div><button disabled={busy} onClick={() => { setBusy(true); void resolveReport(item, true).then(async () => { setReports(await listReports()); await refresh(true); setNotice('内容已隐藏，举报已处理。'); }).catch(err => setNotice(errorText(err))).finally(() => setBusy(false)); }}>隐藏并处理</button><button disabled={busy} onClick={() => { setBusy(true); void resolveReport(item, false).then(async () => { setReports(await listReports()); setNotice('举报已标记为处理。'); }).catch(err => setNotice(errorText(err))).finally(() => setBusy(false)); }}>标记处理</button></div></article>)}</div> : <p className="community-modal-copy">暂无待处理举报。</p>}</>}
    </section></div>}
  </main>;
}
