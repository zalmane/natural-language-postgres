import { NextResponse } from 'next/server';

export async function GET() {
  const BP_MANAGER_URL = process.env.BP_MANAGER_URL || 'http://localhost:8000';
  try {

    const response = await fetch(`${BP_MANAGER_URL}/projects`, {
      method: 'GET',
      headers: {
        'accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error fetching projects:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 