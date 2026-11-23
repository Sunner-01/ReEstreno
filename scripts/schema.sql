create schema if not exists private;
grant usage on schema private to authenticated;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null check (char_length(name) between 1 and 60),
 city text not null default 'La Paz', bio text not null default '' check (char_length(bio) <= 300),
 created_at timestamptz not null default now()
);
create table public.contacts (
 id uuid primary key references public.profiles(id) on delete cascade,
 whatsapp text not null check (whatsapp ~ '^[0-9]{8,15}$')
);
create table public.listings (
 id uuid primary key default gen_random_uuid(),
 seller_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check (char_length(title) between 5 and 90),
 description text not null check (char_length(description) between 20 and 2000),
 price numeric(12,2) not null check (price between 1 and 1000000),
 category text not null check (category in ('Tecnología','Hogar','Moda','Deportes','Música','Libros','Otros')),
 condition text not null check (condition in ('Como nuevo','Buen estado','Con detalles')),
 city text not null check (char_length(city) between 1 and 60),
 images text[] not null check (cardinality(images) between 1 and 5),
 status text not null default 'available' check (status in ('available','reserved','sold')),
 hidden boolean not null default false, created_at timestamptz not null default now()
);
create index listings_catalog on public.listings(status,category,created_at desc);
create index listings_seller on public.listings(seller_id);
create table public.favorites (
 user_id uuid not null references public.profiles(id) on delete cascade,
 listing_id uuid not null references public.listings(id) on delete cascade,
 primary key(user_id,listing_id)
);
create table public.trades (
 id uuid primary key default gen_random_uuid(),
 listing_id uuid not null references public.listings(id),
 buyer_id uuid not null references public.profiles(id),
 seller_id uuid not null references public.profiles(id),
 status text not null default 'interested' check(status in ('interested','pending','completed','cancelled')),
 created_at timestamptz not null default now(),
 unique(listing_id,buyer_id), check(buyer_id <> seller_id)
);
create index trades_buyer on public.trades(buyer_id);
create index trades_seller on public.trades(seller_id);
create table public.reviews (
 id uuid primary key default gen_random_uuid(), trade_id uuid not null unique references public.trades(id),
 buyer_id uuid not null references public.profiles(id), seller_id uuid not null references public.profiles(id),
 rating int not null check(rating between 1 and 5),
 comment text not null check(char_length(comment) between 10 and 500), created_at timestamptz not null default now()
);
create index reviews_seller on public.reviews(seller_id);
create table public.reports (
 id uuid primary key default gen_random_uuid(), listing_id uuid not null references public.listings(id) on delete cascade,
 user_id uuid not null references public.profiles(id), reason text not null check(char_length(reason) between 10 and 500),
 created_at timestamptz not null default now(), unique(listing_id,user_id)
);

alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.listings enable row level security;
alter table public.favorites enable row level security;
alter table public.trades enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
grant select on public.profiles,public.listings,public.reviews to anon,authenticated;
grant select,insert,update on public.profiles,public.contacts to authenticated;
grant insert,update,delete on public.listings to authenticated;
revoke update on public.listings from authenticated;
grant update(title,description,price,category,condition,city,images) on public.listings to authenticated;
grant select,insert,delete,update on public.favorites to authenticated;
grant select on public.trades to authenticated;
grant insert on public.reviews to authenticated;
grant select,insert on public.reports to authenticated;

create policy profiles_read on public.profiles for select using(true);
create policy profiles_insert on public.profiles for insert to authenticated with check(id=(select auth.uid()));
create policy profiles_edit on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy contacts_read on public.contacts for select to authenticated using(id=(select auth.uid()));
create policy contacts_insert on public.contacts for insert to authenticated with check(id=(select auth.uid()));
create policy contacts_edit on public.contacts for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy listings_read on public.listings for select using(not hidden or seller_id=(select auth.uid()) or (select auth.jwt()->'app_metadata'->>'role')='moderator');
create policy listings_insert on public.listings for insert to authenticated with check(seller_id=(select auth.uid()) and status='available' and not hidden);
create policy listings_edit on public.listings for update to authenticated using(seller_id=(select auth.uid()) or (select auth.jwt()->'app_metadata'->>'role')='moderator') with check(seller_id=(select auth.uid()) or (select auth.jwt()->'app_metadata'->>'role')='moderator');
create policy listings_delete on public.listings for delete to authenticated using(seller_id=(select auth.uid()));
create policy favorites_own on public.favorites for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy trades_parties on public.trades for select to authenticated using(buyer_id=(select auth.uid()) or seller_id=(select auth.uid()));
create policy reviews_read on public.reviews for select using(true);
create policy reviews_confirmed on public.reviews for insert to authenticated with check(
 buyer_id=(select auth.uid()) and exists(select 1 from public.trades t where t.id=trade_id and t.buyer_id=(select auth.uid()) and t.seller_id=reviews.seller_id and t.status='completed')
);
create policy reports_insert on public.reports for insert to authenticated with check(user_id=(select auth.uid()));
create policy reports_read on public.reports for select to authenticated using(user_id=(select auth.uid()) or (select auth.jwt()->'app_metadata'->>'role')='moderator');

create function public.save_profile(p_name text,p_city text,p_bio text,p_whatsapp text) returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Inicia sesión.'; end if;
 insert into public.profiles(id,name,city,bio) values(auth.uid(),p_name,p_city,p_bio) on conflict(id) do update set name=excluded.name,city=excluded.city,bio=excluded.bio;
 insert into public.contacts(id,whatsapp) values(auth.uid(),p_whatsapp) on conflict(id) do update set whatsapp=excluded.whatsapp;
end; $$;

create function private.contact_seller(p_listing uuid) returns text language plpgsql security definer set search_path='' as $$
declare item public.listings; phone text;
begin
 if auth.uid() is null then raise exception 'Inicia sesión.'; end if;
 select * into item from public.listings where id=p_listing and not hidden and status='available';
 if item.id is null then raise exception 'El objeto no está disponible.'; end if;
 if item.seller_id=auth.uid() then raise exception 'Esta es tu publicación.'; end if;
 if not exists(select 1 from public.profiles where id=auth.uid()) then raise exception 'Completa primero tu perfil.'; end if;
 select whatsapp into phone from public.contacts where id=item.seller_id;
 if phone is null then raise exception 'El vendedor debe completar su WhatsApp.'; end if;
 insert into public.trades(listing_id,buyer_id,seller_id) values(item.id,auth.uid(),item.seller_id) on conflict(listing_id,buyer_id) do nothing;
 return phone;
end; $$;
create function public.contact_seller(p_listing uuid) returns text language sql security invoker set search_path='' as $$ select private.contact_seller(p_listing); $$;

create function private.accept_trade(p_trade uuid) returns void language plpgsql security definer set search_path='' as $$
declare transaction public.trades; item public.listings;
begin
 if auth.uid() is null then raise exception 'Inicia sesión.'; end if;
 select * into transaction from public.trades where id=p_trade;
 if transaction.id is null or transaction.seller_id<>auth.uid() then raise exception 'Solo el vendedor puede confirmar la entrega.'; end if;
 select * into item from public.listings where id=transaction.listing_id for update;
 if item.status<>'available' or transaction.status<>'interested' then raise exception 'El objeto ya está reservado o vendido.'; end if;
 update public.trades set status='pending' where id=p_trade;
 update public.trades set status='cancelled' where listing_id=item.id and id<>p_trade;
 update public.listings set status='reserved' where id=item.id;
end; $$;
create function public.accept_trade(p_trade uuid) returns void language sql security invoker set search_path='' as $$ select private.accept_trade(p_trade); $$;

create function private.confirm_trade(p_trade uuid) returns void language plpgsql security definer set search_path='' as $$
declare transaction public.trades;
begin
 if auth.uid() is null then raise exception 'Inicia sesión.'; end if;
 select * into transaction from public.trades where id=p_trade for update;
 if transaction.id is null or transaction.buyer_id<>auth.uid() or transaction.status<>'pending' then raise exception 'La compra todavía no fue confirmada por el vendedor.'; end if;
 update public.trades set status='completed' where id=p_trade;
 update public.listings set status='sold' where id=transaction.listing_id;
end; $$;
create function public.confirm_trade(p_trade uuid) returns void language sql security invoker set search_path='' as $$ select private.confirm_trade(p_trade); $$;

create function private.hide_listing(p_listing uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'role','')<>'moderator' then raise exception 'Acceso restringido.'; end if;
 update public.listings set hidden=true where id=p_listing;
end; $$;
create function public.hide_listing(p_listing uuid) returns void language sql security invoker set search_path='' as $$ select private.hide_listing(p_listing); $$;
revoke all on function public.hide_listing(uuid) from public,anon;
grant execute on function public.hide_listing(uuid) to authenticated;

revoke all on all functions in schema private from public,anon;
grant execute on all functions in schema private to authenticated;
revoke all on function public.save_profile(text,text,text,text),public.contact_seller(uuid),public.accept_trade(uuid),public.confirm_trade(uuid) from public,anon;
grant execute on function public.save_profile(text,text,text,text),public.contact_seller(uuid),public.accept_trade(uuid),public.confirm_trade(uuid) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('listing-images','listing-images',true,5242880,array['image/jpeg','image/png','image/webp']);
create policy image_upload on storage.objects for insert to authenticated with check(bucket_id='listing-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy image_read on storage.objects for select to authenticated using(bucket_id='listing-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy image_delete on storage.objects for delete to authenticated using(bucket_id='listing-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
