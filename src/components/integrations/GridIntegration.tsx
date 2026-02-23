
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useTenant } from '@/contexts/TenantContext';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import { gridApi } from '@/services/gridApi';
import { toast } from 'sonner';
import { GameDataModal } from './GameDataModal';
import { GridSeriesData } from '@/services/gridApi';

const gridIntegrationSchema = z.object({
  grid_api_key: z.string().min(1, 'API Key is required'),
  grid_team_tag: z.string().min(1, 'Team Tag is required'),
  grid_integration_enabled: z.boolean(),
});

type GridIntegrationFormData = z.infer<typeof gridIntegrationSchema>;

export function GridIntegration() {
  const { tenant } = useTenant();
  const { updateTenantSettings, isLoading } = useTenantSettings();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGameDataModalOpen, setIsGameDataModalOpen] = useState(false);
  const [gameData, setGameData] = useState<GridSeriesData | null>(null);
  const [isTestingLatestGame, setIsTestingLatestGame] = useState(false);

  const form = useForm<GridIntegrationFormData>({
    resolver: zodResolver(gridIntegrationSchema),
    defaultValues: {
      grid_api_key: tenant?.grid_api_key || '',
      grid_team_tag: tenant?.settings?.grid_team_tag || '',
      grid_integration_enabled: tenant?.grid_integration_enabled || false,
    },
  });

  const onSubmit = async (data: GridIntegrationFormData) => {
    try {
      await updateTenantSettings({
        grid_api_key: data.grid_api_key,
        grid_team_id: tenant?.grid_team_id,
        grid_integration_enabled: data.grid_integration_enabled,
        settings: {
          ...tenant?.settings,
          grid_team_tag: data.grid_team_tag,
        },
      });
      toast.success('GRID integration settings updated successfully!');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to update GRID settings:', error);
      toast.error('Failed to update GRID settings. Please try again.');
    }
  };

  const testConnection = async () => {
    const teamTag = form.getValues('grid_team_tag');

    if (!teamTag) {
      toast.error('Please fill in Team Tag before testing');
      return;
    }

    setIsTestingConnection(true);
    try {
      const team = await gridApi.verifyTeamByTag(teamTag);
      
      if (!team) {
        toast.error(`No team found with tag "${teamTag}". Please check your team tag.`);
        return;
      }

      // Save the verified team information
      await updateTenantSettings({
        grid_api_key: form.getValues('grid_api_key'),
        grid_team_id: team.id,
        grid_integration_enabled: true,
        settings: {
          ...tenant?.settings,
          grid_team_tag: teamTag,
          grid_team_name: team.name,
        },
      });

      toast.success(`Successfully connected to team "${team.name}" (${team.nameShortened})!`);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('GRID connection test failed:', error);
      toast.error('Failed to connect to GRID API. Please check your credentials.');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const testLatestGame = async () => {
    if (!tenant?.grid_api_key || !tenant?.grid_team_id) {
      toast.error('Please configure and test your GRID connection first');
      return;
    }

    setIsTestingLatestGame(true);
    try {
      // First get the latest series
      const series = await gridApi.getTeamSeries();
      
      if (series.length === 0) {
        toast.error('No recent games found for your team');
        return;
      }

      const latestSeries = series[0];
      
      // Then fetch the live data for the latest series
      const seriesData = await gridApi.getSeriesLiveData(latestSeries.id);
      
      setGameData(seriesData);
      setIsGameDataModalOpen(true);
      
      toast.success(`Successfully fetched game data for Series ${latestSeries.id}`);
    } catch (error) {
      console.error('Failed to test latest game:', error);
      toast.error('Failed to fetch latest game data');
    } finally {
      setIsTestingLatestGame(false);
    }
  };

  const isEnabled = tenant?.grid_integration_enabled;
  const hasCredentials = tenant?.grid_api_key && tenant?.grid_team_id;
  const status = hasCredentials && isEnabled ? 'Connected' : 'Available';

  return (
    <>
      <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
        <div className="flex items-center space-x-3">
          <Zap className="w-5 h-5 text-blue-500" />
          <div>
            <h4 className="font-semibold">GRID Integration</h4>
            <p className="text-sm text-muted-foreground">
              Automatic scrim detection and live data collection
            </p>
            {hasCredentials && tenant?.settings?.grid_team_name && (
              <p className="text-xs text-muted-foreground mt-1">
                Connected to: {tenant.settings.grid_team_name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className={
            status === 'Connected'
              ? 'bg-performance-excellent/20 text-performance-excellent'
              : 'bg-performance-average/20 text-performance-average'
          }>
            {status === 'Connected' ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 mr-1" />
                Available
              </>
            )}
          </Badge>
          
          {hasCredentials && isEnabled && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testLatestGame}
              disabled={isTestingLatestGame}
            >
              {isTestingLatestGame ? 'Testing...' : 'Test Latest Game'}
            </Button>
          )}
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                {hasCredentials ? 'Configure' : 'Connect Account'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-blue-500" />
                  <span>GRID Integration Setup</span>
                </DialogTitle>
                <DialogDescription>
                  Connect your GRID account to automatically track scrim games and receive live data updates.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="grid_integration_enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">
                            Enable GRID Integration
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Automatically detect and track scrim games
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="grid_api_key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GRID API Key</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your GRID API key"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Your GRID API key for accessing match data
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="grid_team_tag"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Tag</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your team tag (e.g., OUAT)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Your team's short name/tag as it appears in GRID (e.g., OUAT, TSM, C9)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={testConnection}
                      disabled={isTestingConnection}
                      className="flex-1"
                    >
                      {isTestingConnection ? 'Testing...' : 'Test & Connect'}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      size="sm"
                      className="flex-1"
                    >
                      {isLoading ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </div>
                </form>
              </Form>

              {isEnabled && hasCredentials && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Settings className="w-4 h-4 text-blue-500 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-medium text-blue-700 dark:text-blue-300">Auto-Monitoring Active</p>
                      <p className="text-blue-600 dark:text-blue-400 mt-1">
                        System will automatically monitor for games 15 minutes before scheduled scrims.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <GameDataModal 
        isOpen={isGameDataModalOpen}
        onClose={() => setIsGameDataModalOpen(false)}
        seriesData={gameData}
      />
    </>
  );
}
