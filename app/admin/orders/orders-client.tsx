"use client";

import { useEffect, useState } from "react";
import {
  Download,
  LockKeyhole,
  LogOut,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import { formatPrice, getProduct } from "@/src/config/commerce";

type OrderItem = {
  variantId: string;
  size: string;
  printedName: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
};
type Order = {
  id: string;
  status: string;
  paymentStatus: string;
  fulfilmentStatus: string;
  createdAt: number | string;
  customerEmail: string | null;
  customerName?: string | null;
  shippingDetails: Record<string, unknown> | null;
  amountTotal: number;
  amountSubtotal: number;
  shippingTotal: number;
  taxTotal: number;
  currency: string;
  trackingReference?: string | null;
  stripeSessionId?: string | null;
  paymentReference?: string | null;
  emailStatus?: string | null;
  items: OrderItem[];
};
const fulfilmentLabels: Record<string, string> = {
  preorder: "Paid — Pre-order",
  in_production: "In production",
  dispatched: "Dispatched",
  fulfilled: "Fulfilled",
};
const text = (value: unknown) => (typeof value === "string" ? value : "");
function money(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    (cents || 0) / 100,
  );
}
function date(value: number | string) {
  const d = new Date(
    typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value,
  );
  return Number.isNaN(d.getTime())
    ? "Date unavailable"
    : d.toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/London",
      }) + " (Europe/London)";
}

export default function AdminOrders() {
  const [session, setSession] = useState<{
    configured: boolean;
    authenticated: boolean;
  } | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState("paid");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  async function loadSession() {
    try {
      const response = await fetch("/api/admin/session", { cache: "no-store" });
      if (!response.ok) throw Error("Staff access is temporarily unavailable.");
      setSession(await response.json());
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to check staff access.",
      );
    }
  }
  useEffect(() => {
    void loadSession();
  }, []);
  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/orders?status=${encodeURIComponent(status)}&page=${page}`,
        { cache: "no-store" },
      );
      if (response.status === 401 || response.status === 403) {
        setSession((s) => (s ? { ...s, authenticated: false } : s));
        throw Error("Please sign in again.");
      }
      const data = await response.json();
      if (!response.ok)
        throw Error(data.error || "Orders could not be loaded.");
      setOrders(data.orders ?? []);
      setHasMore(Boolean(data.hasMore));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Orders could not be loaded.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (session?.authenticated) void loadOrders();
  }, [session?.authenticated, status, page]);
  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok)
        throw Error(data.error || "Sign-in was not successful.");
      setPassword("");
      await loadSession();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in was not successful.");
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/admin/session", { method: "DELETE" });
      setOrders([]);
      await loadSession();
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="container order-admin">
      <header className="admin-intro">
        <div>
          <span className="eyebrow">EVOKE / STAFF ACCESS</span>
          <h1>Pre-order desk.</h1>
          <p>Personalised jerseys. From payment to fulfilment.</p>
        </div>
        {session?.authenticated && (
          <button className="button secondary" onClick={logout} disabled={busy}>
            <LogOut size={15} />
            Sign out
          </button>
        )}
      </header>
      {error && (
        <p className="admin-alert" role="alert">
          {error}
        </p>
      )}
      {!session && !error && <p role="status">Checking staff access…</p>}
      {session && !session.authenticated && (
        <section className="admin-login">
          <LockKeyhole size={28} />
          <h2>
            {session.configured
              ? "Staff sign-in"
              : "Order management is not configured."}
          </h2>
          {session.configured ? (
            <form onSubmit={login}>
              <label htmlFor="admin-password">Staff password</label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button className="button" disabled={busy}>
                {busy ? "Signing in…" : "Sign in"}
                <ArrowUpRight size={16} />
              </button>
            </form>
          ) : (
            <p>
              Configure the staff credentials on the server to access order and
              fulfilment records.
            </p>
          )}
        </section>
      )}
      {session?.authenticated && (
        <>
          <div className="admin-toolbar">
            <label>
              Payment status
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="paid">Paid pre-orders</option>
                <option value="pending">Pending payment</option>
                <option value="refunded">Refunded</option>
                <option value="all">All orders</option>
              </select>
            </label>
            <div>
              <button
                className="button secondary"
                onClick={loadOrders}
                disabled={loading}
              >
                <RefreshCw size={15} />
                {loading ? "Loading…" : "Refresh"}
              </button>
              <a className="button secondary" href="/api/admin/orders/export">
                <Download size={15} />
                Export fulfilment CSV
              </a>
            </div>
          </div>
          <div className="admin-list-heading">
            <span>
              {orders.length} order{orders.length === 1 ? "" : "s"} on this page
            </span>
            <span>Page {page}</span>
          </div>
          {!loading && !orders.length ? (
            <div className="admin-empty">No orders match this view.</div>
          ) : (
            <div className="admin-order-list">
              {orders.map((order) => (
                <OrderRow key={order.id} order={order} reload={loadOrders} />
              ))}
            </div>
          )}
          <div className="admin-pagination">
            <button
              className="button secondary"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <button
              className="button secondary"
              disabled={!hasMore || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </main>
  );
}

function OrderRow({
  order,
  reload,
}: {
  order: Order;
  reload: () => Promise<void>;
}) {
  const [fulfilment, setFulfilment] = useState(
    order.fulfilmentStatus || "preorder",
  );
  const [tracking, setTracking] = useState(order.trackingReference || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    setFulfilment(order.fulfilmentStatus || "preorder");
    setTracking(order.trackingReference || "");
  }, [order.fulfilmentStatus, order.trackingReference]);
  const paid = ["paid", "partially_refunded"].includes(
    order.paymentStatus || order.status,
  );
  async function retryEmail() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/email-retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || "Confirmation could not be retried.");
      setMessage(result.emailStatus === "sent" ? "Confirmation email sent." : "Confirmation status updated. Check the delivery status below.");
      await reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Confirmation could not be retried.");
    } finally {
      setBusy(false);
    }
  }
  const shipping = order.shippingDetails ?? {};
  const address =
    shipping.address && typeof shipping.address === "object"
      ? (shipping.address as Record<string, unknown>)
      : {};
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          fulfilmentStatus: fulfilment,
          trackingReference: tracking,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw Error(result.error || "The update could not be saved.");
      setMessage("Fulfilment details saved.");
      await reload();
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "The update could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="admin-order">
      <summary>
        <span className="order-reference">
          #{order.id.slice(0, 8).toUpperCase()}
          <small>{date(order.createdAt)}</small>
        </span>
        <span className="order-customer">
          {order.customerName ||
            order.customerEmail ||
            "Customer details pending"}
        </span>
        <span className={`admin-status ${paid ? "is-paid" : ""}`}>
          {paid
            ? fulfilmentLabels[order.fulfilmentStatus] || "Paid — Pre-order"
            : order.paymentStatus || order.status || "Pending payment"}
        </span>
        <strong>
          {money(order.amountTotal ?? order.amountSubtotal, order.currency)}
        </strong>
      </summary>
      <div className="admin-order-body">
        <div className="admin-items-wrap">
          <table className="admin-items">
            <thead>
              <tr>
                <th>Jersey</th>
                <th>Printed name</th>
                <th>Size</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.items ?? []).map((item, index) => (
                <tr key={index}>
                  <td>{getProduct(item.variantId)?.color || item.variantId}</td>
                  <td>
                    <strong className="fulfilment-name">
                      {item.printedName}
                    </strong>
                  </td>
                  <td>{item.size}</td>
                  <td>{item.quantity}</td>
                  <td>
                    {formatPrice(
                      item.totalAmount ?? item.unitAmount * item.quantity,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-detail-grid">
          <div>
            <h3>Customer & shipping</h3>
            <p>
              {order.customerName || text(shipping.name)}
              <br />
              {order.customerEmail || "Email pending"}
            </p>
            <address>
              {[
                address.line1,
                address.line2,
                address.city,
                address.state,
                address.postal_code,
                address.country,
              ]
                .filter((value) => typeof value === "string" && value)
                .map((line, i) => (
                  <span key={i}>{text(line)}</span>
                ))}
            </address>
          </div>
          <div>
            <h3>Payment breakdown</h3>
            <dl>
              <div>
                <dt>Items</dt>
                <dd>{money(order.amountSubtotal, order.currency)}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd>{money(order.shippingTotal, order.currency)}</dd>
              </div>
              <div>
                <dt>Tax</dt>
                <dd>{money(order.taxTotal, order.currency)}</dd>
              </div>
              <div>
                <dt>Total paid</dt>
                <dd>{money(order.amountTotal, order.currency)}</dd>
              </div>
            </dl>
            <p className="admin-payment-reference">
              Payment: {order.paymentReference || "Pending"}
              <br />
              Stripe session: {order.stripeSessionId || "Pending"}
            </p>
          </div>
          <form className="admin-fulfilment" onSubmit={save}>
            <h3>Fulfilment</h3>
            <label>
              Status
              <select
                value={fulfilment}
                onChange={(e) => setFulfilment(e.target.value)}
                disabled={!paid || busy}
              >
                {Object.entries(fulfilmentLabels).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tracking reference
              <input
                value={tracking}
                maxLength={200}
                onChange={(e) => setTracking(e.target.value)}
                disabled={!paid || busy}
              />
            </label>
            <button className="button" disabled={!paid || busy}>
              {busy ? "Saving…" : "Save fulfilment"}
            </button>
            <p>Confirmation email: {order.emailStatus || "Pending"}</p>
            {paid && order.emailStatus !== "sent" && (
              <button type="button" className="button secondary" onClick={retryEmail} disabled={busy}>
                {busy ? "Working…" : "Retry confirmation email"}
              </button>
            )}
            {message && <p role="status">{message}</p>}
          </form>
        </div>
      </div>
    </details>
  );
}
