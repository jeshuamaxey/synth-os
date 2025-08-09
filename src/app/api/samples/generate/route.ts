
import { NextResponse } from "next/server"
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function normalizePrompt(prompt: string) {
  return prompt.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '')
}

async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Buffer[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

async function uploadAudioToStorage(stream: ReadableStream, requestHash: string) {
  const buffer = await streamToBuffer(stream);
  const file = new File([buffer], `${requestHash}.mp3`, { type: 'audio/mp3' });

  const { data, error } = await supabase.storage
    .from('audio')
    .upload(`${requestHash}.mp3`, file, {
      contentType: 'audio/mp3',
    });

  console.log('Storage upload result', { data, error });

  if (error) {
    console.error('Error uploading audio to storage', error);
    return null;
  }

  return data?.fullPath ?? null;
}

type ExistingSample = { id: string; public_url: string } | null;
async function searchForSample(prompt: string): Promise<ExistingSample> {
  const normalizedPrompt = normalizePrompt(prompt)

  const { data, error } = await supabase
    .from('samples')
    .select('id, public_url', { count: 'exact', head: false })
    .eq('normalized_prompt', normalizedPrompt)
    .single()

  const errCode = (error as { code?: string } | null | undefined)?.code;
  if (error || !data) {
    if (error && errCode !== 'PGRST116') {
      console.error('Error searching for sample in table', error)
    }
    return null
  }
  return { id: data.id as string, public_url: data.public_url as string }
}

export const POST = async (req: Request) => {
  console.log('Generating sample')

  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  const token = authHeader?.match(/^Bearer\s+(.*)$/i)?.[1];
  if (!token) {
    return new NextResponse("Unauthorized: missing auth token", { status: 401 });
  }

  const supabaseWithAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: userData, error: userError } = await supabaseWithAuth.auth.getUser();
  if (userError || !userData?.user) {
    return new NextResponse("Unauthorized: invalid session", { status: 401 });
  }
  const user = userData.user as unknown as { id: string; is_anonymous?: boolean };
  const userId = user.id;

  const { prompt, duration } = await req.json()
  if (!prompt || typeof prompt !== 'string') {
    return new NextResponse("Bad request: prompt is required", { status: 400 });
  }
  const parsedDuration = typeof duration === 'number' ? duration : undefined;

  const { count: usedCount, error: countError } = await supabaseWithAuth
    .from('sample_generations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (countError) {
    console.error('Error counting generations', countError);
  }
  const used = usedCount ?? 0;

  const limit = user.is_anonymous ? 3 : 10;
  if (used >= limit) {
    return new NextResponse(`Limit reached: ${used}/${limit}. Run 'login' to upgrade.`, { status: 429 });
  }

  const existing = await searchForSample(prompt)
  if (existing) {
    await supabaseWithAuth.from('sample_generations').insert({
      user_id: userId,
      prompt,
      duration: parsedDuration ?? null,
      sample_id: existing.id,
      public_url: existing.public_url,
    });

    return NextResponse.json({
      id: existing.id,
      public_url: existing.public_url,
      root_midi: 60,
      trim_start: null,
      trim_end: null,
    })
  }

  const elevenlabs = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY
  });

  console.log('Converting text to sound effects')
  const audio = await elevenlabs.textToSoundEffects.convert({
    text: prompt,
    durationSeconds: parsedDuration ?? 3,
    outputFormat: 'mp3_44100_128',
  });

  console.log('Uploading audio to storage')
  const normalizedPrompt = normalizePrompt(prompt)
  const url = await uploadAudioToStorage(audio, normalizedPrompt)
  if (!url) {
    return new NextResponse("Failed to upload audio", { status: 500 });
  }
  const sampleUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${url}`

  const { data, error: insertError } = await supabase
    .from('samples')
    .insert({
      normalized_prompt: normalizedPrompt,
      public_url: sampleUrl,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error inserting new sample into table', insertError)
    return new NextResponse("Failed to write sample record", { status: 500 });
  }

  await supabaseWithAuth.from('sample_generations').insert({
    user_id: userId,
    prompt,
    duration: parsedDuration ?? null,
    sample_id: (data as { id: string }).id,
    public_url: (data as { public_url: string }).public_url,
  });

  console.log('Sample generated')

  return NextResponse.json({
    id: (data as { id: string }).id,
    public_url: (data as { public_url: string }).public_url,
    root_midi: (data as { root_midi: number | undefined }).root_midi,
    trim_start: (data as { trim_start: number | null | undefined }).trim_start,
    trim_end: (data as { trim_end: number | null | undefined }).trim_end,
  })
}
