
import { useState } from 'react';
import { Download, Monitor, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export function DesktopCollectorIntegration() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // In a real implementation, this would check if the desktop app is connected
  const isConnected = false;
  const status = isConnected ? 'Connected' : 'Available';

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Create a temporary link to trigger the download
      const link = document.createElement('a');
      link.href = 'https://www.dropbox.com/scl/fi/gq7tekpokrx69d3dfoyvq/ScrimStats.gg-Setup-1.1.0.exe?rlkey=sxw53rddmar5lc1cayr4un9tf&st=m7gnpqbz&dl=1';
      link.download = 'ScrimStats.gg-Setup-1.1.0.exe';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "The ScrimStats Desktop Collector installer is being downloaded.",
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the desktop collector. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
      <div className="flex items-center space-x-3">
        <Monitor className="w-5 h-5 text-blue-500" />
        <div>
          <h4 className="font-semibold">Desktop Data Collector</h4>
          <p className="text-sm text-muted-foreground">
            Real-time game data collection during scrims and matches
          </p>
          {isConnected && (
            <p className="text-xs text-muted-foreground mt-1">
              Desktop app connected and monitoring
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
              <CheckCircle className="w-3 h-3 mr-1" />
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
              {isConnected ? 'Manage' : 'Download & Setup'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Monitor className="w-5 h-5 text-blue-500" />
                <span>Desktop Data Collector Setup</span>
              </DialogTitle>
              <DialogDescription>
                Download and install the ScrimStats Desktop Collector for automatic game data tracking.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">ScrimStats Desktop App</h4>
                  <p className="text-sm text-muted-foreground">Version 1.1.0</p>
                </div>
                <Badge className="bg-performance-average/20 text-performance-average">
                  Available
                </Badge>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The desktop collector runs in the background and automatically captures game data during League of Legends matches.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h5 className="font-medium">Features:</h5>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-performance-excellent" />
                    <span>Real-time game state tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-performance-excellent" />
                    <span>Automatic match detection</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-performance-excellent" />
                    <span>Performance metrics collection</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-performance-excellent" />
                    <span>Secure data transmission</span>
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Settings className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-blue-700 dark:text-blue-300">Setup Instructions</p>
                    <ol className="text-blue-600 dark:text-blue-400 mt-1 space-y-1">
                      <li>1. Download and run the ScrimStats.gg-Setup-1.1.0.exe installer</li>
                      <li>2. Follow the installation wizard to install the app</li>
                      <li>3. Launch the ScrimStats Desktop App from your start menu</li>
                      <li>4. Login with your ScrimStats account when prompted</li>
                      <li>5. The app will run in the background automatically</li>
                    </ol>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="bg-electric-500 hover:bg-electric-600 w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                {isDownloading ? 'Downloading...' : 'Download Installer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
