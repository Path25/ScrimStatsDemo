
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Users, Trophy, TrendingUp, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      icon: <Plus className="h-4 w-4" />,
      label: 'New Scrim',
      description: 'Schedule a practice match',
      onClick: () => navigate('/scrims'),
      variant: 'default' as const,
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      label: 'Calendar',
      description: 'View schedule',
      onClick: () => navigate('/calendar'),
      variant: 'outline' as const,
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: 'Players',
      description: 'Manage roster',
      onClick: () => navigate('/players'),
      variant: 'outline' as const,
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      label: 'Analytics',
      description: 'View performance',
      onClick: () => navigate('/analytics'),
      variant: 'outline' as const,
    },
  ];

  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Quick Actions</h3>
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Live
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              size="sm"
              onClick={action.onClick}
              className="h-auto p-3 flex flex-col items-center space-y-1 hover:scale-105 transition-transform"
            >
              {action.icon}
              <span className="text-xs font-medium">{action.label}</span>
              <span className="text-xs opacity-70 hidden sm:block">{action.description}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
