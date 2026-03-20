export function getConversationKey(a: string, b: string) {
  return [a, b].sort().join(":");
}

