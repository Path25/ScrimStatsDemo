
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useExternalDraftTools } from '@/hooks/useExternalDraftTools';
import { ExternalLink, Plus, Trash2, Download, Settings, Zap } from 'lucide-react';

type ToolType = 'championselect' | 'draftlol' | 'custom_webhook';

export const ExternalDraftToolsPanel: React.FC = () => {
  const { draftTools, connectTool, disconnectTool, isConnecting, isDisconnecting } = useExternalDraftTools();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTool, setNewTool] = useState<{
    tool_type: ToolType;
    tool_name: string;
    api_endpoint: string;
    api_key: string;
    webhook_url: string;
    is_active: boolean;
  }>({
    tool_type: 'championselect',
    tool_name: '',
    api_endpoint: '',
    api_key: '',
    webhook_url: '',
    is_active: true
  });

  const handleAddTool = () => {
    if (!newTool.tool_name) return;
    
    connectTool(newTool);
    setNewTool({
      tool_type: 'championselect',
      tool_name: '',
      api_endpoint: '',
      api_key: '',
      webhook_url: '',
      is_active: true
    });
    setIsAddDialogOpen(false);
  };

  const getToolIcon = (toolType: string) => {
    switch (toolType) {
      case 'championselect': return <ExternalLink className="h-4 w-4" />;
      case 'draftlol': return <Settings className="h-4 w-4" />;
      case 'custom_webhook': return <Zap className="h-4 w-4" />;
      default: return <ExternalLink className="h-4 w-4" />;
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
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <ExternalLink className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                External Draft Tools
              </span>
              <p className="text-sm text-muted-foreground font-normal">
                Connect and manage external draft analysis tools
              </p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-500 hover:bg-blue-600">
                <Plus className="h-4 w-4 mr-2" />
                Add Tool
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect External Draft Tool</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tool_type">Tool Type</Label>
                  <Select 
                    value={newTool.tool_type} 
                    onValueChange={(value: ToolType) => setNewTool({ ...newTool, tool_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="championselect">ChampionSelect.gg</SelectItem>
                      <SelectItem value="draftlol">DraftLol.com</SelectItem>
                      <SelectItem value="custom_webhook">Custom Webhook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="tool_name">Tool Name</Label>
                  <Input
                    id="tool_name"
                    value={newTool.tool_name}
                    onChange={(e) => setNewTool({ ...newTool, tool_name: e.target.value })}
                    placeholder="My Draft Tool"
                  />
                </div>

                {newTool.tool_type === 'championselect' || newTool.tool_type === 'draftlol' ? (
                  <>
                    <div>
                      <Label htmlFor="api_endpoint">API Endpoint</Label>
                      <Input
                        id="api_endpoint"
                        value={newTool.api_endpoint}
                        onChange={(e) => setNewTool({ ...newTool, api_endpoint: e.target.value })}
                        placeholder="https://api.example.com/draft"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="api_key">API Key (Optional)</Label>
                      <Input
                        id="api_key"
                        type="password"
                        value={newTool.api_key}
                        onChange={(e) => setNewTool({ ...newTool, api_key: e.target.value })}
                        placeholder="Your API key"
                      />
                    </div>
                  </>
                ) : null}

                {newTool.tool_type === 'custom_webhook' && (
                  <div>
                    <Label htmlFor="webhook_url">Webhook URL</Label>
                    <Input
                      id="webhook_url"
                      value={newTool.webhook_url}
                      onChange={(e) => setNewTool({ ...newTool, webhook_url: e.target.value })}
                      placeholder="https://your-app.com/webhook/draft"
                    />
                  </div>
                )}

                <Button 
                  onClick={handleAddTool} 
                  disabled={isConnecting || !newTool.tool_name}
                  className="w-full"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Tool'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {draftTools.length === 0 ? (
          <div className="text-center py-8">
            <ExternalLink className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Draft Tools Connected</h3>
            <p className="text-muted-foreground mb-4">
              Connect external draft tools to automatically import draft data
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {draftTools.map((tool) => (
              <Card key={tool.id} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        {getToolIcon(tool.tool_type)}
                      </div>
                      <div>
                        <h4 className="font-medium">{tool.tool_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {getToolTypeName(tool.tool_type)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={tool.is_active ? "default" : "secondary"}>
                        {tool.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disconnectTool(tool.id)}
                        disabled={isDisconnecting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {tool.last_sync && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Last sync: {new Date(tool.last_sync).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
