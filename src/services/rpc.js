import { ethers } from 'ethers';

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
  userAddress
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
  const chunkSize = networkConfig.maxLogRange || 50000;
  const MAX_CHUNKS = 20;
  const allEvents = [];
  let chunkCount = 0;

  for (let start = fromBlock; start <= toBlock && chunkCount < MAX_CHUNKS; start += chunkSize) {
    const end = Math.min(start + chunkSize - 1, toBlock);

    const filter = userAddress
      ? pool.filters.LiquidationCall(null, null, userAddress)
      : pool.filters.LiquidationCall();

    const events = await pool.queryFilter(filter, start, end);
    allEvents.push(...events);
    chunkCount++;
  }

  const totalBlocksNeeded = toBlock - fromBlock;
  const blocksCovered = chunkCount * chunkSize;
  const isPartial = blocksCovered < totalBlocksNeeded;

  if (allEvents.length === 0) return { results: [], isPartial };

  // Resolve unique token info — 2 calls per unique token (cached across searches)
  const uniqueTokens = new Set();
  for (const event of allEvents) {
    uniqueTokens.add(event.args[0]);
    uniqueTokens.add(event.args[1]);
  }
  for (const addr of uniqueTokens) {
    await getTokenInfo(provider, addr);
  }

  // Resolve unique block timestamps — 1 call per unique block
  const blockTimestamps = {};
  const uniqueBlocks = [...new Set(allEvents.map((e) => e.blockNumber))];
  for (const blockNum of uniqueBlocks) {
    const block = await provider.getBlock(blockNum);
    blockTimestamps[blockNum] = block ? block.timestamp : 0;
  }

  // Build results — no additional RPC calls
  const results = allEvents.map((event) => {
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
