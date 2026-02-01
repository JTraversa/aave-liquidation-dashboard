import { ethers } from 'ethers';

const POOL_ABI = [
  'event LiquidationCall(address indexed collateralAsset, address indexed debtAsset, address indexed user, uint256 debtToCover, uint256 liquidatedCollateralAmount, address liquidator, bool receiveAToken)',
];

const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
];

// Cache token metadata to reduce RPC calls
const tokenCache = {};

async function getTokenInfo(provider, address) {
  if (tokenCache[address]) return tokenCache[address];
  try {
    const contract = new ethers.Contract(address, ERC20_ABI, provider);
    const [symbol, decimals] = await Promise.all([
      contract.symbol(),
      contract.decimals(),
    ]);
    tokenCache[address] = { symbol, decimals: Number(decimals) };
  } catch {
    tokenCache[address] = { symbol: address.slice(0, 6), decimals: 18 };
  }
  return tokenCache[address];
}

async function getBlockForTimestamp(provider, targetTimestamp) {
  let lo = 0;
  let hi = await provider.getBlockNumber();

  // Binary search for the closest block
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const block = await provider.getBlock(mid);
    if (!block) {
      hi = mid - 1;
      continue;
    }
    if (block.timestamp < targetTimestamp) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

export async function fetchLiquidationsFromRPC(
  networkConfig,
  startTimestamp,
  endTimestamp,
  userAddress
) {
  const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
  const pool = new ethers.Contract(networkConfig.poolContract, POOL_ABI, provider);

  // Convert timestamps to block numbers
  const [fromBlock, toBlock] = await Promise.all([
    startTimestamp
      ? getBlockForTimestamp(provider, startTimestamp)
      : Promise.resolve(networkConfig.startBlock),
    endTimestamp
      ? getBlockForTimestamp(provider, endTimestamp)
      : provider.getBlockNumber(),
  ]);

  // Query in chunks to avoid RPC limits (max 10k blocks per query)
  const MAX_BLOCK_RANGE = 10000;
  const allEvents = [];

  for (let start = fromBlock; start <= toBlock; start += MAX_BLOCK_RANGE) {
    const end = Math.min(start + MAX_BLOCK_RANGE - 1, toBlock);

    let filter;
    if (userAddress) {
      filter = pool.filters.LiquidationCall(null, null, userAddress);
    } else {
      filter = pool.filters.LiquidationCall();
    }

    const events = await pool.queryFilter(filter, start, end);
    allEvents.push(...events);
  }

  // Resolve token info and block timestamps in parallel batches
  const uniqueTokens = new Set();
  for (const event of allEvents) {
    uniqueTokens.add(event.args[0]); // collateralAsset
    uniqueTokens.add(event.args[1]); // debtAsset
  }
  await Promise.all(
    [...uniqueTokens].map((addr) => getTokenInfo(provider, addr))
  );

  const results = await Promise.all(
    allEvents.map(async (event) => {
      const collateralAsset = event.args[0];
      const debtAsset = event.args[1];
      const user = event.args[2];
      const debtToCover = event.args[3];
      const liquidatedCollateralAmount = event.args[4];
      const liquidator = event.args[5];

      const collateralInfo = await getTokenInfo(provider, collateralAsset);
      const debtInfo = await getTokenInfo(provider, debtAsset);

      const block = await provider.getBlock(event.blockNumber);

      const collateralAmount =
        parseFloat(ethers.formatUnits(liquidatedCollateralAmount, collateralInfo.decimals));
      const debtAmount =
        parseFloat(ethers.formatUnits(debtToCover, debtInfo.decimals));

      return {
        id: `${event.transactionHash}-${event.index}`,
        txHash: event.transactionHash,
        timestamp: block ? block.timestamp : 0,
        user: user.toLowerCase(),
        liquidator: liquidator.toLowerCase(),
        collateralSymbol: collateralInfo.symbol,
        collateralAmount,
        collateralValueUSD: 0, // Not available from RPC
        debtSymbol: debtInfo.symbol,
        debtAmount,
        debtValueUSD: 0, // Not available from RPC
        explorerUrl: networkConfig.explorerUrl,
        source: 'rpc',
      };
    })
  );

  return results.sort((a, b) => b.timestamp - a.timestamp);
}
