
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Clock, User, MessageSquare, Edit2, Trash2, Save, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCoachFeedback } from '@/hooks/useCoachFeedback';
import { useScrimGames } from '@/hooks/useScrimGames';
import type { ScrimGame, ScrimParticipant, CoachFeedback as CoachFeedbackType } from '@/types/scrimGame';

interface CoachFeedbackComponentProps {
  game: ScrimGame;
  participants: ScrimParticipant[];
}

type FeedbackPriority = 'low' | 'medium' | 'high';

// Helper function to get our team participants
const getOurTeamParticipants = (participants: ScrimParticipant[]) => {
  return participants.filter(p => p.is_our_team);
};

export const CoachFeedback: React.FC<CoachFeedbackComponentProps> = ({
  game,
  participants,
}) => {
  const { user } = useAuth();
  const { feedback, createFeedback, updateFeedback, deleteFeedback, isCreating, isUpdating, isDeleting } = useCoachFeedback(game.id);
  const { updateScrimGame } = useScrimGames(game.scrim_id);
  const [isCreatingFeedback, setIsCreatingFeedback] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<string | null>(null);
  const [gameNotes, setGameNotes] = useState(game.coaching_notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [newFeedback, setNewFeedback] = useState({
    feedback_type: 'general',
    player_name: 'all_players',
    title: '',
    content: '',
    priority: 'medium' as FeedbackPriority,
    tags: [] as string[],
    is_during_game: false,
    timestamp_seconds: undefined as number | undefined
  });
  const [editFormData, setEditFormData] = useState<{
    feedback_type: string;
    player_name: string;
    title: string;
    content: string;
    priority: FeedbackPriority;
    tags: string[];
    is_during_game: boolean;
    timestamp_seconds?: number;
  }>({
    feedback_type: 'general',
    player_name: 'all_players',
    title: '',
    content: '',
    priority: 'medium',
    tags: [],
    is_during_game: false,
    timestamp_seconds: undefined
  });

  const ourTeamParticipants = getOurTeamParticipants(participants);

  const handleCreateFeedback = () => {
    if (!user || !newFeedback.content.trim()) return;

    const playerNameForSave = newFeedback.player_name === 'all_players' ? null : newFeedback.player_name;
    console.log('Creating feedback with player_name:', playerNameForSave);

    createFeedback({
      scrim_game_id: game.id,
      coach_id: user.id,
      feedback_type: newFeedback.feedback_type,
      player_name: playerNameForSave,
      title: newFeedback.title,
      content: newFeedback.content,
      priority: newFeedback.priority,
      tags: newFeedback.tags.filter(tag => tag.trim()),
      is_during_game: newFeedback.is_during_game,
      timestamp_seconds: newFeedback.timestamp_seconds
    });

    setNewFeedback({
      feedback_type: 'general',
      player_name: 'all_players',
      title: '',
      content: '',
      priority: 'medium',
      tags: [],
      is_during_game: false,
      timestamp_seconds: undefined
    });
    setIsCreatingFeedback(false);
  };

  const handleEditFeedback = (item: CoachFeedbackType) => {
    console.log('Editing feedback item:', item);
    
    setEditingFeedback(item.id);
    setEditFormData({
      feedback_type: item.feedback_type,
      player_name: item.player_name || 'all_players',
      title: item.title || '',
      content: item.content,
      priority: item.priority as FeedbackPriority,
      tags: item.tags || [],
      is_during_game: item.is_during_game,
      timestamp_seconds: item.timestamp_seconds || undefined
    });
  };

  const handleUpdateFeedback = (feedbackId: string) => {
    if (!editFormData.content.trim()) return;

    const playerNameForSave = editFormData.player_name === 'all_players' ? null : editFormData.player_name;
    console.log('Updating feedback with player_name:', playerNameForSave);

    updateFeedback({
      id: feedbackId,
      feedback_type: editFormData.feedback_type,
      player_name: playerNameForSave,
      title: editFormData.title,
      content: editFormData.content,
      priority: editFormData.priority,
      tags: editFormData.tags.filter(tag => tag.trim()),
      is_during_game: editFormData.is_during_game,
      timestamp_seconds: editFormData.timestamp_seconds
    });

    setEditingFeedback(null);
  };

  const handleCancelEdit = () => {
    setEditingFeedback(null);
    setEditFormData({
      feedback_type: 'general',
      player_name: 'all_players',
      title: '',
      content: '',
      priority: 'medium',
      tags: [],
      is_during_game: false,
      timestamp_seconds: undefined
    });
  };

  const handleDeleteFeedback = (feedbackId: string) => {
    if (confirm('Are you sure you want to delete this feedback?')) {
      deleteFeedback(feedbackId);
    }
  };

  const handleSaveGameNotes = async () => {
    setIsSavingNotes(true);
    try {
      await updateScrimGame({
        id: game.id,
        coaching_notes: gameNotes
      });
    } catch (error) {
      console.error('Failed to save game notes:', error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const formatTimestamp = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'medium': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      case 'low': return 'text-green-400 border-green-500/30 bg-green-500/10';
      default: return 'text-muted-foreground';
    }
  };

  const renderFeedbackForm = (
    data: typeof newFeedback | typeof editFormData,
    setData: typeof setNewFeedback | typeof setEditFormData,
    onSubmit: () => void,
    onCancel: () => void,
    isLoading: boolean,
    submitLabel: string
  ) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="feedbackType">Feedback Type</Label>
          <Select 
            value={data.feedback_type} 
            onValueChange={(value) => setData(prev => ({...prev, feedback_type: value}))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="strategy">Strategy</SelectItem>
              <SelectItem value="mechanical">Mechanical</SelectItem>
              <SelectItem value="positioning">Positioning</SelectItem>
              <SelectItem value="communication">Communication</SelectItem>
              <SelectItem value="macro">Macro Play</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="player">Player (Optional)</Label>
          <Select 
            value={data.player_name} 
            onValueChange={(value) => setData(prev => ({...prev, player_name: value}))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select player..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_players">All Players</SelectItem>
              {ourTeamParticipants.map(participant => (
                <SelectItem key={participant.id} value={participant.summoner_name}>
                  {participant.summoner_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select 
            value={data.priority} 
            onValueChange={(value: FeedbackPriority) => setData(prev => ({...prev, priority: value}))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="timestamp">Game Time (Optional)</Label>
          <Input
            id="timestamp"
            type="number"
            placeholder="Seconds..."
            value={data.timestamp_seconds || ''}
            onChange={(e) => setData(prev => ({
              ...prev, 
              timestamp_seconds: e.target.value ? parseInt(e.target.value) : undefined
            }))}
          />
        </div>
        <div>
          <Label htmlFor="duringGame">Timing</Label>
          <Select 
            value={data.is_during_game.toString()} 
            onValueChange={(value) => setData(prev => ({...prev, is_during_game: value === 'true'}))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">Post-Game</SelectItem>
              <SelectItem value="true">During Game</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="title">Title (Optional)</Label>
        <Input
          id="title"
          value={data.title}
          onChange={(e) => setData(prev => ({...prev, title: e.target.value}))}
          placeholder="Brief summary of the feedback..."
        />
      </div>

      <div>
        <Label htmlFor="content">Feedback Content</Label>
        <Textarea
          id="content"
          value={data.content}
          onChange={(e) => setData(prev => ({...prev, content: e.target.value}))}
          placeholder="Detailed feedback and suggestions..."
          rows={4}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={onSubmit} disabled={!data.content.trim() || isLoading}>
          {submitLabel}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Create New Feedback */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Coach Feedback
            </CardTitle>
            <Button 
              onClick={() => setIsCreatingFeedback(!isCreatingFeedback)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Feedback
            </Button>
          </div>
        </CardHeader>
        {isCreatingFeedback && (
          <CardContent>
            {renderFeedbackForm(
              newFeedback,
              setNewFeedback,
              handleCreateFeedback,
              () => setIsCreatingFeedback(false),
              isCreating,
              'Save Feedback'
            )}
          </CardContent>
        )}
      </Card>

      {/* Feedback List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>
            Feedback History
            <Badge variant="outline" className="ml-2">
              {feedback.length} {feedback.length === 1 ? 'note' : 'notes'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {feedback.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No feedback recorded yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start adding coaching notes and feedback for this game
                  </p>
                </div>
              ) : (
                feedback.map((item) => (
                  <div key={item.id} className="p-4 rounded border border-border/50 hover:bg-muted/10 transition-colors">
                    {editingFeedback === item.id ? (
                      renderFeedbackForm(
                        editFormData,
                        setEditFormData,
                        () => handleUpdateFeedback(item.id),
                        handleCancelEdit,
                        isUpdating,
                        'Update Feedback'
                      )
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getPriorityColor(item.priority)}>
                              {item.priority}
                            </Badge>
                            <Badge variant="secondary">
                              {item.feedback_type}
                            </Badge>
                            {item.is_during_game && (
                              <Badge variant="outline" className="text-xs">
                                Live
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              {item.timestamp_seconds && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTimestamp(item.timestamp_seconds)}
                                </span>
                              )}
                              <span>
                                {new Date(item.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleEditFeedback(item)}
                                className="h-6 w-6 p-0"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleDeleteFeedback(item.id)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {item.title && (
                          <h4 className="font-medium mb-1">{item.title}</h4>
                        )}

                        <p className="text-sm mb-2">{item.content}</p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {item.player_name && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {item.player_name}
                              </span>
                            )}
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex gap-1">
                                {item.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Overall Coaching Notes */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Overall Game Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              value={gameNotes}
              onChange={(e) => setGameNotes(e.target.value)}
              placeholder="Add overall coaching notes and summary for this game..."
              rows={4}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                These notes provide an overall summary and coaching insights for the entire game.
              </p>
              <Button 
                onClick={handleSaveGameNotes}
                disabled={isSavingNotes || gameNotes === (game.coaching_notes || '')}
                size="sm"
              >
                <Save className="h-4 w-4 mr-1" />
                {isSavingNotes ? 'Saving...' : 'Save Notes'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
