import { NETWORKS } from '../config/networks';

export default function NetworkSelector({ value, onChange }) {
  return (
    <select
      className="network-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {Object.entries(NETWORKS).map(([key, net]) => (
        <option key={key} value={key}>
          {net.name}
        </option>
      ))}
    </select>
  );
}
