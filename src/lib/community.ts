import { getSupabase } from '@/lib/supabase';

export type CommunityPost = { id: string; author_id: string; title: string; body: string; device_list: string; image_path: string | null; created_at: string; imageUrl?: string };
export type CommunityComment = { id: string; post_id: string; author_id: string; body: string; created_at: string };
export type CommunityReport = { id: string; post_id: string; comment_id: string | null; reason: string; created_at: string; post?: { title: string; body: string; status: string }; comment?: { body: string; status: string } };
export type CommunitySession = { id: string; email?: string } | null;

function client() {
  const supabase = getSupabase();
  if (!supabase) throw new Error('社区尚未配置 Supabase。');
  return supabase;
}

function withDeadline<T>(operation: PromiseLike<T>, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(message)), 10000); });
  return Promise.race([Promise.resolve(operation), timeout]).finally(() => clearTimeout(timer));
}

export async function requestCommunityLogin(email: string, redirect: string) {
  const { error } = await withDeadline(client().auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirect } }), '邮件发送状态暂时无法确认，请先检查邮箱。');
  if (error) throw new Error('登录邮件发送失败，请检查邮箱及登录配置。');
}

export async function listPosts(ids?: string[]): Promise<CommunityPost[]> {
  const supabase = client();
  if (ids && !ids.length) return [];
  let query = supabase.from('community_posts').select('id,author_id,title,body,device_list,image_path,created_at').eq('status', 'published');
  if (ids) query = query.in('id', ids);
  const { data, error } = await withDeadline(query.order('created_at', { ascending: false }).order('id', { ascending: false }).limit(50).abortSignal(AbortSignal.timeout(10000)), '社区连接超时，请检查网络后重试。');
  if (error) throw new Error('社区暂时无法读取，请检查数据库是否已初始化。');
  return Promise.all((data as CommunityPost[]).map(async post => {
    if (!post.image_path) return post;
    try { const { data: image } = await withDeadline(supabase.storage.from('community-images').createSignedUrl(post.image_path, 120), '图片加载超时。'); return { ...post, imageUrl: image?.signedUrl }; }
    catch { return post; }
  }));
}

export async function listComments(postId: string): Promise<CommunityComment[]> {
  const { data, error } = await withDeadline(client().from('community_comments').select('id,post_id,author_id,body,created_at').eq('post_id', postId).eq('status', 'visible').order('created_at').limit(100).abortSignal(AbortSignal.timeout(10000)), '评论加载超时，请重试。');
  if (error) throw new Error('评论加载失败，请重试。');
  return data as CommunityComment[];
}

export async function listMyInteractions(userId: string) {
  const supabase = client();
  const [likes, favorites] = await withDeadline(Promise.all([
    supabase.from('community_likes').select('post_id').eq('user_id', userId).abortSignal(AbortSignal.timeout(10000)),
    supabase.from('community_favorites').select('post_id').eq('user_id', userId).abortSignal(AbortSignal.timeout(10000)),
  ]), '互动状态加载超时。');
  if (likes.error || favorites.error) throw new Error('互动状态加载失败，请重试。');
  return { likes: new Set((likes.data || []).map(item => item.post_id as string)), favorites: new Set((favorites.data || []).map(item => item.post_id as string)) };
}

export async function isModerator(userId: string): Promise<boolean> {
  try { const { data, error } = await withDeadline(client().from('community_moderators').select('user_id').eq('user_id', userId).abortSignal(AbortSignal.timeout(10000)).maybeSingle(), '权限检查超时。'); return !error && !!data; }
  catch { return false; }
}

export async function publishPost(input: { title: string; body: string; deviceList: string; image: File | null; userId: string }) {
  const supabase = client();
  const title = input.title.trim(), body = input.body.trim(), deviceList = input.deviceList.trim();
  if (!title || title.length > 100 || !body || body.length > 5000 || deviceList.length > 1000) throw new Error('请填写标题和内容，并检查字数限制。');
  let path: string | null = null;
  if (input.image) {
    const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    const extension = extensions[input.image.type];
    if (!extension || input.image.size > 5 * 1024 * 1024 || input.image.size === 0) throw new Error('请选择不超过 5 MB 的 JPG、PNG 或 WebP 图片。');
    path = `${input.userId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await withDeadline(supabase.storage.from('community-images').upload(path, input.image, { contentType: input.image.type, upsert: false }), '图片上传状态暂时无法确认，请稍后重试。');
    if (error) throw new Error('图片上传失败，请检查存储配置后重试。');
  }
  const result = await withDeadline(supabase.from('community_posts').insert({ title, body, device_list: deviceList, image_path: path }).abortSignal(AbortSignal.timeout(10000)), '发布状态暂时无法确认，请刷新社区检查后再重试。');
  if (result.error) {
    // A timeout can occur after a commit. Preserve the image when the result is uncertain.
    const definiteRejection = result.status >= 400 && result.status < 500 && result.status !== 408 && result.status !== 429;
    if (!definiteRejection) throw new Error('发布状态暂时无法确认，请刷新社区检查后再重试。');
    if (path) {
      const cleanup = await withDeadline(supabase.storage.from('community-images').remove([path]), '图片清理状态暂时无法确认，请联系管理员。');
      if (cleanup.error) throw new Error('帖子发布失败，图片清理也未完成；请联系管理员。');
    }
    throw new Error('发布失败，请检查社区配置后重试。');
  }
}

export async function addComment(postId: string, text: string) {
  const body = text.trim();
  if (!body || body.length > 1000) throw new Error('评论需要 1 到 1000 个字符。');
  const { error } = await withDeadline(client().from('community_comments').insert({ post_id: postId, body }).abortSignal(AbortSignal.timeout(10000)), '评论状态暂时无法确认，请刷新后检查。');
  if (error) throw new Error('评论发送失败，请重试。');
}

export async function setInteraction(kind: 'likes' | 'favorites', postId: string, userId: string, active: boolean) {
  const table = kind === 'likes' ? 'community_likes' : 'community_favorites';
  const supabase = client();
  const result = await withDeadline(active ? supabase.from(table).delete().eq('post_id', postId).eq('user_id', userId).abortSignal(AbortSignal.timeout(10000)) : supabase.from(table).insert({ post_id: postId }).abortSignal(AbortSignal.timeout(10000)), '操作状态暂时无法确认，请刷新后检查。');
  if (result.error) throw new Error('操作未完成，请重试。');
}

export async function submitReport(postId: string, commentId: string | null, reason: string) {
  const cleaned = reason.trim();
  if (!cleaned || cleaned.length > 500) throw new Error('举报原因需要 1 到 500 个字符。');
  const { error } = await withDeadline(client().from('community_reports').insert({ post_id: postId, comment_id: commentId, reason: cleaned }).abortSignal(AbortSignal.timeout(10000)), '举报状态暂时无法确认，请稍后检查。');
  if (error) throw new Error('举报提交失败，请重试。');
}

export async function listReports(): Promise<CommunityReport[]> {
  const supabase = client();
  const { data, error } = await withDeadline(supabase.from('community_reports').select('id,post_id,comment_id,reason,created_at').eq('status', 'open').order('created_at', { ascending: false }).limit(50).abortSignal(AbortSignal.timeout(10000)), '举报列表加载超时。');
  if (error) throw new Error('举报列表加载失败。');
  const reports = data as CommunityReport[];
  if (!reports.length) return [];
  const postIds = [...new Set(reports.map(report => report.post_id))];
  const commentIds = [...new Set(reports.flatMap(report => report.comment_id ? [report.comment_id] : []))];
  const [posts, comments] = await withDeadline(Promise.all([
    supabase.from('community_posts').select('id,title,body,status').in('id', postIds).abortSignal(AbortSignal.timeout(10000)),
    commentIds.length ? supabase.from('community_comments').select('id,body,status').in('id', commentIds).abortSignal(AbortSignal.timeout(10000)) : Promise.resolve({ data: [], error: null }),
  ]), '被举报内容加载超时。');
  if (posts.error || comments.error) throw new Error('被举报内容加载失败。');
  return reports.map(report => ({ ...report, post: posts.data?.find(post => post.id === report.post_id), comment: comments.data?.find(comment => comment.id === report.comment_id) }));
}

export async function resolveReport(report: CommunityReport, hide: boolean) {
  const supabase = client();
  if (hide) {
    const target = report.comment_id ? 'community_comments' : 'community_posts';
    const id = report.comment_id || report.post_id;
    const { data, error } = await withDeadline(supabase.from(target).update({ status: 'hidden' }).eq('id', id).select('id').abortSignal(AbortSignal.timeout(10000)).maybeSingle(), '内容处理状态暂时无法确认，请刷新后检查。');
    if (error || !data) throw new Error('隐藏内容失败，请检查管理员权限。');
  }
  const { data, error } = await withDeadline(supabase.from('community_reports').update({ status: 'resolved' }).eq('id', report.id).select('id').abortSignal(AbortSignal.timeout(10000)).maybeSingle(), '举报处理状态暂时无法确认，请刷新后检查。');
  if (error || !data) throw new Error('更新举报状态失败，请重试。');
}
