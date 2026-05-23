import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  canUseMollieWebhook,
  getMollieApiKeyFromEnv,
  paymentModeFromKey,
} from "./config";

describe("payment config", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it("uses mollie when API key is present (not simulate)", () => {
    process.env.PAYMENT_SIMULATE = "true";
    expect(paymentModeFromKey(true)).toBe("mollie");
  });

  it("simulates only without key and PAYMENT_SIMULATE=true", () => {
    process.env.PAYMENT_SIMULATE = "true";
    expect(paymentModeFromKey(false)).toBe("simulate");
  });

  it("disables localhost webhook", () => {
    expect(canUseMollieWebhook("http://localhost:3000")).toBe(false);
    expect(canUseMollieWebhook("https://shop.example.com")).toBe(true);
  });

  it("trims empty env key", () => {
    process.env.MOLLIE_API_KEY = "  ";
    expect(getMollieApiKeyFromEnv()).toBeUndefined();
  });
});
