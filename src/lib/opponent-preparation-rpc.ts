import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PublicFunctions = Database["public"]["Functions"];
type OpponentPreparationRpcName = Extract<
  keyof PublicFunctions,
  `${string}opponent_preparation${string}`
>;

export async function callOpponentPreparationRpc<Name extends OpponentPreparationRpcName>(
  name: Name,
  args: PublicFunctions[Name]["Args"],
) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(error.message || "The opponent-preparation request was denied.");
  return data;
}
