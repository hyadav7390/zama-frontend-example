import { initSDK, createInstance, type FhevmInstance } from "@zama-fhe/relayer-sdk/web";
import { BrowserProvider, Contract, ethers, type Eip1193Provider } from "ethers";

const TARGET_CHAIN_ID = Number(import.meta.env.VITE_TARGET_CHAIN_ID ?? 11155111);
const GATEWAY_CHAIN_ID = Number(import.meta.env.VITE_GATEWAY_CHAIN_ID ?? 55815);
const COOKIE_JAR_ADDRESS = import.meta.env.VITE_COOKIE_JAR_ADDRESS || "0xYourContractAddress";
const ACL_CONTRACT_ADDRESS = import.meta.env.VITE_ACL_CONTRACT_ADDRESS ?? "";
const KMS_CONTRACT_ADDRESS = import.meta.env.VITE_KMS_CONTRACT_ADDRESS ?? "";
const INPUT_VERIFIER_CONTRACT_ADDRESS = import.meta.env.VITE_INPUT_VERIFIER_CONTRACT_ADDRESS ?? "";
const INPUT_VERIFICATION_CONTRACT_ADDRESS = import.meta.env.VITE_INPUT_VERIFICATION_CONTRACT_ADDRESS ?? "";
const DECRYPTION_ORACLE_ADDRESS = import.meta.env.VITE_DECRYPTION_ORACLE_ADDRESS ?? "";
const RELAYER_URL = import.meta.env.VITE_RELAYER_URL ?? "";
const RPC_URL = import.meta.env.VITE_RPC_URL ?? "";

const ABI = [
  "function addCookies(bytes32 encryptedAmount, bytes inputProof)",
  "function encryptedTotal() view returns (bytes32)",
  "function revealTotal() returns (uint32)",
];

let instance: FhevmInstance | null = null;

function ensureConfigured() {
  if (!ethers.isAddress(ACL_CONTRACT_ADDRESS)) {
    throw new Error("Set VITE_ACL_CONTRACT_ADDRESS to a valid contract address in your frontend .env");
  }
  if (!ethers.isAddress(KMS_CONTRACT_ADDRESS)) {
    throw new Error("Set VITE_KMS_CONTRACT_ADDRESS to a valid contract address in your frontend .env");
  }
  if (!ethers.isAddress(INPUT_VERIFIER_CONTRACT_ADDRESS)) {
    throw new Error("Set VITE_INPUT_VERIFIER_CONTRACT_ADDRESS to a valid contract address in your frontend .env");
  }
  if (!ethers.isAddress(INPUT_VERIFICATION_CONTRACT_ADDRESS)) {
    throw new Error("Set VITE_INPUT_VERIFICATION_CONTRACT_ADDRESS to a valid contract address in your frontend .env");
  }
  if (!ethers.isAddress(DECRYPTION_ORACLE_ADDRESS)) {
    throw new Error("Set VITE_DECRYPTION_ORACLE_ADDRESS to a valid contract address in your frontend .env");
  }
  if (!RELAYER_URL) {
    throw new Error("Set VITE_RELAYER_URL to the fhEVM relayer URL provided by Zama");
  }
  if (!RPC_URL) {
    throw new Error("Set VITE_RPC_URL to an RPC endpoint");
  }
}

export async function ensureFhevmInstance(): Promise<FhevmInstance> {
  if (instance) return instance;

  ensureConfigured();

  await initSDK();
  instance = await createInstance({
    aclContractAddress: ACL_CONTRACT_ADDRESS,
    kmsContractAddress: KMS_CONTRACT_ADDRESS,
    inputVerifierContractAddress: INPUT_VERIFIER_CONTRACT_ADDRESS,
    verifyingContractAddressDecryption: DECRYPTION_ORACLE_ADDRESS,
    verifyingContractAddressInputVerification: INPUT_VERIFICATION_CONTRACT_ADDRESS,
    gatewayChainId: GATEWAY_CHAIN_ID,
    chainId: TARGET_CHAIN_ID,
    relayerUrl: RELAYER_URL,
    network: RPC_URL,
  });

  return instance;
}

export async function getCookieJarContract() {
  const { ethereum } = window as typeof window & { ethereum?: Eip1193Provider };
  if (!ethereum) {
    throw new Error("A browser wallet is required");
  }

  const provider = new BrowserProvider(ethereum);
  const signer = await provider.getSigner();
  return new Contract(COOKIE_JAR_ADDRESS, ABI, signer);
}

export async function buildEncryptedCookies(amount: number, userAddress: string) {
  const fhe = await ensureFhevmInstance();
  const zkInput = fhe.createEncryptedInput(COOKIE_JAR_ADDRESS, userAddress);
  const { handles, inputProof } = await zkInput.add32(amount).encrypt();
  return { handle: ethers.hexlify(handles[0]), inputProof: ethers.hexlify(inputProof) } as const;
}

export {};
