/* =====================================
   AlertDialog — plain-CSS port of shadcn/ui AlertDialog
   (confirm/cancel dialog — backdrop & Escape do NOT close it,
   matching Radix behaviour; only the buttons dismiss)
===================================== */

import * as React from "react";
import { cn } from "../../utils/cn";
import "./AlertDialog.css";

function AlertDialog({ open, onOpenChange, children }) {
  /* Radix AlertDialog intentionally ignores Escape/backdrop dismissals. */
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="ui-alert-root">
      <div className="ui-alert-overlay" />
      {React.Children.map(children, (child) =>
        React.isValidElement(child) && child.type === AlertDialogContent
          ? React.cloneElement(child, { __close: () => onOpenChange?.(false) })
          : child
      )}
    </div>
  );
}

function AlertDialogContent({ className, children, __close, ...props }) {
  return (
    <div className="ui-alert-portal">
      <div className={cn("ui-alert-content", className)} {...props}>{children}</div>
    </div>
  );
}

function AlertDialogHeader({ className, ...props }) {
  return <div className={cn("ui-alert-header", className)} {...props} />;
}

function AlertDialogFooter({ className, ...props }) {
  return <div className={cn("ui-alert-footer", className)} {...props} />;
}

function AlertDialogTitle({ className, ...props }) {
  return <h2 className={cn("ui-alert-title", className)} {...props} />;
}

function AlertDialogDescription({ className, ...props }) {
  return <p className={cn("ui-alert-description", className)} {...props} />;
}

function AlertDialogAction({ className, onClick, ...props }) {
  return (
    <button
      className={cn("ui-alert-btn ui-alert-btn-action", className)}
      onClick={onClick}
      {...props}
    />
  );
}

function AlertDialogCancel({ className, onClick, ...props }) {
  return (
    <button
      className={cn("ui-alert-btn ui-alert-btn-cancel", className)}
      onClick={onClick}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
