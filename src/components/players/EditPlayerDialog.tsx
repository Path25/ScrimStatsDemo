import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { usePlayersData } from "@/hooks/usePlayersData";
import type { Database } from "@/integrations/supabase/types";
import {
  championPoolFromJson,
  normalizeChampionPool,
  normalizeOptionalText,
  normalizeRequiredName,
  UNSET_ROSTER_VALUE,
} from "@/lib/roster-profile";

type Player = Database["public"]["Tables"]["players"]["Row"];

const roles = ["top", "jungle", "mid", "adc", "support"];
const regions = ["EUW", "EUNE", "NA", "KR", "BR", "LAN", "LAS", "OCE", "TR", "RU", "JP"];

export function EditPlayerDialog({
  player,
  open,
  onOpenChange,
}: {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { savePlayerProfile, isUpdating } = usePlayersData();
  const [form, setForm] = useState({
    summonerName: "",
    riotId: "",
    tagLine: "",
    region: "",
    role: "",
    champions: "",
    discordUsername: "",
    notes: "",
  });

  useEffect(() => {
    if (!player) return;
    setForm({
      summonerName: player.summoner_name || "",
      riotId: player.riot_id || "",
      tagLine: player.riot_tag_line || "",
      region: player.region || "",
      role: player.role || "",
      champions: championPoolFromJson(player.main_champions).join(", "),
      discordUsername: player.discord_username || "",
      notes: player.notes || "",
    });
  }, [player]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const summonerName = normalizeRequiredName(form.summonerName);
    if (!player || !summonerName) return;
    savePlayerProfile(
      {
        id: player.id,
        summonerName,
        riotId: normalizeOptionalText(form.riotId) || "",
        tagLine: normalizeOptionalText(form.tagLine) || "",
        region: normalizeOptionalText(form.region)?.toUpperCase() || "",
        role: normalizeOptionalText(form.role) || "",
        champions: normalizeChampionPool(form.champions),
        discordUsername: normalizeOptionalText(form.discordUsername),
        notes: normalizeOptionalText(form.notes),
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isUpdating) onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit roster profile</DialogTitle>
          <DialogDescription>
            Keep the player identity and coaching profile accurate for schedules and reviews.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-display-name">Display name</Label>
            <Input
              id="edit-display-name"
              value={form.summonerName}
              onChange={(event) => setForm({ ...form, summonerName: event.target.value })}
              maxLength={80}
              autoFocus
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
            <div className="grid gap-2">
              <Label htmlFor="edit-riot-id">Riot ID</Label>
              <Input
                id="edit-riot-id"
                value={form.riotId}
                onChange={(event) => setForm({ ...form, riotId: event.target.value })}
                maxLength={80}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-tagline">Tagline</Label>
              <Input
                id="edit-tagline"
                value={form.tagLine}
                onChange={(event) => setForm({ ...form, tagLine: event.target.value })}
                maxLength={12}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-region">Server</Label>
              <Select
                value={form.region || UNSET_ROSTER_VALUE}
                onValueChange={(region) => setForm({ ...form, region: region === UNSET_ROSTER_VALUE ? "" : region })}
              >
                <SelectTrigger id="edit-region"><SelectValue placeholder="Not recorded" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSET_ROSTER_VALUE}>Not recorded</SelectItem>
                  {regions.map((region) => <SelectItem key={region} value={region}>{region}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Primary role</Label>
              <Select
                value={form.role || UNSET_ROSTER_VALUE}
                onValueChange={(role) => setForm({ ...form, role: role === UNSET_ROSTER_VALUE ? "" : role })}
              >
                <SelectTrigger id="edit-role"><SelectValue placeholder="Not recorded" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSET_ROSTER_VALUE}>Not recorded</SelectItem>
                  {roles.map((role) => <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-champions">Champion pool</Label>
            <Input
              id="edit-champions"
              value={form.champions}
              onChange={(event) => setForm({ ...form, champions: event.target.value })}
              placeholder="Comma-separated champions"
              maxLength={240}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-discord">Discord username</Label>
            <Input
              id="edit-discord"
              value={form.discordUsername}
              onChange={(event) => setForm({ ...form, discordUsername: event.target.value })}
              maxLength={80}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-notes">Private staff notes</Label>
            <Textarea
              id="edit-notes"
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              maxLength={2000}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating || !form.summonerName.trim()}>
              {isUpdating ? "Saving..." : "Save profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
