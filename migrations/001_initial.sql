BEGIN;
CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  owner_hash text NOT NULL,
  idempotency_key text NOT NULL,
  variant_id text NOT NULL CHECK (variant_id IN ('black','white')),
  size text NOT NULL,
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 5),
  unit_amount integer NOT NULL CHECK (unit_amount > 0),
  currency text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending','paid','failed','expired')),
  stripe_session_id text UNIQUE,
  customer_email text,
  shipping_details jsonb,
  created_at bigint NOT NULL,
  updated_at bigint NOT NULL,
  UNIQUE(owner_hash,idempotency_key)
);
CREATE INDEX IF NOT EXISTS orders_owner_idx ON orders(owner_hash);
CREATE TABLE IF NOT EXISTS stripe_events (id text PRIMARY KEY, type text NOT NULL, processed_at bigint NOT NULL);
CREATE TABLE IF NOT EXISTS checkout_rate_limits (key text PRIMARY KEY, count integer NOT NULL, expires_at bigint NOT NULL);
COMMIT;
