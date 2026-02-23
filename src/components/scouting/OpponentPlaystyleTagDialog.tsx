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
import { useCreateOpponentPlaystyleTag, useUpdateOpponentPlaystyleTag } from "@/hooks/useOpponentPlaystyleTags";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const playstyleTagSchema = z.object({
  tag_name: z.string().min(1, "Tag name is required"),
  tag_type: z.enum(["strength", "weakness", "playstyle", "tendency", "strategy"]),
  confidence_level: z.number().min(1).max(5),
  notes: z.string().optional(),
});

type PlaystyleTagFormData = z.infer<typeof playstyleTagSchema>;

interface OpponentPlaystyleTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opponentTeamId?: string;
  opponentPlayerId?: string;
  tag?: any;
}

const tagTypeOptions = [
  { value: "strength", label: "Strength" },
  { value: "weakness", label: "Weakness" },
  { value: "playstyle", label: "Playstyle" },
  { value: "tendency", label: "Tendency" },
  { value: "strategy", label: "Strategy" },
];

export function OpponentPlaystyleTagDialog({ 
  open, 
  onOpenChange, 
  opponentTeamId,
  opponentPlayerId,
  tag 
}: OpponentPlaystyleTagDialogProps) {
  const [confidenceLevel, setConfidenceLevel] = useState(5);
  const { user } = useAuth();
  const createMutation = useCreateOpponentPlaystyleTag();
  const updateMutation = useUpdateOpponentPlaystyleTag();
  
  const form = useForm<PlaystyleTagFormData>({
    resolver: zodResolver(playstyleTagSchema),
    defaultValues: {
      tag_name: "",
      tag_type: "playstyle",
      confidence_level: 5,
      notes: "",
    },
  });

  useEffect(() => {
    if (tag) {
      form.reset({
        tag_name: tag.tag_name,
        tag_type: tag.tag_type,
        confidence_level: tag.confidence_level,
        notes: tag.notes || "",
      });
      setConfidenceLevel(tag.confidence_level);
    } else {
      form.reset({
        tag_name: "",
        tag_type: "playstyle",
        confidence_level: 5,
        notes: "",
      });
      setConfidenceLevel(5);
    }
  }, [tag, form, open]);

  const onSubmit = async (data: PlaystyleTagFormData) => {
    if (!user?.id) return;

    try {
      const tagData = {
        ...data,
        confidence_level: confidenceLevel,
        created_by: user.id,
        opponent_team_id: opponentTeamId || null,
        opponent_player_id: opponentPlayerId || null,
      };

      if (tag) {
        await updateMutation.mutateAsync({
          id: tag.id,
          updates: tagData,
        });
        toast("Playstyle tag updated successfully");
      } else {
        await createMutation.mutateAsync(tagData);
        toast("Playstyle tag added successfully");
      }

      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast("Error saving playstyle tag");
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
            {tag ? "Edit Playstyle Tag" : "Add Playstyle Tag"}
          </DialogTitle>
          <DialogDescription>
            Add behavioral and strategic insights about the {opponentPlayerId ? "player" : "team"}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tag_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Aggressive Early Game" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tag_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tag type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tagTypeOptions.map((option) => (
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

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details and observations..."
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
                {tag ? "Update" : "Add"} Tag
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}