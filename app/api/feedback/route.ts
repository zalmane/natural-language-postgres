export async function POST(req: Request) {
  const { messageId, type } = await req.json();
  
  console.log(`Thumbs ${type} for message: ${messageId}`);
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
} 