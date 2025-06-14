import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ToolInvocationMessage({ toolInvocation }: { toolInvocation: any }) {
  const [expanded, setExpanded] = useState(false);
  const isResult = toolInvocation.state === "result";

  return (
    <Card
      className={cn(
        "bg-[#f3f4f6] border border-[#d1d5db] cursor-pointer"
      )}
      onClick={() => setExpanded((prev) => !prev)}
    >
      <CardContent className="p-4">
      <div className={cn("flex justify-between items-center", !isResult && "animate-pulse")}> 
      <span className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Tool invocation: {toolInvocation.toolName}
            </span>
          </span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
        {expanded && isResult && (
          <div className="mt-2 p-3 bg-white rounded border border-dashed text-sm">
            <strong>Result:</strong>
            <pre className="whitespace-pre-wrap">{JSON.stringify(toolInvocation.result, null, 2)}</pre>
          </div>
        )}
        {expanded && !isResult && (
          <div className="mt-2 text-sm text-muted-foreground">
            Waiting for tool result...
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
