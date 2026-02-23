
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useDataExport } from '@/hooks/useDataExport';

export const DataExportDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [includeScrimData, setIncludeScrimData] = useState(true);
  const [includePlayerData, setIncludePlayerData] = useState(true);
  const [includeSoloQData, setIncludeSoloQData] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30 days ago
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  const { exportData, isExporting } = useDataExport();

  const handleExport = async () => {
    await exportData({
      includeScrimData,
      includePlayerData,
      includeSoloQData,
      dateRange: {
        start: startDate,
        end: endDate
      },
      format: exportFormat
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Analytics Data</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Data Selection */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Include Data</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="scrim-data" 
                  checked={includeScrimData}
                  onCheckedChange={(checked) => setIncludeScrimData(checked === true)}
                />
                <Label htmlFor="scrim-data">Scrim Results & Game Data</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="player-data" 
                  checked={includePlayerData}
                  onCheckedChange={(checked) => setIncludePlayerData(checked === true)}
                />
                <Label htmlFor="player-data">Player Information</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="soloq-data" 
                  checked={includeSoloQData}
                  onCheckedChange={(checked) => setIncludeSoloQData(checked === true)}
                />
                <Label htmlFor="soloq-data">SoloQ Performance Data</Label>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Date Range</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={exportFormat} onValueChange={(value: 'csv' | 'json') => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Excel Compatible)</SelectItem>
                <SelectItem value="json">JSON (Raw Data)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Button */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              disabled={isExporting || (!includeScrimData && !includePlayerData && !includeSoloQData)}
            >
              {isExporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
