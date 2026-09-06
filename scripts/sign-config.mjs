import { readFile, writeFile } from 'node:fs/promises';
import { createPrivateKey, sign } from 'node:crypto';

const configPath = process.argv[2] ?? 'akbank.json';
const privateKey = process.env.AKBANK_SIGNING_PRIVATE_KEY;

if (!privateKey) {
  throw new Error('AKBANK_SIGNING_PRIVATE_KEY is required');
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== 'signature')
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, sortKeys(entry)]),
    );
  }
  return value;
}

const config = JSON.parse(await readFile(configPath, 'utf8'));
const canonicalConfig = JSON.stringify(sortKeys(config));
const signature = sign(null, Buffer.from(canonicalConfig), createPrivateKey(privateKey)).toString('base64');

config.signature = signature;
await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
