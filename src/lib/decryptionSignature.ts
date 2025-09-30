import type { FhevmInstance } from "@zama-fhe/relayer-sdk/web";
import { ethers } from "ethers";

export type StoredDecryptionSignature = {
  publicKey: string;
  privateKey: string;
  signature: string;
  userAddress: `0x${string}`;
  contractAddresses: `0x${string}`[];
  startTimestamp: number;
  durationDays: number;
};

const STORAGE_PREFIX = "fhevm-cookie-jar-signature";
const ONE_DAY = 24 * 60 * 60;

const memoryStore = new Map<string, string>();

type StorageProvider = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function resolveStorage(): StorageProvider {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return {
    getItem: (key) => memoryStore.get(key) ?? null,
    setItem: (key, value) => {
      memoryStore.set(key, value);
    },
    removeItem: (key) => {
      memoryStore.delete(key);
    },
  };
}

function storageKey(userAddress: string, contractAddress: string) {
  return `${STORAGE_PREFIX}:${userAddress.toLowerCase()}:${contractAddress.toLowerCase()}`;
}

function isSignatureValid(signature: StoredDecryptionSignature): boolean {
  const expiresAt = signature.startTimestamp + signature.durationDays * ONE_DAY;
  return Math.floor(Date.now() / 1000) < expiresAt;
}

export async function loadOrCreateSignature(
  instance: FhevmInstance,
  contractAddress: string,
  signer: ethers.Signer
): Promise<StoredDecryptionSignature> {
  const userAddress = (await signer.getAddress()) as `0x${string}`;
  const key = storageKey(userAddress, contractAddress);
  const storage = resolveStorage();

  const cachedValue = storage.getItem(key);
  if (cachedValue) {
    try {
      const parsed = JSON.parse(cachedValue) as StoredDecryptionSignature;
      if (
        parsed.userAddress.toLowerCase() === userAddress.toLowerCase() &&
        parsed.contractAddresses[0]?.toLowerCase() === contractAddress.toLowerCase() &&
        isSignatureValid(parsed)
      ) {
        return parsed;
      }
      storage.removeItem(key);
    } catch {
      storage.removeItem(key);
    }
  }

  const { publicKey, privateKey } = instance.generateKeypair();
  const startTimestamp = Math.floor(Date.now() / 1000);
  const durationDays = 365;
  const contractAddresses = [contractAddress as `0x${string}`];

  const eip712 = instance.createEIP712(publicKey, contractAddresses, startTimestamp, durationDays);

  const signature = await signer.signTypedData(
    eip712.domain as ethers.TypedDataDomain,
    {
      UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification as ethers.TypedDataField[],
    },
    eip712.message
  );

  const record: StoredDecryptionSignature = {
    publicKey,
    privateKey,
    signature,
    userAddress,
    contractAddresses,
    startTimestamp,
    durationDays,
  };

  try {
    storage.setItem(key, JSON.stringify(record));
  } catch {
    // ignore storage failures (private browsing, quota issues)
  }

  return record;
}