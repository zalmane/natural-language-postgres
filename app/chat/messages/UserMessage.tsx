import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function UserMessage({ text }: { text: string }) {
  return (
    <Card className="bg-[#2563eb] border border-[#2563eb] text-white max-w-[600px]">
      <CardContent className="p-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-6 w-6 shrink-0 bg-muted">
            <AvatarFallback className="text-xs font-bold text-foreground">OE</AvatarFallback>
          </Avatar>
          <div className="whitespace-pre-wrap">{text}</div>
        </div>
      </CardContent>
    </Card>
  );
} 