
import { useState } from 'react';
import { MessageSquare, Bot, CheckCircle, AlertCircle, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';

export function DiscordBotIntegration() {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isPro = tenant?.subscriptionTier !== 'free';
  const isConnected = false; // This would come from actual integration status
  const status = 'Coming Soon';

  return (
    <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-muted/20">
      <div className="flex items-center space-x-3">
        <div className="w-5 h-5 rounded bg-[#5865F2] flex items-center justify-center">
          <MessageSquare className="w-3 h-3 text-white" />
        </div>
        <div>
          <h4 className="font-semibold">Discord Bot Integration</h4>
          <p className="text-sm text-muted-foreground">
            Automated notifications and team communication features
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <Badge className="bg-muted text-muted-foreground">
          Coming Soon
        </Badge>
        <Button variant="outline" size="sm" disabled>
          Connect Bot
        </Button>
      </div>
    </div>
  );
}
