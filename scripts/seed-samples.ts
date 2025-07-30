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
    const gunshotPath = join(__dirname, "../public/audio/gunshot.mp3")
    const gunshotFile = readFileSync(gunshotPath)
    
    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload('gunshot.mp3', gunshotFile, {
        contentType: 'audio/mpeg',
        upsert: true
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      process.exit(1)
    }

    console.log("Successfully uploaded gunshot.mp3")

    // 2. Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('audio')
      .getPublicUrl('gunshot.mp3')

    const publicUrl = urlData.publicUrl
    console.log("Public URL:", publicUrl)

    // 3. Insert the sample record
    const samples = [
      {
        normalized_prompt: "gunshot",
        public_url: publicUrl,
        root_midi: 60,
        trim_start: null,
        trim_end: null,
        is_example: true
      }
    ]

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
