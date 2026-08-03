// Historical USD pricing via DefiLlama's public coins API.
//
// Used to fill the USD columns when results come from RPC rather than the
// subgraph: v4 has no published subgraph at all, and v3 falls back to RPC
// whenever there is no Graph API key. The subgraph remains the preferred
// source for v3 when a key is present, so this never overrides it.
//
// Pricing is strictly an enhancement. Every failure path here degrades to "no
// price" rather than throwing, because a dead price API must not take down a
// liquidation search that is otherwise fine.

const HISTORICAL_URL = 'https://coins.llama.fi/prices/historical';

// How many timestamps to look up at once. One request covers every token
// needed at a given timestamp, so this bounds concurrent requests, not tokens.
const CONCURRENCY = 6;

// Prices below this confidence are discarded. DefiLlama reports ~0.99 for
// liquid assets; a low score means it is extrapolating from thin liquidity.
const MIN_CONFIDENCE = 0.8;

// `${chain}:${address}:${timestamp}` -> price | null. Null is cached too, so a
// token with no price is not retried on every subsequent search.
const priceCache = new Map();

const keyFor = (chain, address, timestamp) =>
  `${chain}:${address.toLowerCase()}:${timestamp}`;

/** Runs `worker` over `items` with a fixed concurrency ceiling. */
async function pooled(items, limit, worker) {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      await worker(item);
    }
  });
  await Promise.all(runners);
}

/**
 * Looks up USD prices for a set of (token, timestamp) pairs.
 *
 * @param {string} chain DefiLlama chain slug, from a network's `priceChain`.
 * @param {Array<{address: string, timestamp: number}>} pairs
 * @returns {Promise<Map<string, number>>} keyed `${address.toLowerCase()}:${timestamp}`
 */
export async function fetchHistoricalPrices(chain, pairs) {
  const out = new Map();
  if (!chain || !pairs.length) return out;

  // Group by timestamp so each request asks for every token needed at that
  // instant, then drop anything already cached.
  const byTimestamp = new Map();
  for (const { address, timestamp } of pairs) {
    if (!address || !timestamp) continue;
    const cacheKey = keyFor(chain, address, timestamp);
    if (priceCache.has(cacheKey)) {
      const cached = priceCache.get(cacheKey);
      if (cached != null) out.set(`${address.toLowerCase()}:${timestamp}`, cached);
      continue;
    }
    if (!byTimestamp.has(timestamp)) byTimestamp.set(timestamp, new Set());
    byTimestamp.get(timestamp).add(address.toLowerCase());
  }

  await pooled([...byTimestamp.entries()], CONCURRENCY, async ([timestamp, addresses]) => {
    const list = [...addresses];
    const coins = list.map((a) => `${chain}:${a}`).join(',');
    let json = null;
    try {
      const res = await fetch(`${HISTORICAL_URL}/${timestamp}/${coins}`);
      if (res.ok) json = await res.json();
    } catch {
      // Network failure: leave these unpriced and carry on.
    }

    const returned = (json && json.coins) || {};
    const seen = new Set();
    for (const [coinKey, info] of Object.entries(returned)) {
      const address = coinKey.split(':')[1];
      if (!address || typeof info?.price !== 'number') continue;
      if (info.confidence != null && info.confidence < MIN_CONFIDENCE) continue;
      const lower = address.toLowerCase();
      seen.add(lower);
      priceCache.set(keyFor(chain, lower, timestamp), info.price);
      out.set(`${lower}:${timestamp}`, info.price);
    }
    // Remember the misses too, so they are not re-requested next search.
    for (const address of list) {
      if (!seen.has(address)) priceCache.set(keyFor(chain, address, timestamp), null);
    }
  });

  return out;
}

/**
 * Fills collateralValueUSD / debtValueUSD on RPC-derived rows in place.
 *
 * Rows carry `collateralAddress` and `debtAddress` purely so this can price
 * them; they are not displayed. Rows whose price is unavailable keep 0, which
 * the table already renders as a dash.
 */
export async function attachUsdValues(rows, chain) {
  if (!chain || !rows.length) return rows;

  const pairs = [];
  for (const row of rows) {
    if (row.collateralAddress) pairs.push({ address: row.collateralAddress, timestamp: row.timestamp });
    if (row.debtAddress) pairs.push({ address: row.debtAddress, timestamp: row.timestamp });
  }

  let prices;
  try {
    prices = await fetchHistoricalPrices(chain, pairs);
  } catch {
    return rows; // Never let pricing break a search.
  }

  for (const row of rows) {
    const collateral = prices.get(`${(row.collateralAddress || '').toLowerCase()}:${row.timestamp}`);
    const debt = prices.get(`${(row.debtAddress || '').toLowerCase()}:${row.timestamp}`);
    if (collateral != null) row.collateralValueUSD = row.collateralAmount * collateral;
    if (debt != null) row.debtValueUSD = row.debtAmount * debt;
  }
  return rows;
}
