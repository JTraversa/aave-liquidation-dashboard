import { ethers } from 'ethers';
import { MAX_RPC_CHUNKS } from '../config/networks';
import { attachUsdValues } from './prices';

const POOL_ABI = [
  'event LiquidationCall(address indexed collateralAsset, address indexed debtAsset, address indexed user, uint256 debtToCover, uint256 liquidatedCollateralAmount, address liquidator, bool receiveAToken)',
];

// Aave v4's LiquidationCall. Note how little it has in common with v3's:
// assets arrive as spoke-scoped uint256 reserve ids rather than addresses, the
// amounts are split into token amounts and internal share amounts, and there is
// a struct in the middle. The struct's exact field types matter — they are part
// of the canonical signature the topic hash is derived from, so getting
// PremiumDelta wrong would produce a topic that matches nothing at all.
const V4_SPOKE_ABI = [
  'event LiquidationCall(uint256 indexed collateralReserveId, uint256 indexed debtReserveId, address indexed user, address liquidator, bool receiveShares, uint256 debtAmountRestored, uint256 drawnSharesLiquidated, (int256 sharesDelta, int256 offsetRayDelta, uint256 restoredPremiumRay) premiumDelta, uint256 collateralAmountRemoved, uint256 collateralSharesLiquidated, uint256 collateralSharesToLiquidator)',
];

const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
];

const tokenCache = {};

// Spoke reserve id -> underlying token, keyed `${spoke}:${id}`. The spoke must
// be part of the key: reserve ids are numbered per spoke, so id 8 is frxUSD on
// the Bluechip spoke but USDT on the Main spoke. Keying on the id alone would
// silently mislabel every row.
const v4ReserveCache = {};

function createProvider(rpcUrl) {
  return new ethers.JsonRpcProvider(rpcUrl, undefined, {
    batchMaxCount: 1,
  });
}

async function getTokenInfo(provider, address) {
  if (tokenCache[address]) return tokenCache[address];
  try {
    const contract = new ethers.Contract(address, ERC20_ABI, provider);
    const symbol = await contract.symbol();
    const decimals = await contract.decimals();
    tokenCache[address] = { symbol, decimals: Number(decimals) };
  } catch {
    tokenCache[address] = { symbol: address.slice(0, 6), decimals: 18 };
  }
  return tokenCache[address];
}

/**
 * Resolves a v4 spoke reserve id to its underlying token.
 *
 * getReserve(uint256) returns a 7-word struct whose first word is the
 * underlying address. Only that first word is decoded, from the raw return
 * data, rather than declaring the whole struct: the trailing fields are not
 * needed here, and guessing their types wrong would throw on decode for some
 * reserves while working for others.
 */
const GET_RESERVE_SELECTOR = ethers.id('getReserve(uint256)').slice(0, 10);

async function getV4ReserveToken(provider, spoke, reserveId) {
  const key = `${spoke.toLowerCase()}:${reserveId}`;
  if (v4ReserveCache[key]) return v4ReserveCache[key];
  try {
    const data =
      GET_RESERVE_SELECTOR + ethers.zeroPadValue(ethers.toBeHex(reserveId), 32).slice(2);
    const raw = await provider.call({ to: spoke, data });
    const underlying = ethers.getAddress('0x' + raw.slice(26, 66));
    // Carry the address through: prices.js needs it, and getTokenInfo returns
    // only the symbol and decimals.
    v4ReserveCache[key] = { ...(await getTokenInfo(provider, underlying)), address: underlying };
  } catch {
    v4ReserveCache[key] = { symbol: `reserve ${reserveId}`, decimals: 18 };
  }
  return v4ReserveCache[key];
}

// Estimate block number from timestamp using average block time.
// Only needs 1 RPC call (getBlock for latest) instead of ~20 for binary search.
function estimateBlockForTimestamp(latestBlock, latestTimestamp, targetTimestamp, avgBlockTime) {
  const secondsDiff = latestTimestamp - targetTimestamp;
  const blocksDiff = Math.floor(secondsDiff / avgBlockTime);
  const estimated = latestBlock - blocksDiff;
  // Clamp to the head as well as to 0. An end date of "today" sits slightly in
  // the future, so the estimate lands past the tip; strict providers reject
  // that outright with "block range extends beyond current head block", while
  // laxer ones silently clamp.
  return Math.min(latestBlock, Math.max(0, estimated));
}

export async function fetchLiquidationsFromRPC(
  networkConfig,
  startTimestamp,
  endTimestamp,
  userAddress,
  liquidatorAddress
) {
  const provider = createProvider(networkConfig.rpcUrl);
  const pool = new ethers.Contract(networkConfig.poolContract, POOL_ABI, provider);

  // 1 RPC call: get latest block (number + timestamp) for estimation
  const latestBlock = await provider.getBlock('latest');
  const latestNumber = latestBlock.number;
  const latestTimestamp = latestBlock.timestamp;
  const avg = networkConfig.avgBlockTime;

  const fromBlock = startTimestamp
    ? estimateBlockForTimestamp(latestNumber, latestTimestamp, startTimestamp, avg)
    : networkConfig.startBlock;

  const toBlock = endTimestamp
    ? estimateBlockForTimestamp(latestNumber, latestTimestamp, endTimestamp, avg)
    : latestNumber;

  // Query events in chunks — 1 RPC call per chunk
  // Use per-chain maxLogRange and cap total queries to avoid excessive calls
  let chunkSize = networkConfig.maxLogRange || 50000;
  const allEvents = [];
  let chunkCount = 0;

  for (let start = fromBlock; start <= toBlock && chunkCount < MAX_RPC_CHUNKS; ) {
    const end = Math.min(start + chunkSize - 1, toBlock);

    const filter = userAddress
      ? pool.filters.LiquidationCall(null, null, userAddress)
      : pool.filters.LiquidationCall();

    try {
      const events = await pool.queryFilter(filter, start, end);
      allEvents.push(...events);
      chunkCount++;
      start += chunkSize;
    } catch (err) {
      // If the RPC rejects the block range, halve the chunk size and retry
      if (chunkSize > 500 && /block range|range.*too|too many|limit|timed out|timeout/i.test(String(err))) {
        chunkSize = Math.floor(chunkSize / 2);
        continue;
      }
      throw err;
    }
  }

  const totalBlocksNeeded = toBlock - fromBlock;
  const blocksCovered = chunkCount * chunkSize;
  const isPartial = blocksCovered < totalBlocksNeeded;

  // Filter by liquidator client-side (not an indexed event param)
  const filteredEvents = liquidatorAddress
    ? allEvents.filter((e) => e.args[5].toLowerCase() === liquidatorAddress.toLowerCase())
    : allEvents;

  if (filteredEvents.length === 0) return { results: [], isPartial };

  // Resolve unique token info — 2 calls per unique token (cached across searches)
  const uniqueTokens = new Set();
  for (const event of filteredEvents) {
    uniqueTokens.add(event.args[0]);
    uniqueTokens.add(event.args[1]);
  }
  await Promise.all([...uniqueTokens].map((addr) => getTokenInfo(provider, addr)));

  // Resolve unique block timestamps — all in parallel
  const uniqueBlocks = [...new Set(filteredEvents.map((e) => e.blockNumber))];
  const blockResults = await Promise.all(uniqueBlocks.map((n) => provider.getBlock(n)));
  const blockTimestamps = {};
  uniqueBlocks.forEach((n, i) => {
    blockTimestamps[n] = blockResults[i] ? blockResults[i].timestamp : 0;
  });

  // Build results — no additional RPC calls
  const results = filteredEvents.map((event) => {
    const collateralAsset = event.args[0];
    const debtAsset = event.args[1];
    const user = event.args[2];
    const debtToCover = event.args[3];
    const liquidatedCollateralAmount = event.args[4];
    const liquidator = event.args[5];

    const collateralInfo = tokenCache[collateralAsset];
    const debtInfo = tokenCache[debtAsset];

    const collateralAmount =
      parseFloat(ethers.formatUnits(liquidatedCollateralAmount, collateralInfo.decimals));
    const debtAmount =
      parseFloat(ethers.formatUnits(debtToCover, debtInfo.decimals));

    return {
      id: `${event.transactionHash}-${event.index}`,
      txHash: event.transactionHash,
      timestamp: blockTimestamps[event.blockNumber],
      user: user.toLowerCase(),
      liquidator: liquidator.toLowerCase(),
      collateralSymbol: collateralInfo.symbol,
      collateralAmount,
      collateralValueUSD: 0,
      debtSymbol: debtInfo.symbol,
      debtAmount,
      debtValueUSD: 0,
      // Kept only so prices.js can look these up; not rendered.
      collateralAddress: collateralAsset,
      debtAddress: debtAsset,
      explorerUrl: networkConfig.explorerUrl,
      source: 'rpc',
    };
  });

  await attachUsdValues(results, networkConfig.priceChain);

  return {
    results: results.sort((a, b) => b.timestamp - a.timestamp),
    isPartial,
  };
}

/**
 * Aave v4 liquidations.
 *
 * Structurally different from the v3 path in two ways worth knowing:
 *
 *  1. No address filter. v4 emits LiquidationCall from whichever Spoke held the
 *     position, so the query matches on topic0 alone and every spoke is picked
 *     up automatically, including ones not yet documented.
 *  2. Token resolution is a second hop. The event carries reserve ids, not
 *     addresses, so each id is resolved through its emitting spoke before the
 *     amounts can be formatted.
 */
export async function fetchV4LiquidationsFromRPC(
  networkConfig,
  startTimestamp,
  endTimestamp,
  userAddress,
  liquidatorAddress
) {
  const provider = createProvider(networkConfig.rpcUrl);
  const iface = new ethers.Interface(V4_SPOKE_ABI);
  const topic0 = iface.getEvent('LiquidationCall').topicHash;

  const latestBlock = await provider.getBlock('latest');
  const latestNumber = latestBlock.number;
  const avg = networkConfig.avgBlockTime;

  // Never scan before the protocol existed, however far back the date says.
  const fromBlock = Math.max(
    networkConfig.startBlock,
    startTimestamp
      ? estimateBlockForTimestamp(latestNumber, latestBlock.timestamp, startTimestamp, avg)
      : networkConfig.startBlock
  );
  const toBlock = endTimestamp
    ? estimateBlockForTimestamp(latestNumber, latestBlock.timestamp, endTimestamp, avg)
    : latestNumber;

  // user is the third indexed parameter, so it filters server-side as topic3.
  const topics = userAddress
    ? [topic0, null, null, ethers.zeroPadValue(ethers.getAddress(userAddress), 32)]
    : [topic0];

  let chunkSize = networkConfig.maxLogRange || 50000;
  const rawLogs = [];
  let chunkCount = 0;

  for (let start = fromBlock; start <= toBlock && chunkCount < MAX_RPC_CHUNKS; ) {
    const end = Math.min(start + chunkSize - 1, toBlock);
    try {
      const logs = await provider.getLogs({ topics, fromBlock: start, toBlock: end });
      rawLogs.push(...logs);
      chunkCount++;
      start += chunkSize;
    } catch (err) {
      if (chunkSize > 500 && /block range|range.*too|too many|limit|timed out|timeout/i.test(String(err))) {
        chunkSize = Math.floor(chunkSize / 2);
        continue;
      }
      throw err;
    }
  }

  const isPartial = chunkCount * chunkSize < toBlock - fromBlock;

  const parsed = [];
  for (const log of rawLogs) {
    // A foreign contract emitting a same-shaped event would decode to nonsense,
    // so skip anything that will not parse rather than surfacing junk rows.
    try {
      parsed.push({ log, event: iface.parseLog(log) });
    } catch {
      continue;
    }
  }

  // liquidator is not indexed in v4 either, so it filters client-side.
  const filtered = liquidatorAddress
    ? parsed.filter((p) => p.event.args.liquidator.toLowerCase() === liquidatorAddress.toLowerCase())
    : parsed;

  if (filtered.length === 0) return { results: [], isPartial };

  // Resolve every (spoke, reserve id) pair once, then the block timestamps.
  const pairs = new Map();
  for (const { log, event } of filtered) {
    for (const id of [event.args.collateralReserveId, event.args.debtReserveId]) {
      pairs.set(`${log.address.toLowerCase()}:${id}`, { spoke: log.address, id });
    }
  }
  await Promise.all(
    [...pairs.values()].map(({ spoke, id }) => getV4ReserveToken(provider, spoke, id))
  );

  const uniqueBlocks = [...new Set(filtered.map((p) => p.log.blockNumber))];
  const blockResults = await Promise.all(uniqueBlocks.map((n) => provider.getBlock(n)));
  const blockTimestamps = {};
  uniqueBlocks.forEach((n, i) => {
    blockTimestamps[n] = blockResults[i] ? blockResults[i].timestamp : 0;
  });

  const results = filtered.map(({ log, event }) => {
    const spoke = log.address.toLowerCase();
    const collateral = v4ReserveCache[`${spoke}:${event.args.collateralReserveId}`];
    const debt = v4ReserveCache[`${spoke}:${event.args.debtReserveId}`];

    return {
      id: `${log.transactionHash}-${log.index}`,
      txHash: log.transactionHash,
      timestamp: blockTimestamps[log.blockNumber],
      user: event.args.user.toLowerCase(),
      liquidator: event.args.liquidator.toLowerCase(),
      // collateralAmountRemoved and debtAmountRestored are the token-denominated
      // figures; the share fields alongside them are internal accounting and
      // are not comparable to v3's amounts.
      collateralSymbol: collateral.symbol,
      collateralAmount: parseFloat(
        ethers.formatUnits(event.args.collateralAmountRemoved, collateral.decimals)
      ),
      collateralValueUSD: 0,
      debtSymbol: debt.symbol,
      debtAmount: parseFloat(
        ethers.formatUnits(event.args.debtAmountRestored, debt.decimals)
      ),
      debtValueUSD: 0,
      // Kept only so prices.js can look these up; not rendered.
      collateralAddress: collateral.address,
      debtAddress: debt.address,
      explorerUrl: networkConfig.explorerUrl,
      source: 'rpc',
    };
  });

  await attachUsdValues(results, networkConfig.priceChain);

  return {
    results: results.sort((a, b) => b.timestamp - a.timestamp),
    isPartial,
  };
}
