import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Star } from "lucide-react";

interface OpponentPlaystyleTag {
  id: string;
  opponent_team_id?: string;
  opponent_player_id?: string;
  tag_name: string;
  tag_type: string;
  confidence_level: number;
  notes?: string;
  created_at: string;
}

interface OpponentPlaystyleTagCardProps {
  tag: OpponentPlaystyleTag;
  onEdit: (tag: OpponentPlaystyleTag) => void;
  onDelete: (id: string) => void;
}

const getTagTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'strength':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'weakness':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'playstyle':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'tendency':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'strategy':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getConfidenceStars = (level: number) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`h-3 w-3 ${
        i < level ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
      }`}
    />
  ));
};

export function OpponentPlaystyleTagCard({ tag, onEdit, onDelete }: OpponentPlaystyleTagCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={getTagTypeColor(tag.tag_type)}
              >
                {tag.tag_type}
              </Badge>
              <div className="flex items-center gap-1">
                {getConfidenceStars(tag.confidence_level)}
              </div>
            </div>
            <CardTitle className="text-base">{tag.tag_name}</CardTitle>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(tag)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(tag.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      {tag.notes && (
        <CardContent>
          <div className="text-sm">
            <p className="text-muted-foreground">{tag.notes}</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}