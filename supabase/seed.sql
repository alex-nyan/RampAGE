-- Demo data: no empty states on stage, ever.
insert into rooms (id, status, challenger_name, challenged_name, bonus_pool_cents, winner) values
  ('00000000-0000-0000-0000-000000000001', 'finished', 'alex', 'sam', 2500, 'alex'),
  ('00000000-0000-0000-0000-000000000002', 'finished', 'nyan', 'madhav', 2500, 'nyan'),
  ('00000000-0000-0000-0000-000000000003', 'active', 'ishani', 'alex', 2500, null)
on conflict (id) do nothing;

insert into awards (room_id, user_name, amount_cents, memo, tx_id) values
  ('00000000-0000-0000-0000-000000000001', 'alex', 2500, 'Receipt Match Blitz W vs sam', 'mock_tx_seed_1'),
  ('00000000-0000-0000-0000-000000000002', 'nyan', 2500, 'Receipt Match Blitz W vs madhav', 'mock_tx_seed_2');
