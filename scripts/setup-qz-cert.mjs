import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import selfsigned from "selfsigned";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const certDir = path.join(root, "certs");
const certPath = path.join(certDir, "qz-cert.pem");
const keyPath = path.join(certDir, "qz-private-key.pem");
const envPath = path.join(root, ".env");

function ensureCertFiles() {
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    return {
      cert: fs.readFileSync(certPath, "utf8"),
      key: fs.readFileSync(keyPath, "utf8"),
      generated: false,
    };
  }

  const attrs = [{ name: "commonName", value: "Honger QZ Tray" }];
  const pems = selfsigned.generate(attrs, {
    days: 825,
    keySize: 2048,
    algorithm: "sha256",
  });

  fs.mkdirSync(certDir, { recursive: true });
  fs.writeFileSync(certPath, pems.cert, "utf8");
  fs.writeFileSync(keyPath, pems.private, "utf8");
  return { cert: pems.cert, key: pems.private, generated: true };
}

function toEnvSingleLine(pem) {
  return pem.trim().replace(/\r?\n/g, "\\n");
}

function upsertEnvVar(content, key, value) {
  const line = `${key}="${value}"`;
  const regex = new RegExp(`^${key}=.*$`, "m");
  if (regex.test(content)) {
    return content.replace(regex, line);
  }
  const suffix = content.endsWith("\n") ? "" : "\n";
  return `${content}${suffix}${line}\n`;
}

function main() {
  const { cert, key, generated } = ensureCertFiles();
  const certEnv = toEnvSingleLine(cert);
  const keyEnv = toEnvSingleLine(key);

  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  envContent = upsertEnvVar(envContent, "QZ_TRAY_CERT_PEM", certEnv);
  envContent = upsertEnvVar(envContent, "QZ_TRAY_PRIVATE_KEY_PEM", keyEnv);
  fs.writeFileSync(envPath, envContent, "utf8");

  console.log(generated ? "QZ cert/key generated." : "Existing QZ cert/key reused.");
  console.log("Updated .env with QZ_TRAY_CERT_PEM and QZ_TRAY_PRIVATE_KEY_PEM.");
  console.log(`Cert files: ${certPath} and ${keyPath}`);
}

main();

