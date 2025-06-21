export async function POST(req: Request) {
  const { messageId, type, reason } = await req.json();
  
  console.log(`Thumbs ${type} for message: ${messageId}`);
  if (reason) {
    console.log(`Feedback reason: ${reason}`);
  }
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
} 