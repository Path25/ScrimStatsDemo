import { supabase } from "@/integrations/supabase/client";

type RpcError = { message?: string } | null;
type RpcResponse = { data: unknown; error: RpcError };
type PracticeRpcClient = {
  rpc: (name: string, args: Record<string, unknown>) => PromiseLike<RpcResponse>;
};

export async function callPracticeDevelopmentRpc(name: string, args: Record<string, unknown>) {
  // These RPCs are introduced by the WO-033 migration. Keep this narrow cast until
  // the generated Supabase types are regenerated from the migrated database.
  const client = supabase as unknown as PracticeRpcClient;
  const { data, error } = await client.rpc(name, args);
  if (error) throw new Error(error.message || "The practice-development request was denied.");
  return data;
}
