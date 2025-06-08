import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GiveawayWithStats } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface GiveawayHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  history: GiveawayWithStats[];
  currentUserId: string;
}

export function GiveawayHistoryDialog({
  isOpen,
  onClose,
  history,
  currentUserId,
}: GiveawayHistoryDialogProps) {
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );

  const getStatus = (giveaway: GiveawayWithStats) => {
    const userEntry = giveaway.entries.find(
      (entry) => entry.userId === currentUserId
    );
    if (giveaway.status !== "ENDED") return "Ongoing";
    if (!userEntry) return "Not Entered";
    return userEntry.isWinner ? "Won" : "Lost";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Giveaway History</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {sortedHistory.map((giveaway) => {
              const status = getStatus(giveaway);
              return (
                <div
                  key={giveaway.id}
                  className="bg-gray-50 rounded-lg p-4 text-sm"
                >
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-gray-800">
                      {giveaway.title}
                    </p>
                    <Badge
                      className={cn({
                        "bg-green-100 text-green-800": status === "Won",
                        "bg-red-100 text-red-800": status === "Lost",
                        "bg-gray-100 text-gray-800":
                          status === "Not Entered" || status === "Ongoing",
                      })}
                    >
                      {status}
                    </Badge>
                  </div>
                  <p className="text-gray-500 mt-1">
                    Ended on {new Date(giveaway.endDate).toLocaleDateString()}
                  </p>
                  {status === "Won" && (
                    <p className="text-green-600 font-medium mt-2">
                      Congratulations! You won ${giveaway.prizeAmount}.
                    </p>
                  )}
                </div>
              );
            })}
            {sortedHistory.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No completed giveaways yet.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
