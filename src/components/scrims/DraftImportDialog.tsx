
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useExternalDraftTools } from '@/hooks/useExternalDraftTools';
import { Download, ExternalLink } from 'lucide-react';

interface DraftImportDialogProps {
  gameId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const DraftImportDialog: React.FC<DraftImportDialogProps> = ({
  gameId,
  isOpen,
  onClose
}) => {
  const { draftTools, importDraftData, isImporting } = useExternalDraftTools();
  const [selectedToolId, setSelectedToolId] = useState<string>('');

  const activeDraftTools = draftTools.filter(tool => tool.is_active);

  const handleImport = () => {
    if (selectedToolId) {
      importDraftData({ gameId, toolId: selectedToolId });
      onClose();
    }
  };

  const getToolTypeName = (toolType: string) => {
    switch (toolType) {
      case 'championselect': return 'ChampionSelect.gg';
      case 'draftlol': return 'DraftLol.com';
      case 'custom_webhook': return 'Custom Webhook';
      default: return toolType;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import Draft Data
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Import draft data from your connected external tools into this game.
          </p>

          {activeDraftTools.length === 0 ? (
            <div className="text-center py-8">
              <ExternalLink className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No active draft tools connected. Please connect a tool first.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Select Draft Tool
                </label>
                <Select value={selectedToolId} onValueChange={setSelectedToolId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a draft tool..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeDraftTools.map((tool) => (
                      <SelectItem key={tool.id} value={tool.id}>
                        <div className="flex items-center gap-2">
                          <span>{tool.tool_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {getToolTypeName(tool.tool_type)}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleImport}
                  disabled={!selectedToolId || isImporting}
                  className="flex-1"
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Import Draft Data
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
