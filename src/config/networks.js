export const NETWORKS = {
  ethereum: {
    name: 'Ethereum',
    chainId: 1,
    subgraphId: 'JCNWRypm7FYwV8fx5HhzZPSFaMxgkPuw4TnR3Gpi81zk',
    poolContract: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    rpcUrl: 'https://ethereum-rpc.publicnode.com',
    explorerUrl: 'https://etherscan.io',
    startBlock: 16291127,
    avgBlockTime: 12,     // ~12s per block
    maxLogRange: 2000,    // PublicNode safe limit for Ethereum
  },
  arbitrum: {
    name: 'Arbitrum',
    chainId: 42161,
    subgraphId: '4xyasjQeREe7PxnF6wVdobZvCw5mhoHZq3T7guRpuNPf',
    poolContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    rpcUrl: 'https://arbitrum-one-rpc.publicnode.com',
    explorerUrl: 'https://arbiscan.io',
    startBlock: 7742429,
    avgBlockTime: 0.25,   // ~0.25s per block
    maxLogRange: 49999,   // PublicNode hard limit is 50,000 (exclusive)
  },
  polygon: {
    name: 'Polygon',
    chainId: 137,
    subgraphId: 'Co2URyXjnxaw8WqxKyVHdirq9Ahhm5vcTs4pMB8CDGFG',
    poolContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    rpcUrl: 'https://1rpc.io/matic',
    explorerUrl: 'https://polygonscan.com',
    startBlock: 25826028,
    avgBlockTime: 2,      // ~2s per block
    maxLogRange: 3000,    // Bor node hard limit is 3,500; safe at 3,000
  },
  optimism: {
    name: 'Optimism',
    chainId: 10,
    subgraphId: 'DSfLz8oQBUeU5atALgUFQKMTSYV5j1FXA4eEiLKCMEQi',
    poolContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    rpcUrl: 'https://optimism-rpc.publicnode.com',
    explorerUrl: 'https://optimistic.etherscan.io',
    startBlock: 4365693,
    avgBlockTime: 2,      // ~2s per block
    maxLogRange: 5000,    // PublicNode limit ~9,300; safe at 5,000
  },
  avalanche: {
    name: 'Avalanche',
    chainId: 43114,
    subgraphId: '2h9woxy8RTjHu1HJsCEnmzpPHFArU33avmUh4f71JpVn',
    poolContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    rpcUrl: 'https://avalanche-c-chain-rpc.publicnode.com',
    explorerUrl: 'https://snowtrace.io',
    startBlock: 11970506,
    avgBlockTime: 2,      // ~2s per block
    maxLogRange: 2048,    // Bor/Coreth node hard limit
  },
  base: {
    name: 'Base',
    chainId: 8453,
    subgraphId: 'GQFbb95cE6d8mV989mL5figjaGaKCQB3xqYrr1bRyXqF',
    poolContract: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
    rpcUrl: 'https://base-rpc.publicnode.com',
    explorerUrl: 'https://basescan.org',
    startBlock: 2357440,
    avgBlockTime: 2,      // ~2s per block
    maxLogRange: 5000,    // PublicNode variable ~9,300; safe at 5,000
  },
};

export const GRAPH_GATEWAY_URL = 'https://gateway.thegraph.com/api';

export function getSubgraphUrl(networkKey, apiKey) {
  const network = NETWORKS[networkKey];
  if (!network || !apiKey) return null;
  return `${GRAPH_GATEWAY_URL}/${apiKey}/subgraphs/id/${network.subgraphId}`;
}
