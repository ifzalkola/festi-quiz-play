import { Player } from '@/contexts/QuizContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle } from 'lucide-react';

interface PlayerListProps {
  players: Player[];
  showReady?: boolean;
  showScores?: boolean;
}

const PlayerList = ({ players, showReady = false, showScores = false }: PlayerListProps) => {
  const sortedPlayers = showScores 
    ? [...(players || [])].sort((a, b) => (b?.score || 0) - (a?.score || 0))
    : (players || []);

  return (
    <div className="space-y-2">
      {!sortedPlayers || sortedPlayers.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No players yet
        </p>
      ) : (
        sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
          >
            <div className="flex items-center gap-3">
              {showScores && (
                <span className="text-lg font-bold text-muted-foreground w-6">
                  #{index + 1}
                </span>
              )}
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xs">
                  {player?.displayName?.slice(0, 2)?.toUpperCase() || '??'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{player.displayName}</p>
                {showScores && (
                  <p className="text-xs text-muted-foreground">
                    {player.score} points
                  </p>
                )}
              </div>
            </div>
            {showReady && (
              player.isReady ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Ready
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  <Circle className="w-3 h-3 mr-1" />
                  Waiting
                </Badge>
              )
            )}
            {showScores && (
              <span className="text-xl font-bold text-primary">
                {player.score}
              </span>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default PlayerList;
