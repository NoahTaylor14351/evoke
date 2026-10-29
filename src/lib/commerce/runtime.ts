import "server-only";
import { detectPaymentConfiguration } from "./configuration";
export async function getCommerceConfig() {
  return detectPaymentConfiguration();
}
