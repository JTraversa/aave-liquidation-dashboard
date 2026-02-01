export const NETWORKS = {
  ethereum: {
    name: 'Ethereum',
    chainId: 1,
    subgraphId: 'JCNWRypm7FYwV8fx5HhzZPSFaMxgkPuw4TnR3Gpi81zk',
    poolContract: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    startBlock: 16291127,
  },
  arbitrum: {
    name: 'Arbitrum',
    chainId: 42161,
    subgraphId: '4xyasjQeREe7PxnF6wVdobZvCw5mhoHZq3T7guRpuNPf',
    poolContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    startBlock: 7742429,
  },
  polygon: {
    name: 'Polygon',
    chainId: 137,
    subgraphId: 'Co2URyXjnxaw8WqxKyVHdirq9Ahhm5vcTs4pMB8CDGFG',
    poolContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    startBlock: 25826028,
  },
  optimism: {
    name: 'Optimism',
    chainId: 10,
    subgraphId: 'DSfLz8oQBUeU5atALgUFQKMTSYV5j1FXA4eEiLKCMEQi',
    poolContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    startBlock: 4365693,
  },
  avalanche: {
    name: 'Avalanche',
    chainId: 43114,
    subgraphId: '2h9woxy8RTjHu1HJsCEnmzpPHFArU33avmUh4f71JpVn',
    poolContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    startBlock: 11970506,
  },
  base: {
    name: 'Base',
    chainId: 8453,
    subgraphId: 'GQFbb95cE6d8mV989mL5figjaGaKCQB3xqYrr1bRyXqF',
    poolContract: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    startBlock: 2357440,
  },
};

export const GRAPH_GATEWAY_URL = 'https://gateway.thegraph.com/api';

export function getSubgraphUrl(networkKey, apiKey) {
  const network = NETWORKS[networkKey];
  if (!network || !apiKey) return null;
  return `${GRAPH_GATEWAY_URL}/${apiKey}/subgraphs/id/${network.subgraphId}`;
}
