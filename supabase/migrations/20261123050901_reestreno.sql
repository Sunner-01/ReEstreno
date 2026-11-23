SET local check_function_bodies = off;

CREATE SCHEMA "private";

CREATE TABLE "public"."contacts" (
  "id"       uuid NOT NULL,
  "whatsapp" text NOT NULL,
  CONSTRAINT "contacts_pkey" PRIMARY KEY (id),
  CONSTRAINT "contacts_whatsapp_check" CHECK ((whatsapp ~ '^[0-9]{8,15}$'::text))
);

ALTER TABLE "public"."contacts"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."favorites" (
  "user_id"    uuid NOT NULL,
  "listing_id" uuid NOT NULL,
  CONSTRAINT "favorites_pkey" PRIMARY KEY (user_id, listing_id)
);

ALTER TABLE "public"."favorites"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."listings" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "seller_id"   uuid                     NOT NULL,
  "title"       text                     NOT NULL,
  "description" text                     NOT NULL,
  "price"       numeric(12,2)            NOT NULL,
  "category"    text                     NOT NULL,
  "condition"   text                     NOT NULL,
  "city"        text                     NOT NULL,
  "images"      text[]                   NOT NULL,
  "status"      text                     NOT NULL DEFAULT 'available'::text,
  "hidden"      boolean                  NOT NULL DEFAULT false,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "listings_category_check"
    CHECK ((category = ANY (ARRAY['Tecnología'::text, 'Hogar'::text, 'Moda'::text, 'Deportes'::text, 'Música'::text, 'Libros'::text, 'Otros'::text]))),
  CONSTRAINT "listings_city_check" CHECK (((char_length(city) >= 1) AND (char_length(city) <= 60))),
  CONSTRAINT "listings_condition_check" CHECK ((condition = ANY (ARRAY['Como nuevo'::text, 'Buen estado'::text, 'Con detalles'::text]))),
  CONSTRAINT "listings_description_check" CHECK (((char_length(description) >= 20) AND (char_length(description) <= 2000))),
  CONSTRAINT "listings_images_check" CHECK (((cardinality(images) >= 1) AND (cardinality(images) <= 5))),
  CONSTRAINT "listings_pkey" PRIMARY KEY (id),
  CONSTRAINT "listings_price_check" CHECK (((price >= (1)::numeric) AND (price <= (1000000)::numeric))),
  CONSTRAINT "listings_status_check" CHECK ((status = ANY (ARRAY['available'::text, 'reserved'::text, 'sold'::text]))),
  CONSTRAINT "listings_title_check" CHECK (((char_length(title) >= 5) AND (char_length(title) <= 90)))
);

ALTER TABLE "public"."listings"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "id"         uuid                     NOT NULL,
  "name"       text                     NOT NULL,
  "city"       text                     NOT NULL DEFAULT 'La Paz'::text,
  "bio"        text                     NOT NULL DEFAULT ''::text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_bio_check" CHECK ((char_length(bio) <= 300)),
  CONSTRAINT "profiles_name_check" CHECK (((char_length(name) >= 1) AND (char_length(name) <= 60))),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."reports" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "listing_id" uuid                     NOT NULL,
  "user_id"    uuid                     NOT NULL,
  "reason"     text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "reports_listing_id_user_id_key" UNIQUE (listing_id, user_id),
  CONSTRAINT "reports_pkey" PRIMARY KEY (id),
  CONSTRAINT "reports_reason_check" CHECK (((char_length(reason) >= 10) AND (char_length(reason) <= 500)))
);

ALTER TABLE "public"."reports"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."reviews" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "trade_id"   uuid                     NOT NULL,
  "buyer_id"   uuid                     NOT NULL,
  "seller_id"  uuid                     NOT NULL,
  "rating"     integer                  NOT NULL,
  "comment"    text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "reviews_comment_check" CHECK (((char_length(comment) >= 10) AND (char_length(comment) <= 500))),
  CONSTRAINT "reviews_pkey" PRIMARY KEY (id),
  CONSTRAINT "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))),
  CONSTRAINT "reviews_trade_id_key" UNIQUE (trade_id)
);

ALTER TABLE "public"."reviews"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."trades" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "listing_id" uuid                     NOT NULL,
  "buyer_id"   uuid                     NOT NULL,
  "seller_id"  uuid                     NOT NULL,
  "status"     text                     NOT NULL DEFAULT 'interested'::text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "trades_check" CHECK ((buyer_id <> seller_id)),
  CONSTRAINT "trades_listing_id_buyer_id_key" UNIQUE (listing_id, buyer_id),
  CONSTRAINT "trades_pkey" PRIMARY KEY (id),
  CONSTRAINT "trades_status_check" CHECK ((status = ANY (ARRAY['interested'::text, 'pending'::text, 'completed'::text, 'cancelled'::text])))
);

ALTER TABLE "public"."trades"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION private.accept_trade (
  p_trade uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
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
end; $function$;

CREATE OR REPLACE FUNCTION private.confirm_trade (
  p_trade uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare transaction public.trades;
begin
 if auth.uid() is null then raise exception 'Inicia sesión.'; end if;
 select * into transaction from public.trades where id=p_trade for update;
 if transaction.id is null or transaction.buyer_id<>auth.uid() or transaction.status<>'pending' then raise exception 'La compra todavía no fue confirmada por el vendedor.'; end if;
 update public.trades set status='completed' where id=p_trade;
 update public.listings set status='sold' where id=transaction.listing_id;
end; $function$;

CREATE OR REPLACE FUNCTION private.contact_seller (
  p_listing uuid
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
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
end; $function$;

CREATE OR REPLACE FUNCTION private.hide_listing (
  p_listing uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
 if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'role','')<>'moderator' then raise exception 'Acceso restringido.'; end if;
 update public.listings set hidden=true where id=p_listing;
end; $function$;

CREATE OR REPLACE FUNCTION public.accept_trade (
  p_trade uuid
)
  RETURNS void
  LANGUAGE sql
  SET search_path TO ''
  AS $function$ select private.accept_trade(p_trade); $function$;

REVOKE ALL ON FUNCTION "public"."accept_trade"(uuid) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.confirm_trade (
  p_trade uuid
)
  RETURNS void
  LANGUAGE sql
  SET search_path TO ''
  AS $function$ select private.confirm_trade(p_trade); $function$;

REVOKE ALL ON FUNCTION "public"."confirm_trade"(uuid) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.contact_seller (
  p_listing uuid
)
  RETURNS text
  LANGUAGE sql
  SET search_path TO ''
  AS $function$ select private.contact_seller(p_listing); $function$;

REVOKE ALL ON FUNCTION "public"."contact_seller"(uuid) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.hide_listing (
  p_listing uuid
)
  RETURNS void
  LANGUAGE sql
  SET search_path TO ''
  AS $function$ select private.hide_listing(p_listing); $function$;

REVOKE ALL ON FUNCTION "public"."hide_listing"(uuid) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.save_profile (
  p_name     text,
  p_city     text,
  p_bio      text,
  p_whatsapp text
)
  RETURNS void
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
 if auth.uid() is null then raise exception 'Inicia sesión.'; end if;
 insert into public.profiles(id,name,city,bio) values(auth.uid(),p_name,p_city,p_bio) on conflict(id) do update set name=excluded.name,city=excluded.city,bio=excluded.bio;
 insert into public.contacts(id,whatsapp) values(auth.uid(),p_whatsapp) on conflict(id) do update set whatsapp=excluded.whatsapp;
end; $function$;

REVOKE ALL ON FUNCTION "public"."save_profile"(text, text, text, text) FROM PUBLIC, "anon";

ALTER TABLE "public"."favorites"
  ADD CONSTRAINT "favorites_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."contacts"
  ADD CONSTRAINT "contacts_id_fkey" FOREIGN KEY (id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."favorites"
  ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."listings"
  ADD CONSTRAINT "listings_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."reports"
  ADD CONSTRAINT "reports_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

ALTER TABLE "public"."reports"
  ADD CONSTRAINT "reports_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."reviews"
  ADD CONSTRAINT "reviews_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."reviews"
  ADD CONSTRAINT "reviews_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."trades"
  ADD CONSTRAINT "trades_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."trades"
  ADD CONSTRAINT "trades_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id);

ALTER TABLE "public"."reviews"
  ADD CONSTRAINT "reviews_trade_id_fkey" FOREIGN KEY (trade_id) REFERENCES public.trades(id);

ALTER TABLE "public"."trades"
  ADD CONSTRAINT "trades_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES public.profiles(id);

CREATE INDEX listings_catalog ON public.listings USING btree (status, category, created_at DESC);

CREATE INDEX listings_seller ON public.listings USING btree (seller_id);

CREATE INDEX reviews_seller ON public.reviews USING btree (seller_id);

CREATE INDEX trades_buyer ON public.trades USING btree (buyer_id);

CREATE INDEX trades_seller ON public.trades USING btree (seller_id);

CREATE POLICY "contacts_edit" ON "public"."contacts"
  FOR UPDATE
  TO "authenticated"
  USING ((id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "contacts_insert" ON "public"."contacts"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "contacts_read" ON "public"."contacts"
  FOR SELECT
  TO "authenticated"
  USING ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "favorites_own" ON "public"."favorites"
  FOR ALL
  TO "authenticated"
  USING ((user_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "listings_delete" ON "public"."listings"
  FOR DELETE
  TO "authenticated"
  USING ((seller_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "listings_edit" ON "public"."listings"
  FOR UPDATE
  TO "authenticated"
  USING (((seller_id = ( SELECT auth.uid() AS uid)) OR (( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text)) = 'moderator'::text)))
  WITH CHECK (((seller_id = ( SELECT auth.uid() AS uid)) OR (( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text)) = 'moderator'::text)));

CREATE POLICY "listings_insert" ON "public"."listings"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((seller_id = ( SELECT auth.uid() AS uid)) AND (status = 'available'::text) AND (NOT hidden)));

CREATE POLICY "listings_read" ON "public"."listings"
  FOR SELECT
  TO PUBLIC
  USING (((NOT hidden) OR (seller_id = ( SELECT auth.uid() AS uid)) OR (( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text)) = 'moderator'::text)));

CREATE POLICY "profiles_edit" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "profiles_insert" ON "public"."profiles"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "profiles_read" ON "public"."profiles"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "reports_insert" ON "public"."reports"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "reports_read" ON "public"."reports"
  FOR SELECT
  TO "authenticated"
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR (( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text)) = 'moderator'::text)));

CREATE POLICY "reviews_confirmed" ON "public"."reviews"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((buyer_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM public.trades t
  WHERE ((t.id = reviews.trade_id) AND (t.buyer_id = ( SELECT auth.uid() AS uid)) AND (t.seller_id = reviews.seller_id) AND (t.status = 'completed'::text))))));

CREATE POLICY "reviews_read" ON "public"."reviews"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "trades_parties" ON "public"."trades"
  FOR SELECT
  TO "authenticated"
  USING (((buyer_id = ( SELECT auth.uid() AS uid)) OR (seller_id = ( SELECT auth.uid() AS uid))));

CREATE POLICY "image_delete" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'listing-images'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

CREATE POLICY "image_read" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'listing-images'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

CREATE POLICY "image_upload" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'listing-images'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

REVOKE ALL ON FUNCTION "private"."accept_trade"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "private"."accept_trade"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "private"."confirm_trade"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "private"."confirm_trade"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "private"."contact_seller"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "private"."contact_seller"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "private"."hide_listing"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "private"."hide_listing"(uuid) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."accept_trade"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."accept_trade"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."accept_trade"(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."accept_trade"(uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."confirm_trade"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."confirm_trade"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."confirm_trade"(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."confirm_trade"(uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."contact_seller"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."contact_seller"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."contact_seller"(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."contact_seller"(uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."hide_listing"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."hide_listing"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."hide_listing"(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."hide_listing"(uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."save_profile"(text, text, text, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."save_profile"(text, text, text, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."save_profile"(text, text, text, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."save_profile"(text, text, text, text) TO "service_role";

GRANT USAGE ON SCHEMA "private" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."contacts" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."contacts" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."contacts" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."contacts" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."favorites" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."favorites" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."favorites" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."favorites" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."listings" TO "anon";

REVOKE ALL ON TABLE "public"."listings" FROM "authenticated";

REVOKE ALL ("category") ON TABLE "public"."listings" FROM "authenticated";

GRANT UPDATE ("category") ON TABLE "public"."listings" TO "authenticated";

REVOKE ALL ("city") ON TABLE "public"."listings" FROM "authenticated";

GRANT UPDATE ("city") ON TABLE "public"."listings" TO "authenticated";

REVOKE ALL ("condition") ON TABLE "public"."listings" FROM "authenticated";

GRANT UPDATE ("condition") ON TABLE "public"."listings" TO "authenticated";

REVOKE ALL ("description") ON TABLE "public"."listings" FROM "authenticated";

GRANT UPDATE ("description") ON TABLE "public"."listings" TO "authenticated";

REVOKE ALL ("images") ON TABLE "public"."listings" FROM "authenticated";

GRANT UPDATE ("images") ON TABLE "public"."listings" TO "authenticated";

REVOKE ALL ("price") ON TABLE "public"."listings" FROM "authenticated";

GRANT UPDATE ("price") ON TABLE "public"."listings" TO "authenticated";

REVOKE ALL ("title") ON TABLE "public"."listings" FROM "authenticated";

GRANT UPDATE ("title") ON TABLE "public"."listings" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."listings" TO "authenticated";

REVOKE ALL ON TABLE "public"."listings" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."listings" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."listings" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reports" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."reports" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reports" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reports" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reviews" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."reviews" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reviews" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reviews" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."trades" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."trades" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."trades" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."trades" TO "service_role";

\n