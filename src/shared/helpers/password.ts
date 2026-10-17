import {randomBytes, scrypt} from 'node:crypto';

export async function hashPassword(password: string, salt: string): Promise<string> {
  const passwordSalt = randomBytes(16).toString('hex');
  const hash = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, `${salt}:${passwordSalt}`, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });

  return `scrypt:${passwordSalt}:${hash.toString('hex')}`;
}
