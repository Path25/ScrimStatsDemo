import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCreateOpponentChampionPool, useUpdateOpponentChampionPool } from "@/hooks/useOpponentChampionPools";
import { toast } from "sonner";
import { Star } from "lucide-react";

const championPoolSchema = z.object({
  champion_name: z.string().min(1, "Champion name is required"),
  pool_type: z.enum(["main", "comfort", "pocket", "situational"]),
  confidence_level: z.number().min(1).max(5),
  games_played: z.number().min(0).default(0),
  win_rate: z.number().min(0).max(1).nullable().optional(),
  notes: z.string().optional(),
});

type ChampionPoolFormData = z.infer<typeof championPoolSchema>;

interface OpponentChampionPoolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opponentPlayerId: string;
  championPool?: any;
}

const poolTypeOptions = [
  { value: "main", label: "Main Pick" },
  { value: "comfort", label: "Comfort Pick" },
  { value: "pocket", label: "Pocket Pick" },
  { value: "situational", label: "Situational" },
];

export function OpponentChampionPoolDialog({ 
  open, 
  onOpenChange, 
  opponentPlayerId,
  championPool 
}: OpponentChampionPoolDialogProps) {
  const [confidenceLevel, setConfidenceLevel] = useState(5);
  const createMutation = useCreateOpponentChampionPool();
  const updateMutation = useUpdateOpponentChampionPool();
  
  const form = useForm<ChampionPoolFormData>({
    resolver: zodResolver(championPoolSchema),
    defaultValues: {
      champion_name: "",
      pool_type: "main",
      confidence_level: 5,
      games_played: 0,
      win_rate: null,
      notes: "",
    },
  });

  useEffect(() => {
    if (championPool) {
      form.reset({
        champion_name: championPool.champion_name,
        pool_type: championPool.pool_type,
        confidence_level: championPool.confidence_level,
        games_played: championPool.games_played || 0,
        win_rate: championPool.win_rate,
        notes: championPool.notes || "",
      });
      setConfidenceLevel(championPool.confidence_level);
    } else {
      form.reset({
        champion_name: "",
        pool_type: "main",
        confidence_level: 5,
        games_played: 0,
        win_rate: null,
        notes: "",
      });
      setConfidenceLevel(5);
    }
  }, [championPool, form, open]);

  const onSubmit = async (data: ChampionPoolFormData) => {
    try {
      const championPoolData = {
        ...data,
        opponent_player_id: opponentPlayerId,
        confidence_level: confidenceLevel,
      };

      if (championPool) {
        await updateMutation.mutateAsync({
          id: championPool.id,
          updates: championPoolData,
        });
        toast("Champion pool updated successfully");
      } else {
        await createMutation.mutateAsync(championPoolData);
        toast("Champion pool added successfully");
      }

      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast("Error saving champion pool");
    }
  };

  const renderStarRating = () => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-5 w-5 cursor-pointer transition-colors ${
              i < confidenceLevel
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground hover:text-yellow-300'
            }`}
            onClick={() => {
              setConfidenceLevel(i + 1);
              form.setValue('confidence_level', i + 1);
            }}
          />
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {confidenceLevel}/5 confidence
        </span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {championPool ? "Edit Champion Pool" : "Add Champion Pool"}
          </DialogTitle>
          <DialogDescription>
            Track opponent champion performance and pool preferences.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="champion_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Champion Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Aatrox" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pool_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pool Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pool type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {poolTypeOptions.map((option) => (
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

            <div className="space-y-2">
              <Label>Confidence Level</Label>
              {renderStarRating()}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="games_played"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Games Played</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="win_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Win Rate (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        max="100"
                        placeholder="e.g., 75"
                        {...field}
                        value={field.value ? Math.round(field.value * 100) : ""}
                        onChange={(e) => {
                          const percentage = parseInt(e.target.value);
                          field.onChange(percentage ? percentage / 100 : null);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Playstyle notes, strengths, weaknesses..."
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
                {championPool ? "Update" : "Add"} Champion Pool
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}