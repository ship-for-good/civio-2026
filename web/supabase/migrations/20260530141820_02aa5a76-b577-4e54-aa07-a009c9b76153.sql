insert into storage.buckets (id, name, public) values ('datos', 'datos', true) on conflict (id) do nothing;

create policy "Public read datos"
on storage.objects for select
to public
using (bucket_id = 'datos');