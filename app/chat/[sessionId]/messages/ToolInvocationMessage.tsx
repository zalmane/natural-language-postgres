import { Wrench, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

function formatResult(result: any) {
  let toFormat: any;

  try {
    // First, assume the result might be a string containing our specific nested structure
    const outerParsed = typeof result === 'string' ? JSON.parse(result) : result;

    if (
      outerParsed &&
      outerParsed.content &&
      Array.isArray(outerParsed.content) &&
      outerParsed.content.length > 0 &&
      typeof outerParsed.content[0].text === 'string'
    ) {
      // If it matches, parse the inner JSON string
      toFormat = JSON.parse(outerParsed.content[0].text);
    } else {
      // Otherwise, use the parsed outer object (or the original result if it wasn't a string)
      toFormat = outerParsed;
    }
  } catch (e) {
    // If any parsing fails, fall back to the original result
    toFormat = result;
  }
  
  // Finally, stringify the result for display
  // If it's already a string at this point, it means parsing failed, so we return it as is.
  if (typeof toFormat === 'string') {
    return toFormat;
  }
  return JSON.stringify(toFormat, null, 2);
}

function formatArgs(args: any) {
  if (typeof args === 'string') {
    return args;
  }
  return JSON.stringify(args, null, 2);
}

export function ToolInvocationMessage({
    toolInvocation,
    isExpanded,
    onToggle,
}: {
    toolInvocation: any;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const isResult = toolInvocation.result !== undefined;
    const name = toolInvocation.toolName;
    const result = toolInvocation.result;
    const args = toolInvocation.args;
    
    return (
        <div
            className={cn(
                "text-sm my-2 p-3 rounded-lg border cursor-pointer",
                isResult ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
            )}
            onClick={onToggle}
        >
            <div className={cn("flex justify-between items-center", !isResult && "animate-pulse")}>
                <div className="flex items-center gap-2 font-semibold">
                    <Wrench className="w-4 h-4" />
                    <span>{name}</span>
                </div>
                {isResult ? (
                    isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                ) : (
                    <span className="text-xs text-muted-foreground">Running...</span>
                )}
            </div>
            {isExpanded && isResult && (
                <div className="mt-2 space-y-2">
                    {args && (
                        <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">Args:</div>
                            <pre className="p-2 bg-white rounded text-xs overflow-x-auto">
                                <code>{formatArgs(args)}</code>
                            </pre>
                        </div>
                    )}
                    <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Results:</div>
                        <pre className="p-2 bg-white rounded text-xs overflow-x-auto">
                            <code>{formatResult(result)}</code>
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
} 
