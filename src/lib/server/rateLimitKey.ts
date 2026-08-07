export function getRateLimitActorKey(userId: string | null, ipAddress: string): string {
  if (userId && userId !== 'demo-user') {
    return `user:${userId}`;
  }
  return `ip:${ipAddress}`;
}
