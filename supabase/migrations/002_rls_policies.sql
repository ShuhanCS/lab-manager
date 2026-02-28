-- Enable RLS on all tables
alter table labs enable row level security;
alter table members enable row level security;
alter table locations enable row level security;
alter table inventory_items enable row level security;
alter table equipment enable row level security;
alter table maintenance_logs enable row level security;
alter table grants enable row level security;
alter table transactions enable row level security;
alter table activity_log enable row level security;

-- Helper function: get user's lab IDs
create or replace function user_lab_ids()
returns setof uuid as $$
  select lab_id from members where user_id = auth.uid()
$$ language sql security definer stable;

-- Helper function: get user's role in a specific lab
create or replace function user_role_in_lab(p_lab_id uuid)
returns text as $$
  select role from members where user_id = auth.uid() and lab_id = p_lab_id
$$ language sql security definer stable;

-- Labs: users can see labs they belong to
create policy "Users can view their labs"
  on labs for select using (id in (select user_lab_ids()));

-- Labs: any authenticated user can create a lab
create policy "Authenticated users can create labs"
  on labs for insert with check (auth.uid() is not null);

-- Labs: only owners can update their lab
create policy "Owners can update their lab"
  on labs for update using (user_role_in_lab(id) = 'owner');

-- Labs: only owners can delete their lab
create policy "Owners can delete their lab"
  on labs for delete using (user_role_in_lab(id) = 'owner');

-- Members: users can see members of their labs
create policy "Users can view lab members"
  on members for select using (lab_id in (select user_lab_ids()));

-- Members: owners and admins can insert members
create policy "Owners and admins can add members"
  on members for insert with check (
    user_role_in_lab(lab_id) in ('owner', 'admin')
  );

-- Members: owners and admins can remove members (not owners)
create policy "Owners and admins can remove members"
  on members for delete using (
    user_role_in_lab(lab_id) in ('owner', 'admin')
    and role != 'owner'
  );

-- Locations: lab members can view
create policy "Lab members can view locations"
  on locations for select using (lab_id in (select user_lab_ids()));

-- Locations: admins and owners can manage
create policy "Admins can manage locations"
  on locations for insert with check (user_role_in_lab(lab_id) in ('owner', 'admin'));
create policy "Admins can update locations"
  on locations for update using (user_role_in_lab(lab_id) in ('owner', 'admin'));
create policy "Admins can delete locations"
  on locations for delete using (user_role_in_lab(lab_id) in ('owner', 'admin'));

-- Inventory items: all lab members can view and add
create policy "Lab members can view inventory"
  on inventory_items for select using (lab_id in (select user_lab_ids()));
create policy "Lab members can add inventory"
  on inventory_items for insert with check (lab_id in (select user_lab_ids()));
create policy "Lab members can update inventory"
  on inventory_items for update using (lab_id in (select user_lab_ids()));
create policy "Admins can delete inventory"
  on inventory_items for delete using (user_role_in_lab(lab_id) in ('owner', 'admin'));

-- Equipment: follows inventory_item join
create policy "Lab members can view equipment"
  on equipment for select using (
    inventory_item_id in (select id from inventory_items where lab_id in (select user_lab_ids()))
  );
create policy "Lab members can add equipment"
  on equipment for insert with check (
    inventory_item_id in (select id from inventory_items where lab_id in (select user_lab_ids()))
  );
create policy "Lab members can update equipment"
  on equipment for update using (
    inventory_item_id in (select id from inventory_items where lab_id in (select user_lab_ids()))
  );

-- Maintenance logs: follows equipment access
create policy "Lab members can view maintenance logs"
  on maintenance_logs for select using (
    equipment_id in (
      select e.id from equipment e
      join inventory_items i on e.inventory_item_id = i.id
      where i.lab_id in (select user_lab_ids())
    )
  );
create policy "Lab members can add maintenance logs"
  on maintenance_logs for insert with check (
    equipment_id in (
      select e.id from equipment e
      join inventory_items i on e.inventory_item_id = i.id
      where i.lab_id in (select user_lab_ids())
    )
  );

-- Grants: lab members can view, admins/owners can manage
create policy "Lab members can view grants"
  on grants for select using (lab_id in (select user_lab_ids()));
create policy "Admins can manage grants"
  on grants for insert with check (user_role_in_lab(lab_id) in ('owner', 'admin'));
create policy "Admins can update grants"
  on grants for update using (user_role_in_lab(lab_id) in ('owner', 'admin'));

-- Transactions: lab members can view and add
create policy "Lab members can view transactions"
  on transactions for select using (
    grant_id in (select id from grants where lab_id in (select user_lab_ids()))
  );
create policy "Lab members can add transactions"
  on transactions for insert with check (
    grant_id in (select id from grants where lab_id in (select user_lab_ids()))
  );

-- Activity log: lab members can view and insert
create policy "Lab members can view activity"
  on activity_log for select using (lab_id in (select user_lab_ids()));
create policy "Lab members can insert activity"
  on activity_log for insert with check (lab_id in (select user_lab_ids()));
