import { useMemo, useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ScrimBlock } from "@/hooks/useScrimBlock";
import { useScrimBlock } from "@/hooks/useScrimBlock";
import { recordedGameScore, type ResultSource } from "@/lib/scrim-review";
import type { ScrimGame } from "@/types/scrimGame";

export function BlockReviewDialog({
  block,
  games,
  trigger,
}: {
  block: ScrimBlock;
  games: ScrimGame[];
  trigger: ReactNode;
}) {
  const { finalizeReview, isFinalizing } = useScrimBlock(block.id);
  const recorded = useMemo(() => recordedGameScore(games), [games]);
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<ResultSource>(
    block.result_source === "manual" ? "manual" : "games",
  );
  const [ourScore, setOurScore] = useState(String(block.our_score ?? recorded.wins));
  const [opponentScore, setOpponentScore] = useState(
    String(block.opponent_score ?? recorded.losses),
  );
  const [reason, setReason] = useState(block.result_override_reason || "");

  const manualDiffers =
    source === "manual" &&
    (Number(ourScore) !== recorded.wins || Number(opponentScore) !== recorded.losses);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await finalizeReview({
        resultSource: source,
        ourScore: source === "manual" ? Number(ourScore) : null,
        opponentScore: source === "manual" ? Number(opponentScore) : null,
        overrideReason: source === "manual" ? reason.trim() || null : null,
      });
      setOpen(false);
    } catch {
      // The hook presents exact missing fields or override requirements.
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Complete block review</DialogTitle>
          <DialogDescription>
            Every active game must include an outcome, side, rating, and performance summary.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="border border-[var(--workspace-rule)] bg-white/[0.025] p-4">
            <p className="workspace-eyebrow">Recorded game outcomes</p>
            <p className="ss-mono mt-2 text-2xl">{recorded.wins}–{recorded.losses}</p>
            <p className="mt-1 text-sm text-[var(--workspace-muted)]">
              {recorded.recorded} games currently have explicit outcomes.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="block-result-source">Final score source</Label>
            <Select value={source} onValueChange={(value) => setSource(value as ResultSource)}>
              <SelectTrigger id="block-result-source"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="games">Use recorded game outcomes</SelectItem>
                <SelectItem value="manual">Staff correction</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {source === "manual" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="block-our-score">Our score</Label>
                  <Input id="block-our-score" type="number" min={0} value={ourScore} onChange={(event) => setOurScore(event.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="block-opponent-score">Opponent score</Label>
                  <Input id="block-opponent-score" type="number" min={0} value={opponentScore} onChange={(event) => setOpponentScore(event.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="block-override-reason">
                  Correction reason{manualDiffers ? " *" : ""}
                </Label>
                <Textarea
                  id="block-override-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Explain missing, remade, or excluded games."
                />
              </div>
            </>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isFinalizing || (manualDiffers && !reason.trim())}>
              {isFinalizing ? "Completing…" : "Complete review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
