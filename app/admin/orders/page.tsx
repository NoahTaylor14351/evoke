import type { Metadata } from "next";
import AdminOrders from "./orders-client";
import "./orders.css";
export const metadata: Metadata = {
  title: "Pre-order management",
  robots: { index: false, follow: false },
};
export default function AdminOrdersPage() {
  return <AdminOrders />;
}
