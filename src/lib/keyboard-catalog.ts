export type KeyboardProduct = {
  id: string; kind: 'keyboard'; name: string; brand: string; description: string;
  priceCents: number | null; currency: 'CNY'; imageUrl: string | null;
  priceSource?: string; priceCapturedAt?: string;
  purchaseUrl: string | null; sourceUrl: string | null; capturedAt: string;
  specs: { label: string; value: string }[];
};
export type KeyboardCatalog = { status: 'ready' | 'missing' | 'invalid'; products: KeyboardProduct[] };

function url(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try { const parsed = new URL(value); return parsed.protocol === 'https:' && !parsed.username && !parsed.password ? parsed.href : null; } catch { return null; }
}

/** Validate local data before exposing it to the storefront. */
export function parseKeyboardCatalog(content: string): KeyboardProduct[] {
  const parsed: unknown = JSON.parse(content);
  if (!parsed || typeof parsed !== 'object' || !('version' in parsed) || parsed.version !== 1 || !('products' in parsed) || !Array.isArray(parsed.products)) throw new Error('Invalid keyboard catalog');
  const ids = new Set<string>();
  return parsed.products.map((raw: unknown) => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid keyboard record');
    const item = raw as Record<string, unknown>;
    if (typeof item.id !== 'string' || !item.id || ids.has(item.id) || item.kind !== 'keyboard' || typeof item.name !== 'string' || !item.name || typeof item.brand !== 'string' || !item.brand || item.currency !== 'CNY' || typeof item.capturedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.capturedAt) || (item.priceCents !== null && (typeof item.priceCents !== 'number' || !Number.isSafeInteger(item.priceCents) || item.priceCents < 0)) || !Array.isArray(item.specs)) throw new Error('Invalid keyboard record');
    const specs = item.specs.map((entry: unknown) => {
      if (!entry || typeof entry !== 'object' || !('label' in entry) || !('value' in entry) || typeof entry.label !== 'string' || typeof entry.value !== 'string') throw new Error('Invalid keyboard specification');
      return { label: entry.label, value: entry.value };
    });
    ids.add(item.id);
    return { id: item.id, kind: 'keyboard' as const, name: item.name, brand: item.brand, description: typeof item.description === 'string' ? item.description : '', priceCents: item.priceCents as number | null, ...(typeof item.priceSource === 'string' && item.priceSource.trim() ? { priceSource: item.priceSource } : {}), ...(typeof item.priceCapturedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.priceCapturedAt) ? { priceCapturedAt: item.priceCapturedAt } : {}), currency: 'CNY' as const, imageUrl: url(item.imageUrl), purchaseUrl: url(item.purchaseUrl), sourceUrl: url(item.sourceUrl), capturedAt: item.capturedAt, specs };
  });
}
