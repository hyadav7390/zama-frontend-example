import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Contract, ethers } from "ethers";
import { getCookieJarContract, buildEncryptedCookies, ensureFhevmInstance } from "../lib/fhevm";
import { loadOrCreateSignature } from "../lib/decryptionSignature";

const COOKIE_TOTAL_QUERY_KEY = ["cookie-total"] as const;

async function decryptJarTotal(contract: Contract) {
  const fhe = await ensureFhevmInstance();
  const contractAddress = await contract.getAddress();
  const encryptedHandle = await contract.encryptedTotal();
  const handleHex = ethers.hexlify(encryptedHandle);
  const signer = contract.runner as ethers.Signer;

  const signature = await loadOrCreateSignature(fhe, contractAddress, signer);
  const decrypted = await fhe.userDecrypt(
    [{ handle: handleHex, contractAddress }],
    signature.privateKey,
    signature.publicKey,
    signature.signature,
    signature.contractAddresses,
    signature.userAddress,
    signature.startTimestamp,
    signature.durationDays
  );

  const total = decrypted[handleHex];
  if (total === undefined) {
    throw new Error("Unable to decrypt cookie jar");
  }

  return Number(total);
}

export function useCookieJar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const queryClient = useQueryClient();

  const addCookies = useMutation({
    mutationFn: async (amount: number) => {
      if (!address || !isConnected) throw new Error("Connect a wallet first");
      const contract = await getCookieJarContract();
      const { handle, inputProof } = await buildEncryptedCookies(amount, address);
      return contract.addCookies(handle, inputProof);
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: COOKIE_TOTAL_QUERY_KEY });
    },
  });

  const totalQuery = useQuery({
    queryKey: COOKIE_TOTAL_QUERY_KEY,
    enabled: false,
    queryFn: async () => {
      if (!address || !isConnected) throw new Error("Connect a wallet first");
      const contract = await getCookieJarContract();
      return decryptJarTotal(contract);
    },
  });

  const revealTotal = useMutation({
    mutationFn: async () => {
      if (!address || !isConnected) throw new Error("Connect a wallet first");
      const contract = await getCookieJarContract();
      const tx = await contract.revealTotal();
      await tx.wait();
      return decryptJarTotal(contract);
    },
    onSuccess: (value) => {
      queryClient.setQueryData(COOKIE_TOTAL_QUERY_KEY, value);
    },
  });

  return {
    isConnected,
    address,
    connect,
    connectors,
    isConnecting: isPending,
    connectError,
    disconnect,
    addCookies,
    totalQuery,
    revealTotal,
  };
}
