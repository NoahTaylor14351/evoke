ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending','paid','failed','expired','cancelled','refunded','partially_refunded'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cart_fingerprint text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_amount integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS base_amount integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_amount integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_amount integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_intent_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS preorder boolean NOT NULL DEFAULT true;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfilment_status text NOT NULL DEFAULT 'preorder';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_reference text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS email_status text NOT NULL DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS email_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS email_last_attempt bigint;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS email_sent_at bigint;
CREATE INDEX IF NOT EXISTS orders_payment_intent_idx ON orders(payment_intent_id);
CREATE INDEX IF NOT EXISTS orders_status_created_idx ON orders(status,created_at DESC);
CREATE TABLE IF NOT EXISTS order_items (
 id text PRIMARY KEY, order_id text NOT NULL REFERENCES orders(id), variant_id text NOT NULL CHECK(variant_id IN ('black','white')),
 size text NOT NULL, printed_name text NOT NULL, quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 5),
 unit_amount integer NOT NULL CHECK(unit_amount>0), total_amount integer NOT NULL CHECK(total_amount>0),
 image_url text NOT NULL, product_name text NOT NULL, print_spec jsonb NOT NULL, line_position integer NOT NULL
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id,line_position);
CREATE TABLE IF NOT EXISTS order_audit (
 id text PRIMARY KEY, order_id text NOT NULL REFERENCES orders(id), action text NOT NULL, details jsonb,
 created_at bigint NOT NULL
);
UPDATE orders SET subtotal_amount=unit_amount*quantity,total_amount=unit_amount*quantity WHERE subtotal_amount=0;
UPDATE orders SET base_amount=subtotal_amount WHERE base_amount=0;
