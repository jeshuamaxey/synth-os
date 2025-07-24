import { useQuery } from '@tanstack/react-query';
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