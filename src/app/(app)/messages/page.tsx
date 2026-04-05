import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const participants = await prisma.conversation_participants.findMany({
    where: { user_id: session.user.id },
    include: { conversations: true },
  });

  const conversations = participants
    .map((p) => p.conversations)
    .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime());

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Messages</h1>
      {conversations.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12"><MessageCircle className="h-12 w-12 text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No messages yet</h3><p className="text-muted-foreground text-center">Messages from contest members will appear here.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Link key={conv.id} href={`/messages/${conv.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted"><MessageCircle className="h-5 w-5" /></div>
                  <div className="flex-1 min-w-0"><p className="font-medium truncate">{conv.name ?? "Direct Message"}</p><p className="text-sm text-muted-foreground">{format(conv.updated_at, "MMM dd 'at' h:mm a")}</p></div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
