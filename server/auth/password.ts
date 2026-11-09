import argon2 from 'argon2';

const argon2idOptions = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1
};

export const hashPassword = (password: string) => argon2.hash(password, argon2idOptions);

export const verifyPasswordHash = async (storedHash: unknown, password: string) => {
  if (typeof storedHash !== 'string' || !storedHash.startsWith('$argon2')) return false;
  try {
    return await argon2.verify(storedHash, password);
  } catch {
    return false;
  }
};