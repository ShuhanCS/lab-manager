-- Enable Supabase Realtime for inventory_items and activity_log tables
alter publication supabase_realtime add table inventory_items;
alter publication supabase_realtime add table activity_log;
