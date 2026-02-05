import { ethers } from 'ethers';
import { MAX_RPC_CHUNKS } from '../config/networks';

const POOL_ABI = [
  'event LiquidationCall(address indexed collateralAsset, address indexed debtAsset, address indexed user, uint256 debtToCover, uint256 liquidatedCollateralAmount, address liquidator, bool receiveAToken)',
];

const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
];

const tokenCache = {};

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

// Estimate block number from timestamp using average block time.
// Only needs 1 RPC call (getBlock for latest) instead of ~20 for binary search.
function estimateBlockForTimestamp(latestBlock, latestTimestamp, targetTimestamp, avgBlockTime) {
  const secondsDiff = latestTimestamp - targetTimestamp;
  const blocksDiff = Math.floor(secondsDiff / avgBlockTime);
  const estimated = latestBlock - blocksDiff;
  return Math.max(0, estimated);
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
      if (chunkSize > 500 && /block range|range.*too|too many|limit/i.test(String(err))) {
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
      explorerUrl: networkConfig.explorerUrl,
      source: 'rpc',
    };
  });

  return {
    results: results.sort((a, b) => b.timestamp - a.timestamp),
    isPartial,
  };
}
