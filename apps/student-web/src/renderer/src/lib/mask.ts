/** "Mask" an e-mail field as the user types: drop whitespace, strip characters
    that can't appear in an address, and normalize to lower case. */
export function maskEmail(value: string): string {
  return value
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9@._%+-]/g, '')
    .toLowerCase()
}
