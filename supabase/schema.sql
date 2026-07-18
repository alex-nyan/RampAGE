-- Rampage schema. Run in Supabase SQL editor.
create extension if not exists "pgcrypto";

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending', -- pending | active | finished
  game text not null default 'receipt-blitz',
  challenger_name text not null,
  challenged_name text,
  challenger_slack_id text,
  challenged_slack_id text,
  bonus_pool_cents int not null default 2500,
  stakes jsonb not null default '{}', -- { "<playerName>": stakeCents } (real USD values in cents)
  winner text,
  created_at timestamptz not null default now()
);

-- fallback polling target: latest game state snapshot per room
create table if not exists room_states (
  room_id uuid primary key references rooms(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

-- mock Ramp ledger: bonus-pool awards only (positive-sum; never debits a player)
create table if not exists awards (
  id serial primary key,
  room_id uuid references rooms(id),
  user_name text not null,
  amount_cents int not null check (amount_cents > 0),
  memo text,
  tx_id text,
  created_at timestamptz not null default now()
);

alter table rooms enable row level security;
alter table room_states enable row level security;
alter table awards enable row level security;
-- hackathon: open policies (no auth by design)
create policy "open rooms" on rooms for all using (true) with check (true);
create policy "open states" on room_states for all using (true) with check (true);
create policy "open awards" on awards for all using (true) with check (true);
