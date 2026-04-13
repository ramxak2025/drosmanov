export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return '***';
  return phone.slice(0, 3) + '***' + phone.slice(-4);
}

export function maskIp(ip: string): string {
  if (!ip) return 'unknown';
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.***.${parts[3]}`;
  return ip.slice(0, 8) + '***';
}
