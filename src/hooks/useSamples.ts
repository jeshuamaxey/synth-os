import { useQuery, useMutation } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function fetchSamples() {
  const { data, error } = await supabase
    .from('samples')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export function useSamples() {
  return useQuery({
    queryKey: ['samples'],
    queryFn: fetchSamples,
  });
}

// Mutation hook to update a sample by id
type SampleUpdate = {
  id: string;
  [key: string]: unknown;
  trimStart?: number;
  trimEnd?: number;
};

export function useSampleMutation() {
  return useMutation({
    mutationFn: async ({ id, trimStart, trimEnd, ...fields }: SampleUpdate) => {
      const updateFields = { ...fields };
      if (typeof trimStart === 'number') updateFields.trim_start = trimStart;
      if (typeof trimEnd === 'number') updateFields.trim_end = trimEnd;
      const { data, error } = await supabase
        .from('samples')
        .update(updateFields)
        .eq('id', id)
        .select();
      if (error) throw error;
      return data;
    },
  });
} 