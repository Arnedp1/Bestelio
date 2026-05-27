import { createSign } from "node:crypto";

function normalizePem(value: string): string {
  return value.replace(/\\n/g, "\n").trim();
}

export function getQzCertificatePem(): string | null {
  const value = process.env.QZ_TRAY_CERT_PEM?.trim();
  if (!value) return null;
  return normalizePem(value);
}

export function getQzPrivateKeyPem(): string | null {
  const value = process.env.QZ_TRAY_PRIVATE_KEY_PEM?.trim();
  if (!value) return null;
  return normalizePem(value);
}

export function signQzMessage(message: string): string | null {
  const privateKey = getQzPrivateKeyPem();
  if (!privateKey) return null;
  const signer = createSign("RSA-SHA512");
  signer.update(message, "utf8");
  signer.end();
  return signer.sign(privateKey, "base64");
}

