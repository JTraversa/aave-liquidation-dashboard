export function truncateAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatAmount(amount, decimals = 4) {
  if (amount === 0 || amount == null) return '—';
  if (amount < 0.0001) return '< 0.0001';
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

export function formatUSD(amount) {
  if (amount === 0 || amount == null) return '—';
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function dateToTimestamp(dateString) {
  if (!dateString) return null;
  return Math.floor(new Date(dateString).getTime() / 1000);
}

export function getTxUrl(explorerUrl, txHash) {
  return `${explorerUrl}/tx/${txHash}`;
}

export function getAddressUrl(explorerUrl, address) {
  return `${explorerUrl}/address/${address}`;
}
