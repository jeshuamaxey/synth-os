"use client"

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Sample } from "@/types";

const SampleGenerator = ({ onSampleChange }: { onSampleChange: (sample: Sample) => void }) => {
  const [prompt, setPrompt] = useState("")

  const sampleMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/samples/generate", {
        method: "POST",
        body: JSON.stringify({ prompt })
      })

      return response.json() as Promise<{ prompt: string, sampleUrl: string }>
    },
    onSuccess: (data) => {
      console.log(data)
      onSampleChange({
        url: data.sampleUrl,
        name: prompt,
        rootMidi: 60
      })
    }
  })

  const loading = sampleMutation.isPending

  return <div>
    <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Enter a prompt to generate a sample" />
    <button onClick={() => sampleMutation.mutate()} disabled={loading}>{loading ? 'Generating...' : 'Generate'}</button>
  </div>
}

export default SampleGenerator;