import { Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

function formatResult(result: any) {
    if (typeof result === 'string') {
        try {
            // Attempt to parse the string as JSON
            const parsed = JSON.parse(result);
            // If successful, stringify it back with nice formatting
            return JSON.stringify(parsed, null, 2);
        } catch (e) {
            // If parsing fails, return the original string
            return result;
        }
    }
    // If the result is not a string, stringify it directly
    return JSON.stringify(result, null, 2);
}

export function ToolInvocationMessage({ toolInvocation }: { toolInvocation: any }) {
    const isResult = toolInvocation.result !== undefined;
    const name = toolInvocation.toolName;
    const result = toolInvocation.result;
    
    return (
        <div className={cn(
            "text-sm my-2 p-3 rounded-lg border",
            isResult ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200 animate-pulse"
        )}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 font-semibold">
                    <Wrench className="w-4 h-4" />
                    <span>{name}</span>
                </div>
                {!isResult && <span className="text-xs text-muted-foreground">Running...</span>}
            </div>
            {isResult && (
                <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto">
                    <code>{formatResult(result)}</code>
                </pre>
            )}
        </div>
    );
} 
