import { useState } from 'react';

export default function Settings({ onClose }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('graph_api_key') || '');

  function handleSave() {
    if (apiKey.trim()) {
      localStorage.setItem('graph_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('graph_api_key');
    }
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <label htmlFor="api-key">The Graph API Key</label>
          <p className="help-text">
            Get a free API key from{' '}
            <a href="https://thegraph.com/studio/" target="_blank" rel="noopener noreferrer">
              Subgraph Studio
            </a>
            . Without a key, the app falls back to direct RPC queries (slower, no USD values).
          </p>
          <input
            id="api-key"
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
            spellCheck={false}
          />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
