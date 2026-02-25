import Header from './components/Header';
import Socialicons from './components/Socialicons';
import SearchForm from './components/SearchForm';
import StatsBar from './components/StatsBar';
import LiquidationTable from './components/LiquidationTable';
import { useLiquidations } from './hooks/useLiquidations';
import './App.css';

function App() {
  const { data, loading, error, warning, source, search } = useLiquidations();

  return (
    <div className="app">
      <Header />
      <Socialicons />
      <main className="main">
        <div className="page-intro">
          <h1>Aave V3 Liquidation Dashboard</h1>
          <p>
            Search and analyze liquidation events across Aave V3 markets. Select a network, set a date range, and optionally filter by liquidated user or liquidator address. For complete data with USD pricing, add a free <a href="https://thegraph.com/studio/" target="_blank" rel="noopener noreferrer">Graph API key</a> via Settings.
          </p>
        </div>
        <SearchForm onSearch={search} loading={loading} />
        {loading && (
          <div className="loading">
            <div className="spinner" />
            <p>Fetching liquidation events...</p>
          </div>
        )}
        {error && (
          <div className="error-banner">
            <p>{error}</p>
          </div>
        )}
        {warning && !loading && (
          <div className="warning-banner">
            <p>{warning}</p>
          </div>
        )}
        {!loading && !error && data.length > 0 && <StatsBar data={data} source={source} />}
        {!loading && !error && <LiquidationTable data={data} source={source} />}
      </main>
    </div>
  );
}

export default App;
