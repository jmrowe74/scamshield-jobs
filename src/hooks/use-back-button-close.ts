import { useEffect, useRef } from "react";

/**
 * Makes the phone's Back button close an open dialog instead of leaving the app.
 * When `open` becomes true, a history entry is pushed. Pressing Back pops that
 * entry and calls `onClose`. If the dialog is closed another way (X, Cancel,
 * Escape), the extra history entry is removed so Back still behaves normally.
 */
export function useBackButtonClose(open: boolean, onClose: () => void) {
  const pushed = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (open && !pushed.current) {
      window.history.pushState(window.history.state, "");
      pushed.current = true;
    } else if (!open && pushed.current) {
      pushed.current = false;
      window.history.back();
    }
  }, [open]);

  useEffect(() => {
    const handlePopState = () => {
      if (pushed.current) {
        pushed.current = false;
        onCloseRef.current();
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
}
