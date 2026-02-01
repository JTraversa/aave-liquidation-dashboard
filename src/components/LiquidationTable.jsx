import { useState } from 'react';
import {
  truncateAddress,
  formatAmount,
  formatUSD,
  formatTimestamp,
  getTxUrl,
  getAddressUrl,
} from '../utils/formatting';

const COLUMNS = [
  { key: 'timestamp', label: 'Time' },
  { key: 'txHash', label: 'Tx Hash' },
  { key: 'user', label: 'Liquidated User' },
  { key: 'liquidator', label: 'Liquidator' },
  { key: 'collateralSymbol', label: 'Collateral' },
  { key: 'collateralAmount', label: 'Collateral Amt' },
  { key: 'collateralValueUSD', label: 'Collateral USD' },
  { key: 'debtSymbol', label: 'Debt' },
  { key: 'debtAmount', label: 'Debt Amt' },
  { key: 'debtValueUSD', label: 'Debt USD' },
];

function compareValues(a, b, key) {
  const va = a[key];
  const vb = b[key];
  if (typeof va === 'number' && typeof vb === 'number') return va - vb;
  return String(va).localeCompare(String(vb));
}

export default function LiquidationTable({ data, source }) {
  const [sortKey, setSortKey] = useState('timestamp');
  const [sortDir, setSortDir] = useState('desc');

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sorted = [...data].sort((a, b) => {
    const result = compareValues(a, b, sortKey);
    return sortDir === 'asc' ? result : -result;
  });

  if (data.length === 0) {
    return (
      <div className="empty-state">
        <p>No liquidation events found. Try adjusting your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      {source && (
        <div className="source-badge">
          Data source: <strong>{source === 'subgraph' ? 'The Graph' : 'RPC'}</strong>
          {source === 'rpc' && (
            <span className="source-note"> (USD values unavailable via RPC)</span>
          )}
          <span className="result-count">{data.length} result{data.length !== 1 ? 's' : ''}</span>
        </div>
      )}
      <div className="table-scroll">
        <table className="liquidation-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={sortKey === col.key ? `sorted sorted-${sortDir}` : ''}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="sort-arrow">{sortDir === 'asc' ? ' \u25B2' : ' \u25BC'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.id}>
                <td className="nowrap">{formatTimestamp(row.timestamp)}</td>
                <td>
                  <a
                    href={getTxUrl(row.explorerUrl, row.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {truncateAddress(row.txHash)}
                  </a>
                </td>
                <td>
                  <a
                    href={getAddressUrl(row.explorerUrl, row.user)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {truncateAddress(row.user)}
                  </a>
                </td>
                <td>
                  <a
                    href={getAddressUrl(row.explorerUrl, row.liquidator)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {truncateAddress(row.liquidator)}
                  </a>
                </td>
                <td>{row.collateralSymbol}</td>
                <td className="number">{formatAmount(row.collateralAmount)}</td>
                <td className="number">{formatUSD(row.collateralValueUSD)}</td>
                <td>{row.debtSymbol}</td>
                <td className="number">{formatAmount(row.debtAmount)}</td>
                <td className="number">{formatUSD(row.debtValueUSD)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
