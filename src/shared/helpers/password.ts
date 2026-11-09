import {randomBytes, scrypt, timingSafeEqual} from 'node:crypto';

function derivePassword(password: string, salt: string): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const passwordSalt = randomBytes(16).toString('hex');
  const hash = await derivePassword(password, `${salt}:${passwordSalt}`);
  return `scrypt:${passwordSalt}:${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, salt: string, storedPassword: string): Promise<boolean> {
  const parts = storedPassword.split(':');
  const [algorithm, passwordSalt, storedHash] = parts;

  if (parts.length !== 3 || algorithm !== 'scrypt' ||
    !/^[a-f0-9]{32}$/.test(passwordSalt) || !/^[a-f0-9]{128}$/.test(storedHash)) {
    return false;
  }

  const hash = await derivePassword(password, `${salt}:${passwordSalt}`);
  return timingSafeEqual(new Uint8Array(hash), new Uint8Array(Buffer.from(storedHash, 'hex')));
}
