import { useState } from 'react';
import { ethers } from 'ethers';
import NetworkSelector from './NetworkSelector';
import { dateToTimestamp } from '../utils/formatting';

function getDefaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export default function SearchForm({ onSearch, loading }) {
  const defaults = getDefaultDates();
  const [network, setNetwork] = useState('ethereum');
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [address, setAddress] = useState('');
  const [addressError, setAddressError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();

    if (address && !ethers.isAddress(address)) {
      setAddressError('Invalid Ethereum address');
      return;
    }
    setAddressError('');

    onSearch({
      networkKey: network,
      startTimestamp: dateToTimestamp(startDate),
      endTimestamp: dateToTimestamp(endDate + 'T23:59:59'),
      userAddress: address || null,
    });
  }

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="network">Network</label>
          <NetworkSelector value={network} onChange={setNetwork} />
        </div>
        <div className="form-group">
          <label htmlFor="start-date">Start Date</label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="end-date">End Date</label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group form-group-wide">
          <label htmlFor="address">Wallet Address (optional)</label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setAddressError('');
            }}
            placeholder="0x..."
            spellCheck={false}
          />
          {addressError && <span className="form-error">{addressError}</span>}
        </div>
        <div className="form-group form-group-btn">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
    </form>
  );
}
