-- Create the equipment-docs storage bucket (private)
insert into storage.buckets (id, name, public)
values ('equipment-docs', 'equipment-docs', false);

-- RLS: authenticated users can upload equipment docs
create policy "Lab members can upload equipment docs"
  on storage.objects for insert
  with check (bucket_id = 'equipment-docs' and auth.uid() is not null);

-- RLS: authenticated users can read equipment docs
create policy "Lab members can read equipment docs"
  on storage.objects for select
  using (bucket_id = 'equipment-docs' and auth.uid() is not null);

-- RLS: authenticated users can delete equipment docs
create policy "Lab members can delete equipment docs"
  on storage.objects for delete
  using (bucket_id = 'equipment-docs' and auth.uid() is not null);
