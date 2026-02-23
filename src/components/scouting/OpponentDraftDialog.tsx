import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCreateOpponentDraft, useUpdateOpponentDraft } from "@/hooks/useOpponentDrafts";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const opponentDraftSchema = z.object({
  opponent_name: z.string().min(1, "Opponent name is required"),
  match_date: z.date(),
  our_side: z.enum(["blue", "red"]).optional(),
  result: z.enum(["win", "loss", "unknown"]).optional(),
  patch_version: z.string().optional(),
  tournament_context: z.string().optional(),
  game_duration: z.number().min(0).optional(),
  notes: z.string().optional(),
});

type OpponentDraftFormData = z.infer<typeof opponentDraftSchema>;

interface OpponentDraftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opponentTeamId: string;
  draft?: any;
}

const sideOptions = [
  { value: "blue", label: "Blue Side" },
  { value: "red", label: "Red Side" },
];

const resultOptions = [
  { value: "win", label: "Win" },
  { value: "loss", label: "Loss" },
  { value: "unknown", label: "Unknown" },
];

export function OpponentDraftDialog({ 
  open, 
  onOpenChange, 
  opponentTeamId,
  draft 
}: OpponentDraftDialogProps) {
  const { user } = useAuth();
  const [ourPicks, setOurPicks] = useState<string[]>([]);
  const [enemyPicks, setEnemyPicks] = useState<string[]>([]);
  const [ourBans, setOurBans] = useState<string[]>([]);
  const [enemyBans, setEnemyBans] = useState<string[]>([]);
  
  const createMutation = useCreateOpponentDraft();
  const updateMutation = useUpdateOpponentDraft();
  
  const form = useForm<OpponentDraftFormData>({
    resolver: zodResolver(opponentDraftSchema),
    defaultValues: {
      opponent_name: "",
      match_date: new Date(),
      our_side: undefined,
      result: undefined,
      patch_version: "",
      tournament_context: "",
      game_duration: undefined,
      notes: "",
    },
  });

  useEffect(() => {
    if (draft) {
      form.reset({
        opponent_name: draft.opponent_name,
        match_date: new Date(draft.match_date),
        our_side: draft.our_side || undefined,
        result: draft.result || undefined,
        patch_version: draft.patch_version || "",
        tournament_context: draft.tournament_context || "",
        game_duration: draft.game_duration || undefined,
        notes: draft.notes || "",
      });
      
      const draftData = draft.draft_data || {};
      setOurPicks(draftData.picks?.our_picks || []);
      setEnemyPicks(draftData.picks?.enemy_picks || []);
      setOurBans(draftData.bans?.our_bans || []);
      setEnemyBans(draftData.bans?.enemy_bans || []);
    } else {
      form.reset({
        opponent_name: "",
        match_date: new Date(),
        our_side: undefined,
        result: undefined,
        patch_version: "",
        tournament_context: "",
        game_duration: undefined,
        notes: "",
      });
      setOurPicks([]);
      setEnemyPicks([]);
      setOurBans([]);
      setEnemyBans([]);
    }
  }, [draft, form, open]);

  const onSubmit = async (data: OpponentDraftFormData) => {
    if (!user?.id) return;

    try {
      const draftData = {
        ...data,
        opponent_team_id: opponentTeamId,
        created_by: user.id,
        draft_data: {
          picks: {
            our_picks: ourPicks,
            enemy_picks: enemyPicks,
          },
          bans: {
            our_bans: ourBans,
            enemy_bans: enemyBans,
          },
          draft_order: [], // Could be expanded later
        },
      };

      if (draft) {
        await updateMutation.mutateAsync({
          id: draft.id,
          updates: draftData,
        });
        toast("Draft updated successfully");
      } else {
        await createMutation.mutateAsync(draftData);
        toast("Draft added successfully");
      }

      onOpenChange(false);
    } catch (error) {
      toast("Error saving draft");
    }
  };

  const addChampion = (list: string[], setList: (list: string[]) => void, champion: string) => {
    if (champion && !list.includes(champion)) {
      setList([...list, champion]);
    }
  };

  const removeChampion = (list: string[], setList: (list: string[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  const ChampionInput = ({ 
    label, 
    list, 
    setList, 
    maxCount = 5 
  }: { 
    label: string; 
    list: string[]; 
    setList: (list: string[]) => void; 
    maxCount?: number; 
  }) => {
    const [inputValue, setInputValue] = useState("");

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Champion name"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (list.length < maxCount) {
                  addChampion(list, setList, inputValue);
                  setInputValue("");
                }
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (list.length < maxCount) {
                addChampion(list, setList, inputValue);
                setInputValue("");
              }
            }}
            disabled={list.length >= maxCount}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {list.map((champion, index) => (
            <div
              key={index}
              className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm"
            >
              {champion}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={() => removeChampion(list, setList, index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {draft ? "Edit Draft" : "Add Draft"}
          </DialogTitle>
          <DialogDescription>
            Track opponent draft patterns and match results for strategic analysis.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="opponent_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opponent Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Team or player name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="match_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="our_side"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Our Side</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select side" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sideOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="result"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Result</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select result" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {resultOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="patch_version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patch Version</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 14.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tournament_context"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tournament/Context</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Scrimmage, Tournament" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="game_duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Duration (seconds)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="e.g., 1800"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Draft Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ChampionInput
                  label="Our Picks"
                  list={ourPicks}
                  setList={setOurPicks}
                />
                <ChampionInput
                  label="Enemy Picks"
                  list={enemyPicks}
                  setList={setEnemyPicks}
                />
                <ChampionInput
                  label="Our Bans"
                  list={ourBans}
                  setList={setOurBans}
                />
                <ChampionInput
                  label="Enemy Bans"
                  list={enemyBans}
                  setList={setEnemyBans}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Strategic insights, patterns observed, key moments..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {draft ? "Update" : "Add"} Draft
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}