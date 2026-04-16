import csv
import io
import json
import re

csv_content = """name,address,phone_number,email,password,warehouse_id,latitude,longitude,type,store_image,active,salespersonid
Anno_SFPL,NAGOLE,9123456701,store001@example.com,Oms123Sneha!,185a7c59-c1ea-4f1a-9735-c39f04207760,17.436044,78.661495,own,,active,f88c001b-8dd6-438b-a21f-ebccb73d0da8"""

def map_headers(header):
    h = header.lower().strip()
    if h in ["lat", "latitude", "latitutde"]: return "latitude"
    if h in ["lng", "long", "longitude", "longitutde"]: return "longitude"
    if h in ["phone", "phoneno", "phone_number", "phone number", "mobile"]: return "phone_number"
    if h in ["email", "email_address", "email address"]: return "email"
    if h in ["name", "customer_name", "customer name", "store name", "store_name"]: return "name"
    if h in ["address", "customer_address", "customer address", "location"]: return "address"
    if h in ["salesperson", "salesperson_id", "salespersonid"]: return "salespersonid"
    if h in ["warehouse", "warehouse_id", "warehouseid"]: return "warehouse_id"
    return re.sub(r'\s+', '_', h)

def parse_coord(v):
    if v is None or v == "": return None
    s = str(v).strip()
    if s == "": return None
    parsed_str = re.sub(r'[^\d.-]', '', s)
    try:
        return float(parsed_str)
    except ValueError:
        return "NaN"

def test_parse():
    f = io.StringIO(csv_content)
    reader = csv.reader(f)
    headers = next(reader)
    mapped_headers = [map_headers(h) for h in headers]
    
    rows = []
    for row in reader:
        rows.append(dict(zip(mapped_headers, row)))

    print("Parsed Rows:")
    print(json.dumps(rows, indent=2))

    for r in rows:
        lat = parse_coord(r.get("latitude"))
        long = parse_coord(r.get("longitude"))
        print(f"Row: {r.get('name')}")
        print(f"  lat: {lat}")
        print(f"  long: {long}")

if __name__ == "__main__":
    test_parse()
