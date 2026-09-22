import { CONTRACTS } from "@/lib/constants";
import { cached } from "@/lib/cache";
import { fetchJson } from "./fetchers";

/**
 * publicnode answers current state without a key and without the throttling
 * that makes mainnet.base.org drop requests under any load. Every call here is
 * against the latest block, so its refusal to serve archive requests is fine.
 */
const RPC = process.env.BASE_RPC_URL || "https://base-rpc.publicnode.com";

const SELECTOR = {
  totalSupply: "0x18160ddd",
  balanceOf: "0x70a08231",
} as const;

function pad(address: string) {
  return address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
}

type RpcResponse = { result?: string; error?: { message: string } };

async function ethCall(to: string, data: string, revalidate: number): Promise<bigint> {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_call",
    params: [{ to, data }, "latest"],
  });
  const res = await fetchJson<RpcResponse>("base-rpc", RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    next: { revalidate },
  });
  if (res.error) throw new Error(`base-rpc: ${res.error.message}`);
  if (!res.result || res.result === "0x") throw new Error("base-rpc: empty result");
  return BigInt(res.result);
}

const WAD = 1e18;

export type ChainState = {
  /** ERC-20 totalSupply, which still counts burned tokens held at 0x0. */
  vvvTotalSupplyOnChain: number;
  /** VVV sitting at the zero address from programmatic buy-and-burn. */
  vvvBurned: number;
  /** sVVV supply: every VVV staked, including the portion locked behind DIEM. */
  sVvvSupply: number;
  /** VVV the staking contract actually holds, including undistributed emissions. */
  vvvInStaking: number;
  diemSupply: number;
  fetchedAt: number;
};

export async function getChainState(revalidate = 300): Promise<ChainState> {
  const { value, at, stale } = await cached("base:state", revalidate * 1000, () =>
    loadChainState(revalidate),
  );
  return stale ? { ...value, fetchedAt: at } : value;
}

async function loadChainState(revalidate: number): Promise<ChainState> {
  const balanceOf = (holder: string) => SELECTOR.balanceOf + pad(holder);
  const [totalSupply, burned, sVvv, inStaking, diem] = await Promise.all([
    ethCall(CONTRACTS.vvv, SELECTOR.totalSupply, revalidate),
    ethCall(CONTRACTS.vvv, balanceOf(CONTRACTS.burnSink), revalidate),
    ethCall(CONTRACTS.staking, SELECTOR.totalSupply, revalidate),
    ethCall(CONTRACTS.vvv, balanceOf(CONTRACTS.staking), revalidate),
    ethCall(CONTRACTS.diem, SELECTOR.totalSupply, revalidate),
  ]);
  return {
    vvvTotalSupplyOnChain: Number(totalSupply) / WAD,
    vvvBurned: Number(burned) / WAD,
    sVvvSupply: Number(sVvv) / WAD,
    vvvInStaking: Number(inStaking) / WAD,
    diemSupply: Number(diem) / WAD,
    fetchedAt: Date.now(),
  };
}
