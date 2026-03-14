import { supabase } from './supabase';

/**
 * Upload a file to Supabase Storage and return its public URL.
 * Files go into the 'homebook' bucket under the given folder.
 */
export async function uploadImage(
  file: File,
  folder: 'inspiration' | 'products' = 'inspiration'
): Promise<string> {
  const ext = file.name.split('.').pop();
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from('homebook')
    .upload(filename, file, { cacheControl: '3600', upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from('homebook').getPublicUrl(filename);
  return data.publicUrl;
}

/**
 * Delete an image from Supabase Storage by its public URL.
 */
export async function deleteImage(publicUrl: string): Promise<void> {
  const url = new URL(publicUrl);
  // Path after /storage/v1/object/public/homebook/
  const path = url.pathname.split('/homebook/')[1];
  if (!path) return;
  await supabase.storage.from('homebook').remove([path]);
}
