drop policy if exists "Owners can read own sejura photos" on storage.objects;

create policy "Owners can read own sejura photos"
on storage.objects for select
using (
  bucket_id = 'sejura-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
