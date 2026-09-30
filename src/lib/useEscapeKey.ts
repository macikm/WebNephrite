import { useEffect } from "react";

// Modal stack to ensure only the top-most modal closes on ESC
const modalStack: (() => void)[] = [];

if (typeof window !== "undefined") {
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modalStack.length > 0) {
      event.preventDefault();
      // Execute the top-most modal's close handler
      const topHandler = modalStack[modalStack.length - 1];
      if (topHandler) {
        topHandler();
      }
    }
  });
}

export function useEscapeKey(onClose?: () => void, active: boolean = true) {
  useEffect(() => {
    if (!active || !onClose) return;

    modalStack.push(onClose);
    return () => {
      const idx = modalStack.lastIndexOf(onClose);
      if (idx !== -1) {
        modalStack.splice(idx, 1);
      }
    };
  }, [onClose, active]);
}
