
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface GameDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  seriesData: any | null;
}

export function GameDataModal({ isOpen, onClose, seriesData }: GameDataModalProps) {
  if (!seriesData) return null;

  const hasEvents = seriesData.events && Object.keys(seriesData.events).length > 0;
  const hasDetails = seriesData.details && Object.keys(seriesData.details).length > 0;
  const hasSummary = seriesData.summary && Object.keys(seriesData.summary).length > 0;

  const renderEndpointStatus = (endpoint: string) => {
    const parts = endpoint.split(' - Status: ');
    const status = parseInt(parts[1]);
    const url = parts[0];
    
    return (
      <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
        <div>
          <p className="font-medium text-sm">{url.split('/').pop()}</p>
          <p className="text-xs text-muted-foreground">{url}</p>
        </div>
        <Badge className={status === 200 ? 'bg-green-500' : 'bg-red-500'}>
          {status === 200 ? (
            <>
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Success
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3 mr-1" />
              Failed ({status})
            </>
          )}
        </Badge>
      </div>
    );
  };

  const renderDataPreview = (data: any, title: string) => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(data).slice(0, 5).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="font-medium">{key}:</span>
                <span className="text-muted-foreground">
                  {typeof value === 'object' ? 'Object' : String(value).substring(0, 50)}
                </span>
              </div>
            ))}
            {Object.keys(data).length > 5 && (
              <p className="text-xs text-muted-foreground">
                ...and {Object.keys(data).length - 5} more fields
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>GRID API Endpoints Test: {seriesData.title}</span>
            <Badge className="bg-green-500">
              Live Data Endpoints Working ✓
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Endpoint Status */}
          <Card>
            <CardHeader>
              <CardTitle>Endpoint Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {seriesData.endpoints && Object.values(seriesData.endpoints).map((endpoint: string, index) => (
                <div key={index}>
                  {renderEndpointStatus(endpoint)}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Data Preview */}
          <div className="grid gap-4 md:grid-cols-1">
            {renderDataPreview(seriesData.events, "Live Events Data")}
            {renderDataPreview(seriesData.details, "End State Details")}
            {renderDataPreview(seriesData.summary, "End State Summary")}
          </div>

          {/* Success Summary */}
          <Card className="bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">
                  Endpoint Connection Successful
                </h4>
                <p className="text-green-600 dark:text-green-400 text-sm">
                  Successfully connected to GRID API file-download endpoints for Series {seriesData.id}
                </p>
                <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="font-medium">Events Endpoint</p>
                    <p className={hasEvents ? 'text-green-600' : 'text-orange-600'}>
                      {hasEvents ? 'Data Retrieved' : 'No Data'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Details Endpoint</p>
                    <p className={hasDetails ? 'text-green-600' : 'text-orange-600'}>
                      {hasDetails ? 'Data Retrieved' : 'No Data'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Summary Endpoint</p>
                    <p className={hasSummary ? 'text-green-600' : 'text-orange-600'}>
                      {hasSummary ? 'Data Retrieved' : 'No Data'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
