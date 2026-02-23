
import { useFormContext } from 'react-hook-form';
import { Settings, Zap } from 'lucide-react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTenant } from '@/contexts/TenantContext';

interface AutoMonitoringSectionProps {
  isEditing?: boolean;
}

export function AutoMonitoringSection({ isEditing = false }: AutoMonitoringSectionProps) {
  const { control } = useFormContext();
  const { tenant } = useTenant();

  const isGridEnabled = tenant?.grid_integration_enabled && tenant?.grid_api_key && tenant?.grid_team_id;

  if (!isGridEnabled) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-blue-500" />
          <CardTitle className="text-sm">Auto-Monitoring</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <FormField
          control={control}
          name="auto_monitoring_enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between">
              <div className="space-y-0.5">
                <FormLabel className="text-sm">
                  Enable Auto Game Detection
                </FormLabel>
                <FormDescription className="text-xs">
                  Automatically detect and create games from GRID API starting 15 minutes before the scheduled time
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isEditing}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {isEditing && (
          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <Settings className="w-3 h-3 text-amber-500 mt-0.5" />
              <div className="text-xs">
                <p className="font-medium text-amber-700 dark:text-amber-300">
                  Auto-monitoring settings cannot be changed after creation
                </p>
                <p className="text-amber-600 dark:text-amber-400 mt-1">
                  Create a new scrim to use different monitoring settings
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
