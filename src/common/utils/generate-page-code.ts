import { randomBytes } from 'crypto';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generatePageCode(length = 12): string {
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  }
  return result;
}
