-- Function to atomically create a lab and add the creator as owner.
-- Uses SECURITY DEFINER to bypass RLS chicken-and-egg problem:
-- the user can't add themselves as a member because no member row
-- exists yet to satisfy the RLS policy.
create or replace function create_lab_with_owner(
  p_name text,
  p_slug text,
  p_institution text default null
)
returns uuid as $$
declare
  v_lab_id uuid;
begin
  insert into labs (name, slug, institution)
  values (p_name, p_slug, p_institution)
  returning id into v_lab_id;

  insert into members (user_id, lab_id, role)
  values (auth.uid(), v_lab_id, 'owner');

  return v_lab_id;
end;
$$ language plpgsql security definer;
