import { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useScrimsData, type Scrim } from '@/hooks/useScrimsData';
import { useScrimMonitoring } from '@/hooks/useScrimMonitoring';
import { useTenant } from '@/contexts/TenantContext';

interface ScrimActionsProps {
  scrim: Scrim;
}

export function ScrimActions({ scrim }: ScrimActionsProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { updateScrim, deleteScrim, isUpdating, isDeleting } = useScrimsData();
  const { activeSessions, stopMonitoring } = useScrimMonitoring();
  const { tenant } = useTenant();

  const activeSession = activeSessions.find(session => session.scrim_id === scrim.id);
  const canDelete = tenant?.userRole === 'owner' || tenant?.userRole === 'admin';

  const handleCancel = async () => {
    // Stop monitoring if active
    if (activeSession) {
      stopMonitoring({ sessionId: activeSession.id, status: 'expired' });
    }

    // Update scrim status to cancelled
    updateScrim({
      id: scrim.id,
      status: 'cancelled',
    });
    
    setShowCancelDialog(false);
  };

  const handleComplete = async () => {
    // Stop monitoring if active
    if (activeSession) {
      stopMonitoring({ sessionId: activeSession.id, status: 'completed' });
    }

    // Update scrim status to completed
    updateScrim({
      id: scrim.id,
      status: 'completed',
    });
    
    setShowCompleteDialog(false);
  };

  const handleDelete = async () => {
    // Stop monitoring if active
    if (activeSession) {
      stopMonitoring({ sessionId: activeSession.id, status: 'expired' });
    }

    // Delete the scrim
    deleteScrim(scrim.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {scrim.status !== 'completed' && scrim.status !== 'cancelled' && (
            <>
              <DropdownMenuItem
                onClick={() => setShowCompleteDialog(true)}
                className="text-green-600 focus:text-green-600"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Completed
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowCancelDialog(true)}
                className="text-yellow-600 focus:text-yellow-600"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Scrim
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {canDelete && (
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Scrim
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <span>Cancel Scrim</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this scrim against {scrim.opponent_name}? 
              {activeSession && " This will stop any active monitoring and mark the scrim as cancelled."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Scrim</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isUpdating}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {isUpdating ? 'Cancelling...' : 'Cancel Scrim'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Confirmation Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Mark Scrim as Completed</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this scrim against {scrim.opponent_name} as completed? 
              {activeSession && " This will stop any active monitoring and finalize the scrim results."}
              <br /><br />
              <strong>Note:</strong> You should manually add any remaining game results before completing the scrim.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Monitoring</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleComplete}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? 'Completing...' : 'Mark as Completed'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              <span>Delete Scrim</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this scrim against {scrim.opponent_name}? 
              This action cannot be undone and will remove all associated games and data.
              {activeSession && " This will also stop any active monitoring."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Scrim</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Scrim'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
