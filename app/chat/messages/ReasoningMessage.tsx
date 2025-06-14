import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReasoningMessage({
  isComplete,
  isExpanded,
  summary,
  details,
  onToggle
}: {
  isComplete: boolean,
  isExpanded: boolean,
  summary: string,
  details?: { type: "text"; text: string }[],
  onToggle: () => void
}) {
  return (
    <Card className="bg-[#f3f4f6] border border-[#d1d5db] cursor-pointer" onClick={onToggle}>
      <CardContent className="p-4">
        <div className={cn("flex justify-between items-center", !isComplete && "animate-pulse")}> 
          <span className="flex items-center">
            {!isComplete && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <span className="text-sm text-muted-foreground">
              {`Thinking: ${summary}`}
            </span>
          </span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
        {isExpanded && (
          <div className="mt-2">
            <pre className="text-sm whitespace-pre-wrap">
              {details?.map((detail, i) =>
                detail.type === "text" ? detail.text : "<redacted>"
              )}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 