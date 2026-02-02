import { useState, useCallback } from 'react';
import { NETWORKS } from '../config/networks';
import { fetchLiquidationsFromSubgraph } from '../services/subgraph';
import { fetchLiquidationsFromRPC } from '../services/rpc';

export function useLiquidations() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(null);
  const [warning, setWarning] = useState(null);

  const search = useCallback(async ({ networkKey, startTimestamp, endTimestamp, userAddress }) => {
    setLoading(true);
    setError(null);
    setWarning(null);
    setData([]);
    setSource(null);

    const network = NETWORKS[networkKey];
    if (!network) {
      setError('Invalid network selected.');
      setLoading(false);
      return;
    }

    const apiKey = localStorage.getItem('graph_api_key');

    // Try subgraph first
    if (apiKey) {
      try {
        const results = await fetchLiquidationsFromSubgraph(
          networkKey,
          apiKey,
          startTimestamp,
          endTimestamp,
          userAddress,
          network.explorerUrl
        );
        setData(results);
        setSource('subgraph');
        setLoading(false);
        return;
      } catch (err) {
        console.warn('Subgraph query failed, falling back to RPC:', err.message);
      }
    }

    // Fallback to RPC
    try {
      const { results, isPartial } = await fetchLiquidationsFromRPC(
        network,
        startTimestamp,
        endTimestamp,
        userAddress
      );
      setData(results);
      setSource('rpc');
      if (isPartial) {
        setWarning(
          'RPC results are partial — the date range exceeds what free public RPCs can scan. ' +
          'Add a Graph API key in Settings for complete results.'
        );
      }
    } catch (err) {
      setError(`Failed to fetch liquidations: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, warning, source, search };
}
