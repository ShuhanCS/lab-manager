"""Seed demo data for Lab Manager."""
import requests
import json

SB_URL = "https://vwxkjxdorbdynbzuacix.supabase.co"
SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3eGtqeGRvcmJkeW5ienVhY2l4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI3ODY5NSwiZXhwIjoyMDg3ODU0Njk1fQ.nE-owvsukCKnG3tFdezbPHowrNN1hjTthzp5pCEkPwo"
LAB = "e55b1940-77f6-4512-b517-a1548cf10ec5"
USR = "ba70addb-fba3-4168-9954-9584b2fcd6d7"
BENCH = "b0559972-12f2-4dd5-b1a6-ffd876898896"
FREEZER = "419b6dea-f236-4c32-b6ff-0686fc73d77b"
ROOM = "ea454386-58d8-4647-8b58-dbda40f225ad"

headers = {
    "apikey": SB_KEY,
    "Authorization": f"Bearer {SB_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}


def post(table, data):
    r = requests.post(f"{SB_URL}/rest/v1/{table}", headers=headers, json=data, timeout=10)
    d = r.json()
    if isinstance(d, list) and len(d) > 0:
        return d[0]
    print(f"  ERROR ({table}): {d}")
    return None


# --- Inventory items ---
items = [
    {"name": "Pipette Tips (200uL)", "type": "consumable", "quantity": 15, "unit": "boxes", "min_threshold": 5, "location_id": BENCH, "manufacturer": "Rainin", "catalog_number": "30389218", "status": "in_stock"},
    {"name": "Taq Polymerase", "type": "reagent", "quantity": 2, "unit": "vials", "min_threshold": 3, "location_id": FREEZER, "manufacturer": "NEB", "catalog_number": "M0273", "status": "low_stock", "expiration_date": "2026-09-15"},
    {"name": "DMEM Cell Culture Media", "type": "reagent", "quantity": 6, "unit": "bottles", "min_threshold": 2, "location_id": FREEZER, "manufacturer": "Gibco", "catalog_number": "11965092", "status": "in_stock", "expiration_date": "2026-12-01"},
    {"name": "Ethanol (200 proof)", "type": "chemical", "quantity": 1, "unit": "L", "min_threshold": 2, "location_id": ROOM, "manufacturer": "Fisher Scientific", "catalog_number": "BP2818-4", "status": "low_stock"},
    {"name": "Nitrile Gloves (M)", "type": "consumable", "quantity": 8, "unit": "boxes", "min_threshold": 3, "location_id": BENCH, "manufacturer": "Kimberly-Clark", "status": "in_stock"},
    {"name": "PCR Tubes (0.2mL)", "type": "consumable", "quantity": 0, "unit": "packs", "min_threshold": 2, "location_id": BENCH, "manufacturer": "Eppendorf", "catalog_number": "0030124332", "status": "out_of_stock"},
    {"name": "BSA (Bovine Serum Albumin)", "type": "reagent", "quantity": 3, "unit": "g", "min_threshold": 1, "location_id": FREEZER, "manufacturer": "Sigma-Aldrich", "catalog_number": "A7906", "status": "in_stock", "expiration_date": "2027-03-01"},
    {"name": "Microcentrifuge Tubes (1.5mL)", "type": "consumable", "quantity": 20, "unit": "packs", "min_threshold": 5, "location_id": BENCH, "manufacturer": "Eppendorf", "status": "in_stock"},
]

print("Inserting inventory items...")
for item in items:
    item["lab_id"] = LAB
    item["created_by"] = USR
    d = post("inventory_items", item)
    if d:
        print(f"  + {d['name']}")

# --- Equipment items ---
equip_items = [
    {"name": "Analytical Balance", "type": "equipment", "quantity": 1, "unit": "unit", "min_threshold": 0, "location_id": BENCH, "manufacturer": "Mettler Toledo", "catalog_number": "ME204", "status": "in_stock"},
    {"name": "Vortex Mixer", "type": "equipment", "quantity": 1, "unit": "unit", "min_threshold": 0, "location_id": BENCH, "manufacturer": "Scientific Industries", "catalog_number": "SI-0236", "status": "in_stock"},
    {"name": "Centrifuge", "type": "equipment", "quantity": 1, "unit": "unit", "min_threshold": 0, "location_id": ROOM, "manufacturer": "Eppendorf", "catalog_number": "5424R", "status": "in_stock"},
]

print("\nInserting equipment...")
equip_inv_ids = []
for item in equip_items:
    item["lab_id"] = LAB
    item["created_by"] = USR
    d = post("inventory_items", item)
    if d:
        equip_inv_ids.append(d["id"])
        print(f"  + {d['name']}")

# Equipment detail records
equipment_data = [
    {"inventory_item_id": equip_inv_ids[0], "serial_number": "B123456789", "model_number": "ME204", "purchase_date": "2024-06-15", "purchase_price": 3200, "warranty_expires": "2027-06-15", "calibration_interval_days": 90, "last_calibrated": "2026-01-10", "status": "active"},
    {"inventory_item_id": equip_inv_ids[1], "serial_number": "V987654321", "model_number": "SI-0236", "purchase_date": "2023-03-01", "purchase_price": 450, "warranty_expires": "2026-03-01", "status": "active"},
    {"inventory_item_id": equip_inv_ids[2], "serial_number": "C555666777", "model_number": "5424R", "purchase_date": "2025-01-20", "purchase_price": 8500, "warranty_expires": "2028-01-20", "calibration_interval_days": 180, "last_calibrated": "2025-11-15", "status": "active"},
]

for eq in equipment_data:
    d = post("equipment", eq)
    if d:
        print(f"  + Equipment detail: {d['id']}")

# --- Grant ---
print("\nInserting grant...")
grant = {
    "lab_id": LAB,
    "created_by": USR,
    "name": "NIH R01 AG-67890",
    "funder": "NIH/NIA",
    "grant_number": "R01AG067890",
    "total_amount": 250000,
    "start_date": "2025-07-01",
    "end_date": "2028-06-30",
    "categories": json.dumps([
        {"name": "Supplies", "allocated": 40000},
        {"name": "Equipment", "allocated": 60000},
        {"name": "Travel", "allocated": 15000},
        {"name": "Personnel", "allocated": 135000},
    ]),
}
d = post("grants", grant)
grant_id = d["id"]
print(f"  + {d['name']} ({grant_id})")

# --- Transactions ---
print("\nInserting transactions...")
txns = [
    {"amount": 3200, "date": "2025-08-15", "description": "Mettler Toledo Balance ME204", "category": "Equipment"},
    {"amount": 450, "date": "2025-09-01", "description": "Vortex Mixer SI-0236", "category": "Equipment"},
    {"amount": 8500, "date": "2026-01-20", "description": "Eppendorf Centrifuge 5424R", "category": "Equipment"},
    {"amount": 285, "date": "2026-01-05", "description": "Pipette tips (5 boxes)", "category": "Supplies"},
    {"amount": 520, "date": "2026-01-15", "description": "NEB reagents order", "category": "Supplies"},
    {"amount": 175, "date": "2026-02-01", "description": "Gloves and tubes", "category": "Supplies"},
    {"amount": 1200, "date": "2026-02-10", "description": "AACR Conference registration", "category": "Travel"},
]

for tx in txns:
    tx["grant_id"] = grant_id
    tx["created_by"] = USR
    d = post("transactions", tx)
    if d:
        print(f"  + ${tx['amount']} - {tx['description']}")

# --- Activity log ---
print("\nInserting activity log...")
activities = [
    {"action": "item_added", "entity_type": "inventory_item", "details": json.dumps({"name": "Pipette Tips (200uL)"})},
    {"action": "quantity_changed", "entity_type": "inventory_item", "details": json.dumps({"name": "Taq Polymerase", "old_quantity": 5, "new_quantity": 2})},
    {"action": "item_added", "entity_type": "inventory_item", "details": json.dumps({"name": "Analytical Balance"})},
    {"action": "maintenance_logged", "entity_type": "equipment", "details": json.dumps({"name": "Analytical Balance", "type": "calibration"})},
    {"action": "item_updated", "entity_type": "inventory_item", "details": json.dumps({"name": "PCR Tubes (0.2mL)", "status": "out_of_stock"})},
]

for a in activities:
    a["lab_id"] = LAB
    a["user_id"] = USR
    post("activity_log", a)

print("  + 5 activity entries")

print("\n=== DONE ===")
print("Login: demo@conductscience.com / demo1234")
print("Lab: He Lab (/he-lab)")
