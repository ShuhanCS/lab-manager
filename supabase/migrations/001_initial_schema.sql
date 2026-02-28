-- Labs
create table labs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  institution text,
  settings jsonb default '{}',
  created_at timestamptz default now()
);

-- Lab members (join table: user <-> lab)
create table members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lab_id uuid not null references labs(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')) default 'member',
  joined_at timestamptz default now(),
  unique(user_id, lab_id)
);

-- Locations (hierarchical)
create table locations (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references labs(id) on delete cascade,
  parent_id uuid references locations(id) on delete set null,
  name text not null,
  type text not null check (type in ('room', 'bench', 'freezer', 'shelf', 'cabinet', 'other')) default 'other',
  created_at timestamptz default now()
);

-- Inventory items
create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references labs(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  name text not null,
  description text,
  type text not null check (type in ('equipment', 'reagent', 'consumable', 'chemical')),
  quantity numeric not null default 0,
  unit text not null default 'unit',
  min_threshold numeric default 0,
  location_id uuid references locations(id) on delete set null,
  catalog_number text,
  lot_number text,
  manufacturer text,
  supplier text,
  expiration_date date,
  conductscience_product_id text,
  barcode text,
  status text not null check (status in ('in_stock', 'low_stock', 'out_of_stock', 'expired')) default 'in_stock',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Equipment (extends inventory items where type=equipment)
create table equipment (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references inventory_items(id) on delete cascade,
  serial_number text,
  model_number text,
  purchase_date date,
  purchase_price numeric,
  warranty_expires date,
  calibration_interval_days integer,
  last_calibrated date,
  status text not null check (status in ('active', 'maintenance', 'decommissioned')) default 'active',
  created_at timestamptz default now()
);

-- Maintenance logs
create table maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references equipment(id) on delete cascade,
  performed_by uuid not null references auth.users(id),
  date date not null default current_date,
  type text not null check (type in ('calibration', 'repair', 'inspection', 'cleaning')),
  description text,
  cost numeric,
  next_due date,
  created_at timestamptz default now()
);

-- Grants / budgets
create table grants (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references labs(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  name text not null,
  funder text,
  grant_number text,
  total_amount numeric not null,
  start_date date,
  end_date date,
  categories jsonb default '[]',
  created_at timestamptz default now()
);

-- Transactions (purchases linked to grants)
create table transactions (
  id uuid primary key default gen_random_uuid(),
  grant_id uuid not null references grants(id) on delete cascade,
  inventory_item_id uuid references inventory_items(id) on delete set null,
  amount numeric not null,
  date date not null default current_date,
  description text,
  category text,
  receipt_url text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now()
);

-- Activity log
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references labs(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb default '{}',
  created_at timestamptz default now()
);

-- Indexes
create index idx_members_user_id on members(user_id);
create index idx_members_lab_id on members(lab_id);
create index idx_inventory_items_lab_id on inventory_items(lab_id);
create index idx_inventory_items_status on inventory_items(status);
create index idx_equipment_inventory_item_id on equipment(inventory_item_id);
create index idx_maintenance_logs_equipment_id on maintenance_logs(equipment_id);
create index idx_grants_lab_id on grants(lab_id);
create index idx_transactions_grant_id on transactions(grant_id);
create index idx_activity_log_lab_id on activity_log(lab_id);
create index idx_activity_log_created_at on activity_log(created_at desc);

-- Auto-update updated_at on inventory_items
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger inventory_items_updated_at
  before update on inventory_items
  for each row execute function update_updated_at();
