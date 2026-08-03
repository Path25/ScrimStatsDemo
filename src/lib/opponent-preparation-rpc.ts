import { supabase } from "@/integrations/supabase/client";

type RpcError = { message?: string } | null;
type RpcResponse = { data: unknown; error: RpcError };
type OpponentPreparationRpcClient = {
  rpc: (name: string, args: Record<string, unknown>) => PromiseLike<RpcResponse>;
};

export async function callOpponentPreparationRpc(name: string, args: Record<string, unknown>) {
  // WO-036 RPCs are unavailable in generated types until the separately approved
  // hosted migration is applied and the generated file is refreshed from schema.
  const client = supabase as unknown as OpponentPreparationRpcClient;
  const { data, error } = await client.rpc(name, args);
  if (error) throw new Error(error.message || "The opponent-preparation request was denied.");
  return data;
}
