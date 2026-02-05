import Header from './components/Header';
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
      <main className="main">
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
