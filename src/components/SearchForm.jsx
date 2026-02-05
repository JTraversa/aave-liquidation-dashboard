import { useState } from 'react';
import { ethers } from 'ethers';
import NetworkSelector from './NetworkSelector';
import { dateToTimestamp } from '../utils/formatting';
import { getMaxDateRangeDays } from '../config/networks';

function clampStartDate(endDate, maxDays) {
  const end = new Date(endDate);
  const earliest = new Date(end);
  earliest.setDate(earliest.getDate() - Math.floor(maxDays));
  return earliest.toISOString().split('T')[0];
}

function getDefaultDates(networkKey) {
  const end = new Date();
  const maxDays = getMaxDateRangeDays(networkKey);
  const daysBack = Math.min(7, Math.floor(maxDays));
  const start = new Date();
  start.setDate(start.getDate() - daysBack);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export default function SearchForm({ onSearch, loading }) {
  const defaults = getDefaultDates('ethereum');
  const [network, setNetwork] = useState('ethereum');
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [address, setAddress] = useState('');
  const [liquidatorAddress, setLiquidatorAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [liquidatorError, setLiquidatorError] = useState('');
  const [dateError, setDateError] = useState('');

  const maxDays = getMaxDateRangeDays(network);
  const maxDaysLabel = maxDays > 365 ? null : `${Math.floor(maxDays)}d`;

  function handleNetworkChange(key) {
    setNetwork(key);
    setDateError('');
    const newMax = getMaxDateRangeDays(key);
    // If current range exceeds the new network's limit, clamp the start date
    if (startDate && endDate) {
      const diffDays = (new Date(endDate) - new Date(startDate)) / 86400000;
      if (diffDays > newMax) {
        setStartDate(clampStartDate(endDate, newMax));
      }
    }
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (startDate && endDate && startDate > endDate) {
      setDateError('Start date must be before end date');
      return;
    }
    if (startDate && endDate) {
      const diffDays = (new Date(endDate) - new Date(startDate)) / 86400000;
      if (diffDays > maxDays) {
        setDateError(`Date range exceeds RPC limit for this network (max ~${Math.floor(maxDays)} days). Add a Graph API key in Settings for unlimited range.`);
        return;
      }
    }
    setDateError('');

    if (address && !ethers.isAddress(address)) {
      setAddressError('Invalid Ethereum address');
      return;
    }
    setAddressError('');

    if (liquidatorAddress && !ethers.isAddress(liquidatorAddress)) {
      setLiquidatorError('Invalid Ethereum address');
      return;
    }
    setLiquidatorError('');

    onSearch({
      networkKey: network,
      startTimestamp: dateToTimestamp(startDate),
      endTimestamp: dateToTimestamp(endDate + 'T23:59:59'),
      userAddress: address || null,
      liquidatorAddress: liquidatorAddress || null,
    });
  }

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="network">Network</label>
          <NetworkSelector value={network} onChange={handleNetworkChange} />
        </div>
        <div className="form-group">
          <label htmlFor="start-date">
            Start Date{maxDaysLabel && <span className="date-hint"> (max range: {maxDaysLabel})</span>}
          </label>
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
            onChange={(e) => {
              setEndDate(e.target.value);
              setDateError('');
            }}
          />
        </div>
      </div>
      {dateError && <div className="form-row"><span className="form-error">{dateError}</span></div>}
      <div className="form-row">
        <div className="form-group form-group-half">
          <label htmlFor="address">Liquidated User (optional)</label>
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
        <div className="form-group form-group-half">
          <label htmlFor="liquidator">Liquidator (optional)</label>
          <input
            id="liquidator"
            type="text"
            value={liquidatorAddress}
            onChange={(e) => {
              setLiquidatorAddress(e.target.value);
              setLiquidatorError('');
            }}
            placeholder="0x..."
            spellCheck={false}
          />
          {liquidatorError && <span className="form-error">{liquidatorError}</span>}
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
