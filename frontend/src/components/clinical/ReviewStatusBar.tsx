"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export interface ReviewStatusBarProps {
  totalItems: number;
  verifiedItems: number;
  criticalAlertCount: number;
  criticalAlertsAcknowledged: boolean;
  canApprove: boolean;
  isApproving?: boolean;
  onApprove: () => void;
  onSaveDraft?: () => void;
  className?: string;
}

export function ReviewStatusBar({
  totalItems,
  verifiedItems,
  criticalAlertCount,
  criticalAlertsAcknowledged,
  canApprove,
  isApproving = false,
  onApprove,
  onSaveDraft,
  className,
}: ReviewStatusBarProps) {
  const allVerified = verifiedItems >= totalItems;
  const isBlockedByAlerts = criticalAlertCount > 0 && !criticalAlertsAcknowledged;

  return (
    <div
      className={cn(
        "sticky bottom-0 z-30 w-full border-t border-border bg-card/95 backdrop-blur-md px-6 py-3.5 shadow-lg",
        className
      )}
    >
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Verification Status Metrics */}
        <div className="flex items-center gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Clinical Verification:</span>
            <Badge variant={allVerified ? "success" : "default"} dot>
              {verifiedItems} / {totalItems} Sections Reviewed
            </Badge>
          </div>

          {criticalAlertCount > 0 && (
            <div className="flex items-center gap-1.5">
              <Badge variant={criticalAlertsAcknowledged ? "warning" : "destructive"} dot>
                {criticalAlertCount} Critical Drug Warning{criticalAlertCount > 1 ? "s" : ""}
                {criticalAlertsAcknowledged ? " (Acknowledged)" : " (Action Required)"}
              </Badge>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {onSaveDraft && (
            <Button variant="outline" size="sm" onClick={onSaveDraft}>
              Save Draft
            </Button>
          )}

          <Button
            size="sm"
            variant={canApprove ? "primary" : "outline"}
            disabled={!canApprove || isApproving}
            isLoading={isApproving}
            onClick={onApprove}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            title={
              isBlockedByAlerts
                ? "Acknowledge critical pharmacological warnings before approving"
                : "Approve note and unlock prescription generation"
            }
          >
            Approve &amp; Sign Off
          </Button>
        </div>
      </div>
    </div>
  );
}
