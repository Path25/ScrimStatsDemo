
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, Square, Plus, Minus, Timer, Trophy, Target } from 'lucide-react';
import { useLiveGameData } from '@/hooks/useLiveGameData';
import { useScrimParticipants } from '@/hooks/useScrimParticipants';
import { useScrimGames } from '@/hooks/useScrimGames';
import { toast } from 'sonner';

interface LiveGameTrackerProps {
  gameId: string;
  onGameEnd?: () => void;
}

export const LiveGameTracker: React.FC<LiveGameTrackerProps> = ({ gameId, onGameEnd }) => {
  const [isLive, setIsLive] = useState(false);
  const [gameTimeSeconds, setGameTimeSeconds] = useState(0);
  const [blueKills, setBlueKills] = useState(0);
  const [redKills, setRedKills] = useState(0);
  const [blueGold, setBlueGold] = useState(0);
  const [redGold, setRedGold] = useState(0);
  const [objectives, setObjectives] = useState({
    blue_dragons: 0,
    red_dragons: 0,
    blue_barons: 0,
    red_barons: 0,
    blue_towers: 0,
    red_towers: 0
  });

  const { liveData, latestLiveData, createLiveData, isCreating } = useLiveGameData(gameId, isLive);
  const { participants } = useScrimParticipants(gameId);
  const { updateScrimGame } = useScrimGames();

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(() => {
        setGameTimeSeconds(prev => prev + 1);
        
        // Auto-save every 30 seconds
        if (gameTimeSeconds % 30 === 0 && gameTimeSeconds > 0) {
          saveCurrentState();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLive, gameTimeSeconds]);

  // Update state from latest live data
  useEffect(() => {
    if (latestLiveData) {
      setGameTimeSeconds(latestLiveData.game_time_seconds);
      setBlueKills(latestLiveData.blue_team_kills || 0);
      setRedKills(latestLiveData.red_team_kills || 0);
      setBlueGold(latestLiveData.blue_team_gold || 0);
      setRedGold(latestLiveData.red_team_gold || 0);
      
      // Update objectives if available
      if (latestLiveData.objectives_state) {
        setObjectives(prev => ({
          ...prev,
          ...latestLiveData.objectives_state
        }));
      }
    }
  }, [latestLiveData]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartGame = () => {
    setIsLive(true);
    setGameTimeSeconds(0);
    updateScrimGame({
      id: gameId,
      status: 'in_progress',
      game_start_time: new Date().toISOString()
    });
    toast.success('Game tracking started!');
  };

  const handlePauseGame = () => {
    setIsLive(false);
    saveCurrentState();
    toast.info('Game tracking paused');
  };

  const handleEndGame = async () => {
    setIsLive(false);
    
    // Determine winner based on kills
    const ourTeamWon = blueKills > redKills;
    const result = ourTeamWon ? 'win' : 'loss';
    
    // Save final state
    await saveCurrentState();
    
    // Update game as completed
    updateScrimGame({
      id: gameId,
      status: 'completed',
      result: result,
      duration_seconds: gameTimeSeconds,
      game_end_time: new Date().toISOString(),
      our_team_kills: blueKills,
      enemy_team_kills: redKills,
      our_team_gold: blueGold,
      enemy_team_gold: redGold,
      objectives: {
        dragons: [
          ...Array(objectives.blue_dragons).fill({ team: 'our', timestamp: gameTimeSeconds }),
          ...Array(objectives.red_dragons).fill({ team: 'enemy', timestamp: gameTimeSeconds })
        ],
        barons: [
          ...Array(objectives.blue_barons).fill({ team: 'our', timestamp: gameTimeSeconds }),
          ...Array(objectives.red_barons).fill({ team: 'enemy', timestamp: gameTimeSeconds })
        ],
        towers: [
          ...Array(objectives.blue_towers).fill({ team: 'our', timestamp: gameTimeSeconds }),
          ...Array(objectives.red_towers).fill({ team: 'enemy', timestamp: gameTimeSeconds })
        ],
        inhibitors: []
      }
    });
    
    onGameEnd?.();
    toast.success(`Game ended! Result: ${result.toUpperCase()}`);
  };

  const saveCurrentState = () => {
    createLiveData({
      scrim_game_id: gameId,
      game_time_seconds: gameTimeSeconds,
      blue_team_kills: blueKills,
      red_team_kills: redKills,
      blue_team_gold: blueGold,
      red_team_gold: redGold,
      objectives_state: objectives,
      data_source: 'manual'
    });
  };

  const adjustKills = (team: 'blue' | 'red', increment: number) => {
    if (team === 'blue') {
      setBlueKills(Math.max(0, blueKills + increment));
    } else {
      setRedKills(Math.max(0, redKills + increment));
    }
  };

  const adjustGold = (team: 'blue' | 'red', increment: number) => {
    if (team === 'blue') {
      setBlueGold(Math.max(0, blueGold + increment));
    } else {
      setRedGold(Math.max(0, redGold + increment));
    }
  };

  const adjustObjective = (objective: string, team: 'blue' | 'red', increment: number) => {
    const key = `${team}_${objective}` as keyof typeof objectives;
    setObjectives(prev => ({
      ...prev,
      [key]: Math.max(0, prev[key] + increment)
    }));
  };

  const ourTeamParticipants = participants.filter(p => p.is_our_team);
  const enemyTeamParticipants = participants.filter(p => !p.is_our_team);
  const killDifference = blueKills - redKills;
  const goldDifference = blueGold - redGold;

  return (
    <div className="space-y-6">
      {/* Game Timer and Status */}
      <Card className="glass-card">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-4">
            <Timer className="w-6 h-6 text-electric-500" />
            <CardTitle className="text-4xl font-mono text-electric-500">
              {formatTime(gameTimeSeconds)}
            </CardTitle>
            {isLive && <Badge className="bg-red-500 animate-pulse">LIVE</Badge>}
          </div>
          
          {/* Game Stats Summary */}
          <div className="flex justify-center space-x-8 mt-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{blueKills}</div>
              <div className="text-muted-foreground">Our Kills</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${killDifference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {killDifference >= 0 ? '+' : ''}{killDifference}
              </div>
              <div className="text-muted-foreground">Kill Diff</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{redKills}</div>
              <div className="text-muted-foreground">Enemy Kills</div>
            </div>
          </div>

          <div className="flex justify-center space-x-2 mt-6">
            {!isLive ? (
              <Button onClick={handleStartGame} className="bg-green-600 hover:bg-green-700">
                <Play className="w-4 h-4 mr-2" />
                Start Game
              </Button>
            ) : (
              <Button onClick={handlePauseGame} variant="outline">
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            )}
            <Button onClick={handleEndGame} variant="destructive">
              <Square className="w-4 h-4 mr-2" />
              End Game
            </Button>
            <Button onClick={saveCurrentState} disabled={isCreating} variant="outline">
              Save State
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="score" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="score">Score</TabsTrigger>
          <TabsTrigger value="objectives">Objectives</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="score" className="space-y-4">
          {/* Score Tracking */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Blue Team (Our Team) */}
            <Card className="glass-card border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center justify-between">
                  Our Team (Blue)
                  {isLive && <Badge className="bg-blue-500 animate-pulse">LIVE</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Kills</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustKills('blue', -1)}
                      disabled={!isLive}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-2xl font-bold w-12 text-center">{blueKills}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustKills('blue', 1)}
                      disabled={!isLive}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Gold</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustGold('blue', -1000)}
                      disabled={!isLive}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-lg font-bold w-20 text-center">{blueGold.toLocaleString()}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustGold('blue', 1000)}
                      disabled={!isLive}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Red Team (Enemy Team) */}
            <Card className="glass-card border-red-500/20">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center justify-between">
                  Enemy Team (Red)
                  {isLive && <Badge className="bg-red-500 animate-pulse">LIVE</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Kills</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustKills('red', -1)}
                      disabled={!isLive}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-2xl font-bold w-12 text-center">{redKills}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustKills('red', 1)}
                      disabled={!isLive}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Gold</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustGold('red', -1000)}
                      disabled={!isLive}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-lg font-bold w-20 text-center">{redGold.toLocaleString()}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustGold('red', 1000)}
                      disabled={!isLive}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gold Difference Indicator */}
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className={`text-lg font-bold ${goldDifference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  Gold Advantage: {goldDifference >= 0 ? '+' : ''}{goldDifference.toLocaleString()}
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      goldDifference >= 0 ? 'bg-green-400' : 'bg-red-400'
                    }`}
                    style={{ 
                      width: `${Math.min(100, Math.max(0, 50 + (goldDifference / 10000) * 50))}%`,
                      marginLeft: goldDifference < 0 ? `${Math.max(0, 50 + (goldDifference / 10000) * 50)}%` : '0'
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="objectives" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Dragons */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-orange-500" />
                  Dragons
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-blue-400">Our Team</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustObjective('dragons', 'blue', -1)}
                      disabled={!isLive}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-xl font-bold w-8 text-center">{objectives.blue_dragons}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustObjective('dragons', 'blue', 1)}
                      disabled={!isLive}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-red-400">Enemy Team</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustObjective('dragons', 'red', -1)}
                      disabled={!isLive}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-xl font-bold w-8 text-center">{objectives.red_dragons}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustObjective('dragons', 'red', 1)}
                      disabled={!isLive}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Barons */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-purple-500" />
                  Barons
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-blue-400">Our Team</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustObjective('barons', 'blue', -1)}
                      disabled={!isLive}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-xl font-bold w-8 text-center">{objectives.blue_barons}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustObjective('barons', 'blue', 1)}
                      disabled={!isLive}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-red-400">Enemy Team</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustObjective('barons', 'red', -1)}
                      disabled={!isLive}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-xl font-bold w-8 text-center">{objectives.red_barons}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustObjective('barons', 'red', 1)}
                      disabled={!isLive}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Towers */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-gray-500" />
                  Towers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-blue-400">Our Team</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustObjective('towers', 'blue', -1)}
                      disabled={!isLive}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-xl font-bold w-8 text-center">{objectives.blue_towers}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustObjective('towers', 'blue', 1)}
                      disabled={!isLive}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-red-400">Enemy Team</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustObjective('towers', 'red', -1)}
                      disabled={!isLive}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-xl font-bold w-8 text-center">{objectives.red_towers}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustObjective('towers', 'red', 1)}
                      disabled={!isLive}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="teams">
          {/* Team Compositions */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Our Team Composition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {ourTeamParticipants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-3 rounded border border-border/50">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{participant.role?.toUpperCase()}</Badge>
                        <span className="font-medium">{participant.summoner_name}</span>
                        {participant.champion_name && (
                          <span className="text-muted-foreground">as {participant.champion_name}</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {participant.kills}/{participant.deaths}/{participant.assists}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Enemy Team Composition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {enemyTeamParticipants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-3 rounded border border-border/50">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{participant.role?.toUpperCase()}</Badge>
                        <span className="font-medium">{participant.summoner_name}</span>
                        {participant.champion_name && (
                          <span className="text-muted-foreground">as {participant.champion_name}</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {participant.kills}/{participant.deaths}/{participant.assists}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          {/* Recent Live Data */}
          {liveData.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Game Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {liveData.slice(-10).reverse().map((data, index) => (
                    <div key={data.id} className="flex items-center justify-between p-2 rounded border border-border/50 text-sm">
                      <span className="font-mono">{formatTime(data.game_time_seconds)}</span>
                      <div className="flex space-x-4">
                        <span className="text-blue-400">Blue: {data.blue_team_kills}K / {data.blue_team_gold?.toLocaleString()}G</span>
                        <span className="text-red-400">Red: {data.red_team_kills}K / {data.red_team_gold?.toLocaleString()}G</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
