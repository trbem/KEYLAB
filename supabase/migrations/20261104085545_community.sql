-- KEYLAB community. Review and apply only to an explicitly approved project.
begin;

create table public.community_moderators (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 100),
  body text not null check (char_length(trim(body)) between 1 and 5000),
  device_list text not null default '' check (char_length(device_list) <= 1000),
  image_path text,
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now()
);
create table public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  created_at timestamptz not null default now(),
  unique (id, post_id)
);
create table public.community_likes (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create table public.community_favorites (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create table public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  post_id uuid not null references public.community_posts(id) on delete cascade,
  comment_id uuid,
  reason text not null check (char_length(trim(reason)) between 1 and 500),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  foreign key (comment_id, post_id) references public.community_comments(id, post_id) on delete cascade
);
create index community_posts_feed_idx on public.community_posts(status, created_at desc, id desc);
create index community_comments_post_idx on public.community_comments(post_id, status, created_at);
create index community_reports_created_idx on public.community_reports(created_at desc);
create index community_likes_user_idx on public.community_likes(user_id);
create index community_favorites_user_idx on public.community_favorites(user_id);

alter table public.community_moderators enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_likes enable row level security;
alter table public.community_favorites enable row level security;
alter table public.community_reports enable row level security;

create policy "moderator can read own membership" on public.community_moderators for select to authenticated using (user_id = (select auth.uid()));
create policy "read published posts" on public.community_posts for select to anon, authenticated using (status = 'published');
create policy "moderators read all posts" on public.community_posts for select to authenticated using (exists (select 1 from public.community_moderators m where m.user_id = (select auth.uid())));
create policy "users publish own posts" on public.community_posts for insert to authenticated with check (author_id = (select auth.uid()) and status = 'published' and (image_path is null or split_part(image_path, '/', 1) = (select auth.uid())::text));
create policy "moderators change post visibility" on public.community_posts for update to authenticated using (exists (select 1 from public.community_moderators m where m.user_id = (select auth.uid()))) with check (exists (select 1 from public.community_moderators m where m.user_id = (select auth.uid())));

create policy "read visible comments" on public.community_comments for select to anon, authenticated using (status = 'visible' and exists (select 1 from public.community_posts p where p.id = post_id and p.status = 'published'));
create policy "moderators read all comments" on public.community_comments for select to authenticated using (exists (select 1 from public.community_moderators m where m.user_id = (select auth.uid())));
create policy "users write comments" on public.community_comments for insert to authenticated with check (author_id = (select auth.uid()) and status = 'visible' and exists (select 1 from public.community_posts p where p.id = post_id and p.status = 'published'));
create policy "moderators change comment visibility" on public.community_comments for update to authenticated using (exists (select 1 from public.community_moderators m where m.user_id = (select auth.uid()))) with check (exists (select 1 from public.community_moderators m where m.user_id = (select auth.uid())));

create policy "read own likes" on public.community_likes for select to authenticated using (user_id = (select auth.uid()));
create policy "create own likes" on public.community_likes for insert to authenticated with check (user_id = (select auth.uid()) and exists (select 1 from public.community_posts p where p.id = post_id and p.status = 'published'));
create policy "delete own likes" on public.community_likes for delete to authenticated using (user_id = (select auth.uid()));
create policy "read own favorites" on public.community_favorites for select to authenticated using (user_id = (select auth.uid()));
create policy "create own favorites" on public.community_favorites for insert to authenticated with check (user_id = (select auth.uid()) and exists (select 1 from public.community_posts p where p.id = post_id and p.status = 'published'));
create policy "delete own favorites" on public.community_favorites for delete to authenticated using (user_id = (select auth.uid()));
create policy "submit own reports" on public.community_reports for insert to authenticated with check (reporter_id = (select auth.uid()) and status = 'open' and exists (select 1 from public.community_posts p where p.id = post_id and p.status = 'published') and (comment_id is null or exists (select 1 from public.community_comments c where c.id = comment_id and c.post_id = community_reports.post_id and c.status = 'visible')));
create policy "moderators read reports" on public.community_reports for select to authenticated using (exists (select 1 from public.community_moderators m where m.user_id = (select auth.uid())));
create policy "moderators resolve reports" on public.community_reports for update to authenticated using (exists (select 1 from public.community_moderators m where m.user_id = (select auth.uid()))) with check (exists (select 1 from public.community_moderators m where m.user_id = (select auth.uid())));

grant select on public.community_posts, public.community_comments to anon, authenticated;
grant select on public.community_moderators, public.community_likes, public.community_favorites, public.community_reports to authenticated;
grant insert (title, body, device_list, image_path) on public.community_posts to authenticated;
grant update (status) on public.community_posts to authenticated;
grant insert (post_id, body) on public.community_comments to authenticated;
grant update (status) on public.community_comments to authenticated;
grant insert (post_id), delete on public.community_likes, public.community_favorites to authenticated;
grant insert (post_id, comment_id, reason) on public.community_reports to authenticated;
grant update (status) on public.community_reports to authenticated;

-- Private bucket: signed reads are controlled by post visibility and ownership.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community-images', 'community-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);
create policy "community image upload by owner" on storage.objects for insert to authenticated with check (bucket_id = 'community-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "community image read when visible" on storage.objects for select to anon, authenticated using (bucket_id = 'community-images' and (exists (select 1 from public.community_posts p where p.image_path = name and p.status = 'published') or (storage.foldername(name))[1] = (select auth.uid())::text));
create policy "community image delete by owner" on storage.objects for delete to authenticated using (bucket_id = 'community-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

commit;
