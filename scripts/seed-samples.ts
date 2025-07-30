// import { Database } from "../src/types/supabase"
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from the project root
dotenv.config({ path: join(__dirname, "../.env.local") })

const seedSamples = [
  {
    localUrl: "gunshot.mp3",

    normalized_prompt: "gunshot",
    public_url: '',
    root_midi: 60,
    trim_start: null,
    trim_end: null,
    is_example: true
  },
  {
    localUrl: "horse.mp3",

    normalized_prompt: "horse",
    public_url: '',
    root_midi: 60,
    trim_start: null,
    trim_end: null,
    is_example: true
  }
]

async function main() {
  console.log("Starting seed script...")

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("Missing required environment variables")
    process.exit(1)
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  try {
    // 1. Upload gunshot.mp3 to the audio bucket
    console.log("Uploading gunshot.mp3 to storage...")


    for(const sample of seedSamples) {
      const localUrl = join(__dirname, "../public/audio", sample.localUrl)
      const localFile = readFileSync(localUrl)
      
      const { error: uploadError } = await supabase.storage
        .from('audio')
        .upload(sample.localUrl, localFile, {
          contentType: 'audio/mpeg',
          upsert: true
        })
  
      if (uploadError) {
        console.error("Upload error:", uploadError)
        process.exit(1)
      }
  
      console.log(`Successfully uploaded ${sample.localUrl}`)
  
      // 2. Get the public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('audio')
        .getPublicUrl(sample.localUrl)
  
      sample.public_url = urlData.publicUrl
      console.log(`Public URL: ${sample.public_url}`)
    }

    // 3. Insert the sample record
    const samples = seedSamples.map(s => {
      const newS = {...s, localUrl: undefined}
      delete newS.localUrl
      return newS
    })

    const { data, error } = await supabase.from("samples").insert(samples).select()

    if (error) {
      console.error("Database insert error:", error)
      process.exit(1)
    } else {
      console.log(`Successfully inserted ${data?.length} samples`)
      console.log("Sample data:", data)
    }

  } catch (error) {
    console.error("Unexpected error:", error)
    process.exit(1)
  }

  console.log("Seed script completed successfully!")
  process.exit(0)
}

main()
