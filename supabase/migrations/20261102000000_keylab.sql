-- KEYLAB catalog and user-owned builds. Apply with the Supabase migration workflow.
create table public.brands (id text primary key, name text not null, is_demo boolean not null default false);
create table public.categories (id text primary key, name text not null, sort_order integer not null default 0);
create table public.merchants (id text primary key, name text not null, source_type text not null check(source_type in ('platform','external')), is_demo boolean not null default false);
create table public.products (
 id text primary key, name text not null, category_id text not null references public.categories(id),
 brand_id text references public.brands(id), description text not null default '', image_url text,
 price_cents integer check(price_cents>=0), currency text not null default 'CNY' check(currency='CNY'),
 sales_channel text not null check(sales_channel in ('platform','external')), merchant_id text references public.merchants(id), product_url text,
 material text, color text, status text not null default 'draft' check(status in ('draft','active','unavailable')),
 is_demo boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,category_id)
);
create table public.product_specs (product_id text primary key references public.products(id) on delete cascade, specs jsonb not null default '{}'::jsonb check(jsonb_typeof(specs)='object'));
create table public.product_models (id text primary key, product_id text not null references public.products(id) on delete cascade, model_url text not null, format text not null default 'glb', is_primary boolean not null default true);
create table public.product_offers (id text primary key, product_id text not null references public.products(id) on delete cascade, merchant_id text not null references public.merchants(id), source_type text not null check(source_type in ('platform','external')), price_cents integer check(price_cents>=0), currency text not null default 'CNY' check(currency='CNY'), product_url text, is_demo boolean not null default false, last_verified_at timestamptz, unique(id,product_id));
create table public.compatibility_rules (id text primary key, source_category_id text not null references public.categories(id), target_category_id text not null references public.categories(id), fields text[] not null, mismatch_status text not null default 'incompatible' check(mismatch_status in ('incompatible','warning')), reason text not null, enabled boolean not null default true);
create table public.user_builds (id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade, name text not null, template_id text not null, designs jsonb not null default '{}'::jsonb check(jsonb_typeof(designs)='object'), profile text not null default 'OEM', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.build_items (build_id uuid not null references public.user_builds(id) on delete cascade, slot text not null references public.categories(id), product_id text not null references public.products(id), offer_id text references public.product_offers(id), quantity integer not null default 1 check(quantity>0), primary key(build_id,slot), foreign key(product_id,slot) references public.products(id,category_id), foreign key(offer_id,product_id) references public.product_offers(id,product_id));
create index products_category_status_idx on public.products(category_id,status);
create index product_offers_product_idx on public.product_offers(product_id);
create index product_models_product_idx on public.product_models(product_id);
create index user_builds_owner_idx on public.user_builds(user_id,updated_at desc);

alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.merchants enable row level security;
alter table public.products enable row level security;
alter table public.product_specs enable row level security;
alter table public.product_models enable row level security;
alter table public.product_offers enable row level security;
alter table public.compatibility_rules enable row level security;
alter table public.user_builds enable row level security;
alter table public.build_items enable row level security;
create policy "Read brands" on public.brands for select to anon,authenticated using(true);
create policy "Read categories" on public.categories for select to anon,authenticated using(true);
create policy "Read merchants" on public.merchants for select to anon,authenticated using(true);
create policy "Read active products" on public.products for select to anon,authenticated using(status='active');
create policy "Read active specs" on public.product_specs for select to anon,authenticated using(exists(select 1 from public.products p where p.id=product_id and p.status='active'));
create policy "Read active models" on public.product_models for select to anon,authenticated using(exists(select 1 from public.products p where p.id=product_id and p.status='active'));
create policy "Read active offers" on public.product_offers for select to anon,authenticated using(exists(select 1 from public.products p where p.id=product_id and p.status='active'));
create policy "Read rules" on public.compatibility_rules for select to anon,authenticated using(enabled);
create policy "Own builds" on public.user_builds for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy "Own build items" on public.build_items for all to authenticated using(exists(select 1 from public.user_builds b where b.id=build_id and b.user_id=(select auth.uid()))) with check(exists(select 1 from public.user_builds b where b.id=build_id and b.user_id=(select auth.uid())));
grant select on public.brands,public.categories,public.merchants,public.products,public.product_specs,public.product_models,public.product_offers,public.compatibility_rules to anon,authenticated;
grant select,insert,update,delete on public.user_builds,public.build_items to authenticated;

create function public.save_build_with_items(p_id uuid,p_name text,p_template_id text,p_designs jsonb,p_profile text,p_items jsonb) returns void language plpgsql security invoker set search_path=public as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if jsonb_typeof(p_items) <> 'array' or jsonb_typeof(p_designs) <> 'object' then raise exception 'Invalid build data'; end if;
 insert into public.user_builds(id,user_id,name,template_id,designs,profile) values(p_id,auth.uid(),p_name,p_template_id,p_designs,p_profile)
 on conflict(id) do update set name=excluded.name,template_id=excluded.template_id,designs=excluded.designs,profile=excluded.profile,updated_at=now() where user_builds.user_id=auth.uid();
 if not found then raise exception 'Build not accessible'; end if;
 delete from public.build_items where build_id=p_id;
 insert into public.build_items(build_id,slot,product_id,offer_id,quantity)
 select p_id, item->>'slot',item->>'product_id',nullif(item->>'offer_id',''),1 from jsonb_array_elements(p_items) item;
end; $$;
revoke all on function public.save_build_with_items(uuid,text,text,jsonb,text,jsonb) from public;
grant execute on function public.save_build_with_items(uuid,text,text,jsonb,text,jsonb) to authenticated;
