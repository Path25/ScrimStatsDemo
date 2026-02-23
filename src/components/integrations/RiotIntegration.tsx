
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Gamepad2, AlertCircle, CheckCircle2 } from 'lucide-react';
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
import { usePlayersData } from '@/hooks/usePlayersData';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const riotIntegrationSchema = z.object({
  riot_api_key: z.string().min(1, 'API Key is required'),
  riot_integration_enabled: z.boolean(),
});

type RiotIntegrationFormData = z.infer<typeof riotIntegrationSchema>;

export function RiotIntegration() {
  const { tenant } = useTenant();
  const { updateTenantSettings, isLoading } = useTenantSettings();
  const { players } = usePlayersData();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<RiotIntegrationFormData>({
    resolver: zodResolver(riotIntegrationSchema),
    defaultValues: {
      riot_api_key: tenant?.settings?.riot_api_key || '',
      riot_integration_enabled: tenant?.settings?.riot_integration_enabled || false,
    },
  });

  const onSubmit = async (data: RiotIntegrationFormData) => {
    try {
      await updateTenantSettings({
        settings: {
          ...tenant?.settings,
          riot_api_key: data.riot_api_key,
          riot_integration_enabled: data.riot_integration_enabled,
        },
      });
      toast.success('Riot Games API settings updated successfully!');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to update Riot API settings:', error);
      toast.error('Failed to update Riot API settings. Please try again.');
    }
  };

  const testConnection = async () => {
    const apiKey = form.getValues('riot_api_key');
    
    if (!apiKey) {
      toast.error('Please enter your Riot API key before testing');
      return;
    }

    if (players.length === 0) {
      toast.error('Please add at least one player to your roster before testing the API connection');
      return;
    }

    const testPlayer = players[0];
    if (!testPlayer.summoner_name) {
      toast.error('The first player in your roster needs a summoner name to test the connection');
      return;
    }

    if (!testPlayer.riot_tag_line) {
      toast.error('The first player in your roster needs a Riot tag line (e.g., NA1, EUW) to test the connection');
      return;
    }

    setIsTestingConnection(true);
    try {
      console.log('Testing Riot API connection...');
      
      // Use Supabase client to call the edge function
      const { data: result, error } = await supabase.functions.invoke('test-riot-connection', {
        body: {
          apiKey,
          summonerName: testPlayer.summoner_name,
          tagLine: testPlayer.riot_tag_line,
          region: testPlayer.region || 'na1',
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error('Failed to test Riot API connection');
      }
      
      if (result.success) {
        // Save the settings if test is successful
        await updateTenantSettings({
          settings: {
            ...tenant?.settings,
            riot_api_key: apiKey,
            riot_integration_enabled: true,
          },
        });

        toast.success(`Successfully connected to Riot API! Found summoner: ${result.summonerName}`);
        setIsDialogOpen(false);
      } else {
        toast.error(result.error || 'Failed to connect to Riot API');
      }
    } catch (error) {
      console.error('Riot API connection test failed:', error);
      toast.error('Failed to connect to Riot API. Please check your API key and try again.');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const hasCredentials = tenant?.settings?.riot_api_key;
  const isEnabled = tenant?.settings?.riot_integration_enabled;
  const status = hasCredentials && isEnabled ? 'Connected' : 'Available';

  return (
    <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
      <div className="flex items-center space-x-3">
        <Gamepad2 className="w-5 h-5 text-blue-500" />
        <div>
          <h4 className="font-semibold">Riot Games API</h4>
          <p className="text-sm text-muted-foreground">
            SoloQ tracking and ranked statistics
          </p>
          {hasCredentials && isEnabled && (
            <p className="text-xs text-muted-foreground mt-1">
              API connected and ready for SoloQ data sync
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
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              {hasCredentials ? 'Configure' : 'Connect API'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Gamepad2 className="w-5 h-5 text-blue-500" />
                <span>Riot Games API Setup</span>
              </DialogTitle>
              <DialogDescription>
                Connect your Riot Games API key to automatically sync SoloQ statistics and rank data for your players.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="riot_integration_enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium">
                          Enable Riot API Integration
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Automatically sync SoloQ data for your players
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
                  name="riot_api_key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Riot Games API Key</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your Riot API key"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Your personal Riot Games API key from the developer portal
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {players.length > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Gamepad2 className="w-4 h-4 text-blue-500 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-medium text-blue-700 dark:text-blue-300">Test Connection</p>
                        <p className="text-blue-600 dark:text-blue-400 mt-1">
                          We'll test the connection using {players[0].summoner_name}#{players[0].riot_tag_line || 'missing-tag'} from your roster.
                        </p>
                        {!players[0].riot_tag_line && (
                          <p className="text-red-600 dark:text-red-400 mt-1">
                            ⚠️ Please add a Riot tag line to your first player to test the connection.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={testConnection}
                    disabled={isTestingConnection || players.length === 0 || !players[0]?.riot_tag_line}
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
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
