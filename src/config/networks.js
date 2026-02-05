export const NETWORKS = {
  ethereum: {
    name: 'Ethereum',
    chainId: 1,
    subgraphId: 'Cd2gEDVeqnjBn1hSeqFMitw8Q1iiyV9FYUZkLNRcL87g',
    poolContract: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    rpcUrl: 'https://eth.drpc.org',
    explorerUrl: 'https://etherscan.io',
    startBlock: 16291127,
    avgBlockTime: 12,
    maxLogRange: 10000,
  },
  arbitrum: {
    name: 'Arbitrum',
    chainId: 42161,
    subgraphId: 'DLuE98kEb5pQNXAcKFQGQgfSQ57Xdou4jnVbAEqMfy3B',
    poolContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    rpcUrl: 'https://arbitrum-one-rpc.publicnode.com',
    explorerUrl: 'https://arbiscan.io',
    startBlock: 7742429,
    avgBlockTime: 0.25,
    maxLogRange: 10000,
  },
  polygon: {
    name: 'Polygon',
    chainId: 137,
    subgraphId: 'Co2URyXjnxaw8WqxKyVHdirq9Ahhm5vcTs4dMedAq211',
    poolContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    rpcUrl: 'https://polygon-bor-rpc.publicnode.com',
    explorerUrl: 'https://polygonscan.com',
    startBlock: 25826028,
    avgBlockTime: 2,
    maxLogRange: 50000,
  },
  optimism: {
    name: 'Optimism',
    chainId: 10,
    subgraphId: 'DSfLz8oQBUeU5atALgUFQKMTSYV9mZAVYp4noLSXAfvb',
    poolContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    rpcUrl: 'https://optimism-rpc.publicnode.com',
    explorerUrl: 'https://optimistic.etherscan.io',
    startBlock: 4365693,
    avgBlockTime: 2,
    maxLogRange: 5000,
  },
  avalanche: {
    name: 'Avalanche',
    chainId: 43114,
    subgraphId: '2h9woxy8RTjHu1HJsCEnmzpPHFArU33avmUh4f71JpVn',
    poolContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    rpcUrl: 'https://avalanche-c-chain-rpc.publicnode.com',
    explorerUrl: 'https://snowtrace.io',
    startBlock: 11970506,
    avgBlockTime: 2,
    maxLogRange: 2048,
  },
  base: {
    name: 'Base',
    chainId: 8453,
    subgraphId: 'GQFbb95cE6d8mV989mL5figjaGaKCQB3xqYrr1bRyXqF',
    poolContract: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
    rpcUrl: 'https://base-rpc.publicnode.com',
    explorerUrl: 'https://basescan.org',
    startBlock: 2357440,
    avgBlockTime: 2,
    maxLogRange: 5000,
  },
  bnb: {
    name: 'BNB Chain',
    chainId: 56,
    subgraphId: '7Jk85XgkV1MQ7u56hD8rr65rfASbayJXopugWkUoBMnZ',
    poolContract: '0x6807dc923806fE8Fd134338EABCA509979a7e0cB',
    rpcUrl: 'https://bsc-rpc.publicnode.com',
    explorerUrl: 'https://bscscan.com',
    startBlock: 29136492,
    avgBlockTime: 3,
    maxLogRange: 5000,
  },
  gnosis: {
    name: 'Gnosis',
    chainId: 100,
    subgraphId: 'HtcDaL8L8iZ2KQNNS44EBVmLruzxuNAz1RkBYdui1QUT',
    poolContract: '0xb50201558B00496A145fE76f7424749556E326D8',
    rpcUrl: 'https://gnosis-rpc.publicnode.com',
    explorerUrl: 'https://gnosisscan.io',
    startBlock: 27150000,
    avgBlockTime: 5,
    maxLogRange: 50000,
  },
  scroll: {
    name: 'Scroll',
    chainId: 534352,
    subgraphId: '74JwenoHZb2aAYVGCCSdPWzi9mm745dyHyQQVoZ7Sbub',
    poolContract: '0x11fCfe756c05AD438e312a7fd934381537D3cFfe',
    rpcUrl: 'https://scroll-rpc.publicnode.com',
    explorerUrl: 'https://scrollscan.com',
    startBlock: 4500000,
    avgBlockTime: 3,
    maxLogRange: 50000,
  },
  zksync: {
    name: 'zkSync Era',
    chainId: 324,
    subgraphId: 'ENYSc8G3WvrbhWH8UZHrqPWYRcuyCaNmaTmoVp7uzabM',
    poolContract: '0x78e30497a3c7527d953c6B1E3541b021A98Ac43c',
    rpcUrl: 'https://mainnet.era.zksync.io',
    explorerUrl: 'https://era.zksync.network',
    startBlock: 37248000,
    avgBlockTime: 1,
    maxLogRange: 10000000,
  },
  linea: {
    name: 'Linea',
    chainId: 59144,
    subgraphId: 'Gz2kjnmRV1fQj3R8cssoZa5y9VTanhrDo4Mh7nWW1wHa',
    poolContract: '0xc47b8C00b0f69a36fa203Ffeac0334874574a8Ac',
    rpcUrl: 'https://rpc.linea.build',
    explorerUrl: 'https://lineascan.build',
    startBlock: 12500000,
    avgBlockTime: 2,
    maxLogRange: 10000000,
  },
  metis: {
    name: 'Metis',
    chainId: 1088,
    subgraphId: null, // Uses Metis-hosted Graph endpoint
    poolContract: '0x90df02551bB792286e8D4f13E0e357b4Bf1D6a57',
    rpcUrl: 'https://metis-rpc.publicnode.com',
    explorerUrl: 'https://explorer.metis.io',
    startBlock: 5765988,
    avgBlockTime: 4,
    maxLogRange: 50000,
  },
};

export const MAX_RPC_CHUNKS = 40;

/** Max queryable date range in days for RPC mode on a given network. */
export function getMaxDateRangeDays(networkKey) {
  const net = NETWORKS[networkKey];
  if (!net) return Infinity;
  const seconds = net.maxLogRange * MAX_RPC_CHUNKS * net.avgBlockTime;
  return seconds / 86400;
}

export const GRAPH_GATEWAY_URL = 'https://gateway.thegraph.com/api';

export function getSubgraphUrl(networkKey, apiKey) {
  const network = NETWORKS[networkKey];
  if (!network || !apiKey || !network.subgraphId) return null;
  return `${GRAPH_GATEWAY_URL}/${apiKey}/subgraphs/id/${network.subgraphId}`;
}
