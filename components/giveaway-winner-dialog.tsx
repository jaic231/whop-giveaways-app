import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GiveawayWithStats } from "@/lib/types";

interface GiveawayWinnerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  giveaway: GiveawayWithStats;
}

export function GiveawayWinnerDialog({
  isOpen,
  onClose,
  giveaway,
}: GiveawayWinnerDialogProps) {
  const winner = giveaway.entries.find((entry) => entry.isWinner);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Giveaway Winner</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {winner ? (
            <div>
              <p className="text-lg font-semibold">{winner.userName}</p>
              <p className="text-sm text-gray-500">
                Congratulations to the winner of "{giveaway.title}"!
              </p>
            </div>
          ) : (
            <p>No winner was selected for this giveaway.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
