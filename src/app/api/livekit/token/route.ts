import { AccessToken } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { roomName, participantName, participantId, isTutor } = await req.json();

    if (!roomName || !participantName) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json(
        { error: 'LiveKit credentials are not configured' },
        { status: 500 }
      );
    }

    // Create access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantId || participantName,
      name: participantName,
    });

    // Grant permissions based on role
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: isTutor, // Only tutors can publish video/audio by default
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({ token, wsUrl });
  } catch (error: any) {
    console.error('Error generating token:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
