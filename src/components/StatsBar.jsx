import { formatUSD } from '../utils/formatting';

export default function StatsBar({ data, source }) {
  if (!data || data.length === 0) return null;

  const totalCollateralUSD = data.reduce((sum, r) => sum + (r.collateralValueUSD || 0), 0);
  const totalDebtUSD = data.reduce((sum, r) => sum + (r.debtValueUSD || 0), 0);
  const largestCollateralUSD = Math.max(...data.map((r) => r.collateralValueUSD || 0));

  const hasUSD = source === 'subgraph';

  return (
    <div className="stats-bar">
      <div className="stat-card">
        <span className="stat-label">Liquidations</span>
        <span className="stat-value">{data.length.toLocaleString()}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Total Collateral Seized</span>
        <span className="stat-value">{hasUSD ? formatUSD(totalCollateralUSD) : '—'}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Total Debt Repaid</span>
        <span className="stat-value">{hasUSD ? formatUSD(totalDebtUSD) : '—'}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Largest Liquidation</span>
        <span className="stat-value">{hasUSD ? formatUSD(largestCollateralUSD) : '—'}</span>
      </div>
    </div>
  );
}
