import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { describe, expect, it } from 'vitest';

describe('社区数据库权限', () => {
  it('隔离用户操作并只允许管理员隐藏内容与查看举报', async () => {
    const db = new PGlite();
    const user = '11111111-1111-1111-1111-111111111111';
    const other = '22222222-2222-2222-2222-222222222222';
    const admin = '33333333-3333-3333-3333-333333333333';
    try {
      await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
        create schema storage; create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]); create table storage.objects(bucket_id text, name text); alter table storage.objects enable row level security; create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name,'/') $$; grant usage on schema storage to anon,authenticated; grant select, insert, delete on storage.objects to anon,authenticated; grant execute on function storage.foldername(text) to anon,authenticated;`);
      await db.exec(await readFile('supabase/migrations/20261104085545_community.sql', 'utf8'));
      await db.query('insert into auth.users(id) values ($1),($2),($3)', [user, other, admin]);
      await db.query('insert into public.community_moderators(user_id) values ($1)', [admin]);
      await db.exec(`set role authenticated; set request.jwt.claim.sub='${user}'`);
      const post = await db.query<{id:string}>("insert into public.community_posts(title,body,image_path) values ('作品','内容', $1) returning id", [`${user}/a.png`]);
      const postId = post.rows[0].id;
      await db.query('insert into storage.objects(bucket_id,name) values ($1,$2)', ['community-images', `${user}/a.png`]);
      await expect(db.query('insert into storage.objects(bucket_id,name) values ($1,$2)', ['community-images', `${other}/bad.png`])).rejects.toThrow();
      await db.exec('reset role; set role anon');
      expect((await db.query('select * from public.community_posts')).rows).toHaveLength(1);
      expect((await db.query('select * from storage.objects')).rows).toHaveLength(1);
      await db.exec(`reset role; set role authenticated; set request.jwt.claim.sub='${user}'`);
      await db.query('insert into public.community_likes(post_id) values ($1)', [postId]);
      await db.query('insert into public.community_favorites(post_id) values ($1)', [postId]);
      const comment = await db.query<{id:string}>("insert into public.community_comments(post_id,body) values ($1,'评论') returning id", [postId]);
      await expect(db.query("insert into public.community_moderators(user_id) values ($1)", [user])).rejects.toThrow();
      await expect(db.query("insert into public.community_posts(author_id,title,body) values ($1,'伪造','内容')", [other])).rejects.toThrow();
      await expect(db.query("update public.community_posts set status='hidden' where id=$1", [postId])).resolves.toMatchObject({ affectedRows: 0 });
      await expect(db.query("update public.community_posts set title='改标题' where id=$1", [postId])).rejects.toThrow();
      await db.exec(`set request.jwt.claim.sub='${other}'`);
      expect((await db.query('select * from public.community_likes')).rows).toHaveLength(0);
      expect((await db.query('select * from public.community_favorites')).rows).toHaveLength(0);
      const otherPost = await db.query<{id:string}>("insert into public.community_posts(title,body) values ('另一篇','内容') returning id");
      await expect(db.query("insert into public.community_reports(post_id,comment_id,reason) values ($1,$2,'错误关联')", [otherPost.rows[0].id, comment.rows[0].id])).rejects.toThrow();
      await db.query("insert into public.community_reports(post_id,comment_id,reason) values ($1,$2,'请检查')", [postId, comment.rows[0].id]);
      expect((await db.query('select * from public.community_reports')).rows).toHaveLength(0);
      await db.exec(`set request.jwt.claim.sub='${admin}'`);
      expect((await db.query('select * from public.community_reports')).rows).toHaveLength(1);
      await db.query("update public.community_comments set status='hidden' where id=$1", [comment.rows[0].id]);
      await db.query("update public.community_posts set status='hidden' where id=$1", [postId]);
      await db.exec("reset role; set role anon");
      expect((await db.query('select * from public.community_posts')).rows).toHaveLength(1);
      expect((await db.query('select * from public.community_comments')).rows).toHaveLength(0);
      expect((await db.query('select * from storage.objects')).rows).toHaveLength(0);
      await expect(db.query("insert into public.community_posts(title,body) values ('x','y')")).rejects.toThrow();
    } finally { await db.close(); }
  }, 30000);
});
