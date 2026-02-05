import { getSubgraphUrl } from '../config/networks';

const LIQUIDATION_QUERY = `
query GetLiquidations($first: Int!, $skip: Int!, $where: LiquidationCall_filter, $orderBy: LiquidationCall_orderBy, $orderDirection: OrderDirection) {
  liquidationCalls(
    first: $first
    skip: $skip
    where: $where
    orderBy: $orderBy
    orderDirection: $orderDirection
  ) {
    id
    txHash
    timestamp
    user {
      id
    }
    liquidator
    collateralReserve {
      symbol
      decimals
    }
    principalReserve {
      symbol
      decimals
    }
    collateralAmount
    principalAmount
    collateralAssetPriceUSD
    borrowAssetPriceUSD
  }
}
`;

function buildWhereFilter(startTimestamp, endTimestamp, userAddress, liquidatorAddress) {
  const where = {};
  if (startTimestamp) where.timestamp_gte = String(startTimestamp);
  if (endTimestamp) where.timestamp_lte = String(endTimestamp);
  if (userAddress) where.user = userAddress.toLowerCase();
  if (liquidatorAddress) where.liquidator = liquidatorAddress.toLowerCase();
  return where;
}

function normalizeLiquidation(item, explorerUrl) {
  const collateralDecimals = parseInt(item.collateralReserve?.decimals || '18', 10);
  const principalDecimals = parseInt(item.principalReserve?.decimals || '18', 10);

  const collateralAmount = parseFloat(item.collateralAmount) / 10 ** collateralDecimals;
  const principalAmount = parseFloat(item.principalAmount) / 10 ** principalDecimals;

  const collateralPriceUSD = parseFloat(item.collateralAssetPriceUSD || '0');
  const principalPriceUSD = parseFloat(item.borrowAssetPriceUSD || '0');

  return {
    id: item.id,
    txHash: item.txHash,
    timestamp: parseInt(item.timestamp, 10),
    user: item.user?.id || '',
    liquidator: item.liquidator || '',
    collateralSymbol: item.collateralReserve?.symbol || 'Unknown',
    collateralAmount,
    collateralValueUSD: collateralAmount * collateralPriceUSD,
    debtSymbol: item.principalReserve?.symbol || 'Unknown',
    debtAmount: principalAmount,
    debtValueUSD: principalAmount * principalPriceUSD,
    explorerUrl,
    source: 'subgraph',
  };
}

export async function fetchLiquidationsFromSubgraph(
  networkKey,
  apiKey,
  startTimestamp,
  endTimestamp,
  userAddress,
  liquidatorAddress,
  explorerUrl
) {
  const url = getSubgraphUrl(networkKey, apiKey);
  if (!url) throw new Error('No subgraph URL available. Check your API key.');

  const where = buildWhereFilter(startTimestamp, endTimestamp, userAddress, liquidatorAddress);
  const allResults = [];
  let skip = 0;
  const pageSize = 1000;

  while (true) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: LIQUIDATION_QUERY,
        variables: {
          first: pageSize,
          skip,
          where,
          orderBy: 'timestamp',
          orderDirection: 'desc',
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Subgraph request failed (${response.status}): ${text}`);
    }

    const json = await response.json();

    if (json.errors) {
      throw new Error(`Subgraph query error: ${json.errors[0].message}`);
    }

    const items = json.data?.liquidationCalls || [];
    allResults.push(...items.map((item) => normalizeLiquidation(item, explorerUrl)));

    if (items.length < pageSize) break;
    skip += pageSize;

    // The Graph caps skip at 5000
    if (skip >= 5000) break;
  }

  return allResults;
}
