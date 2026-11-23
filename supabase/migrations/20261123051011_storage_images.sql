insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('listing-images','listing-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;

revoke all on public.contacts,public.favorites,public.listings,public.profiles,public.reports,public.reviews,public.trades from anon,authenticated;
grant select on public.profiles,public.listings,public.reviews to anon,authenticated;
grant select,insert,update on public.profiles,public.contacts to authenticated;
grant insert,delete on public.listings to authenticated;
grant update(title,description,price,category,condition,city,images) on public.listings to authenticated;
grant select,insert,delete,update on public.favorites to authenticated;
grant select on public.trades to authenticated;
grant insert on public.reviews to authenticated;
grant select,insert on public.reports to authenticated;
