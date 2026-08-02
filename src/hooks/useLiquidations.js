import { useState, useCallback } from 'react';
import { getNetwork } from '../config/networks';
import { fetchLiquidationsFromSubgraph } from '../services/subgraph';
import { fetchLiquidationsFromRPC, fetchV4LiquidationsFromRPC } from '../services/rpc';

export function useLiquidations() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(null);
  const [warning, setWarning] = useState(null);

  const search = useCallback(async ({ version = 'v3', networkKey, startTimestamp, endTimestamp, userAddress, liquidatorAddress }) => {
    setLoading(true);
    setError(null);
    setWarning(null);
    setData([]);
    setSource(null);

    const network = getNetwork(version, networkKey);
    if (!network) {
      setError('Invalid network selected.');
      setLoading(false);
      return;
    }

    // v4 has no published subgraph, so it goes straight to RPC. That also means
    // no USD pricing, which the table already handles for the v3 RPC fallback.
    if (version === 'v4') {
      try {
        const { results, isPartial } = await fetchV4LiquidationsFromRPC(
          network,
          startTimestamp,
          endTimestamp,
          userAddress,
          liquidatorAddress
        );
        setData(results);
        setSource('rpc');
        if (isPartial) {
          setWarning(
            'RPC results are partial — the date range exceeds what free public RPCs can scan in one pass. Narrow the date range for complete results.'
          );
        }
      } catch (err) {
        setError(`Failed to fetch liquidations: ${err.message}`);
      } finally {
        setLoading(false);
      }
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
          liquidatorAddress,
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
        userAddress,
        liquidatorAddress
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
