import { getNetworks } from '../config/networks';

export default function NetworkSelector({ value, version = 'v3', onChange }) {
  const networks = getNetworks(version);
  return (
    <select
      id="network"
      className="network-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {Object.entries(networks).map(([key, net]) => (
        <option key={key} value={key}>
          {net.name}
        </option>
      ))}
    </select>
  );
}
