import React from "react";

export function AssistantMessage({ text, children }: { text: string, children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="whitespace-pre-wrap">{text}</div>
      {children}
    </div>
  );
} 