-- ============================================================
--  BataMarket — Full Schema Migration
--  Run this in the Supabase SQL Editor
-- ============================================================

-- ── Extensions ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── profiles ───────────────────────────────────────────────
-- Created automatically after auth.users sign up via trigger
create table if not exists public.profiles (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  account_type      text not null default 'student' check (account_type in ('student', 'vendor')),
  full_name         text,
  business_name     text,
  department        text,
  level             int,
  phone_number      text,
  id_photo_url      text,
  selfie_url        text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'approved', 'rejected')),
  trust_score       int not null default 50,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- Allow reading other users' public profile data (for seller info on listings)
create policy "Public profiles are readable"
  on public.profiles for select
  using (true);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── listings ───────────────────────────────────────────────
create table if not exists public.listings (
  id            uuid primary key default uuid_generate_v4(),
  seller_id     uuid not null references auth.users(id) on delete cascade,
  type          text not null check (type in ('product', 'service', 'accommodation')),
  title         text not null,
  description   text not null,
  price         numeric(12, 2) not null check (price > 0),
  category      text not null,
  condition     text check (condition in ('new', 'like_new', 'good', 'fair', 'used')),
  images        text[] not null default '{}',
  status        text not null default 'active'
    check (status in ('active', 'sold', 'inactive', 'pending')),
  is_boosted    boolean not null default false,
  boost_expires_at timestamptz,
  -- Accommodation-specific
  room_type     text,
  location      text,
  available_from date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists listings_seller_id_idx on public.listings(seller_id);
create index if not exists listings_type_idx on public.listings(type);
create index if not exists listings_category_idx on public.listings(category);
create index if not exists listings_status_idx on public.listings(status);
create index if not exists listings_is_boosted_idx on public.listings(is_boosted);
create index if not exists listings_created_at_idx on public.listings(created_at desc);

alter table public.listings enable row level security;

create policy "Anyone can view active listings"
  on public.listings for select
  using (status = 'active');

create policy "Sellers can view all their own listings"
  on public.listings for select
  using (auth.uid() = seller_id);

create policy "Authenticated users can create listings"
  on public.listings for insert
  with check (auth.uid() = seller_id);

create policy "Sellers can update their own listings"
  on public.listings for update
  using (auth.uid() = seller_id);

create policy "Sellers can delete their own listings"
  on public.listings for delete
  using (auth.uid() = seller_id);

-- ── messages ───────────────────────────────────────────────
create table if not exists public.messages (
  id           uuid primary key default uuid_generate_v4(),
  listing_id   uuid not null references public.listings(id) on delete cascade,
  sender_id    uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body         text not null,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists messages_listing_id_idx on public.messages(listing_id);
create index if not exists messages_sender_id_idx on public.messages(sender_id);
create index if not exists messages_recipient_id_idx on public.messages(recipient_id);
create index if not exists messages_created_at_idx on public.messages(created_at);

alter table public.messages enable row level security;

create policy "Users can read their own messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Authenticated users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

-- Enable Realtime for messages
alter publication supabase_realtime add table public.messages;

-- ── trust_events ───────────────────────────────────────────
create table if not exists public.trust_events (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  event_type  text not null,
  weight      int not null,
  created_at  timestamptz not null default now()
);

create index if not exists trust_events_user_id_idx on public.trust_events(user_id);

alter table public.trust_events enable row level security;

create policy "Trust events are private to the user"
  on public.trust_events for select
  using (auth.uid() = user_id);

-- Recalculate trust score on new trust_event
create or replace function public.recalculate_trust_score()
returns trigger language plpgsql security definer
set search_path = public as $$
declare
  new_score int;
begin
  select least(100, greatest(0, 50 + sum(weight)))
  into new_score
  from public.trust_events
  where user_id = new.user_id;

  update public.profiles
  set trust_score = coalesce(new_score, 50),
      updated_at  = now()
  where user_id = new.user_id;

  return new;
end;
$$;

drop trigger if exists on_trust_event on public.trust_events;
create trigger on_trust_event
  after insert on public.trust_events
  for each row execute procedure public.recalculate_trust_score();

-- ── reports ────────────────────────────────────────────────
create table if not exists public.reports (
  id               uuid primary key default uuid_generate_v4(),
  reporter_id      uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid references auth.users(id) on delete cascade,
  listing_id       uuid references public.listings(id) on delete cascade,
  reason           text not null,
  status           text not null default 'open'
    check (status in ('open', 'reviewed', 'dismissed')),
  created_at       timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "Reporters can read their own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

create policy "Authenticated users can submit reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

-- ── transactions ───────────────────────────────────────────
create table if not exists public.transactions (
  id          uuid primary key default uuid_generate_v4(),
  listing_id  uuid references public.listings(id),
  buyer_id    uuid references auth.users(id),
  seller_id   uuid references auth.users(id),
  amount      numeric(12, 2) not null,
  payment_ref text,
  type        text not null default 'listing_payment'
    check (type in ('listing_payment', 'featured_listing')),
  status      text not null default 'pending'
    check (status in ('pending', 'completed', 'failed', 'refunded')),
  created_at  timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- ── Storage buckets ────────────────────────────────────────
-- Run these manually in the Storage section of the Supabase dashboard,
-- or via the management API. Public read, authenticated write.
--
-- Bucket: listing-images
--   Public: true
--   Allowed MIME types: image/jpeg, image/png, image/webp
--   Max file size: 5MB
--
-- Bucket: verification-docs
--   Public: false
--   Allowed MIME types: image/jpeg, image/png, image/webp
--   Max file size: 10MB

-- ============================================================
--  End of migration
-- ============================================================
