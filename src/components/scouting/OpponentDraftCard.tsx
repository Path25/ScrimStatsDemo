import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Calendar, Trophy, Clock, Swords } from "lucide-react";
import { ChampionAvatar } from "@/components/scrims/ChampionAvatar";

interface OpponentDraft {
  id: string;
  opponent_team_id: string;
  opponent_name: string;
  match_date: string;
  our_side: string | null;
  result: string | null;
  patch_version: string | null;
  tournament_context: string | null;
  game_duration: number | null;
  draft_data: any;
  notes: string | null;
}

interface OpponentDraftCardProps {
  draft: OpponentDraft;
  onEdit: (draft: OpponentDraft) => void;
  onDelete: (id: string) => void;
  onView: (draft: OpponentDraft) => void;
}

const getResultColor = (result: string | null) => {
  switch (result?.toLowerCase()) {
    case 'win':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'loss':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'unknown':
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getSideColor = (side: string | null) => {
  switch (side?.toLowerCase()) {
    case 'blue':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'red':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export function OpponentDraftCard({ draft, onEdit, onDelete, onView }: OpponentDraftCardProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const enemyPicks = draft.draft_data?.picks?.enemy_picks || [];
  const displayPicks = enemyPicks.slice(0, 3); // Show first 3 champions

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onView(draft)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{draft.opponent_name}</CardTitle>
              {draft.result && (
                <Badge
                  variant="outline"
                  className={getResultColor(draft.result)}
                >
                  {draft.result.toUpperCase()}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(draft.match_date).toLocaleDateString()}
              {draft.patch_version && (
                <>
                  <span>•</span>
                  <span>Patch {draft.patch_version}</span>
                </>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit(draft);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(draft.id);
                }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {draft.our_side && (
              <Badge
                variant="outline"
                className={getSideColor(draft.our_side)}
              >
                {draft.our_side} side
              </Badge>
            )}
            {draft.tournament_context && (
              <Badge variant="secondary">{draft.tournament_context}</Badge>
            )}
          </div>
          {draft.game_duration && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDuration(draft.game_duration)}
            </div>
          )}
        </div>

        {displayPicks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Swords className="h-3 w-3" />
              Enemy Picks
            </div>
            <div className="flex items-center gap-2">
              {displayPicks.map((champion, index) => (
                <ChampionAvatar
                  key={index}
                  championName={champion}
                  size="sm"
                />
              ))}
              {enemyPicks.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{enemyPicks.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {draft.notes && (
          <div className="text-xs text-muted-foreground line-clamp-2">
            {draft.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}