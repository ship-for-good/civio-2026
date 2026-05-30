drop policy if exists "Public read datos" on storage.objects;

create policy "Public read contratos_demo"
on storage.objects for select
to public
using (bucket_id = 'datos' and name = 'contratos_demo.json');