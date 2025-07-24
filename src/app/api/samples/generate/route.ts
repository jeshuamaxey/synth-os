
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
  const chunks = [];
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

  return data?.fullPath;
}

async function searchForSample(prompt: string) {
  const normalizedPrompt = normalizePrompt(prompt)

  // Query the samples table for the normalized prompt
  const { data, error } = await supabase
    .from('samples')
    .select('public_url')
    .eq('normalized_prompt', normalizedPrompt)
    .single()

  if (error || !data) {
    if (error && error.code !== 'PGRST116') { // PGRST116: No rows found
      console.error('Error searching for sample in table', error)
    }
    return null
  }
  return data.public_url
}

export const POST = async (req: Request) => {
  console.log('Generating sample')
  const { prompt } = await req.json()

  const existingSampleUrl = await searchForSample(prompt)
  if (existingSampleUrl) {
    return NextResponse.json({
      prompt,
      sampleUrl: existingSampleUrl,
    })
  }

  const elevenlabs = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY
  });

  console.log('Converting text to sound effects')
  const audio = await elevenlabs.textToSoundEffects.convert({
    text: prompt,
    durationSeconds: 10,
    outputFormat: 'mp3_44100_128',
  });

  console.log('Uploading audio to storage')
  // store audio in supabase storage
  const normalizedPrompt = normalizePrompt(prompt)
  const url = await uploadAudioToStorage(audio, normalizedPrompt)
  const sampleUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${url}`

  // Insert new sample into the samples table
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
  }

  console.log('Sample generated')

  return NextResponse.json({
    id: data.id,
    public_url: data.public_url,
    root_midi: data.root_midi,
    trim_start: data.trim_start,
    trim_end: data.trim_end,
  })
}
