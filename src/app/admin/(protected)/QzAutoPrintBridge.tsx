"use client";

import { QzAutoPrint } from "./QzAutoPrint";

export function QzAutoPrintBridge() {
  return (
    <div className="sr-only" aria-hidden>
      <QzAutoPrint showControls={false} showStatus={false} />
    </div>
  );
}
