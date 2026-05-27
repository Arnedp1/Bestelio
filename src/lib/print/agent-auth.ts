const HEADER = "x-print-agent-key";

export function getPrintAgentSecret(): string | null {
  const secret = process.env.PRINT_AGENT_SECRET?.trim();
  return secret && secret.length >= 16 ? secret : null;
}

export function assertPrintAgentRequest(request: Request): boolean {
  const expected = getPrintAgentSecret();
  if (!expected) return false;
  const provided = request.headers.get(HEADER);
  return provided === expected;
}

export { HEADER as PRINT_AGENT_HEADER };
