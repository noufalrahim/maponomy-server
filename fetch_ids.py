import psycopg2
import json

def fetch_ids():
    conn_params = {
        "host": "localhost",
        "port": 9201,
        "database": "maponomypoultry_dev",
        "user": "maponomy_user",
        "password": "maponomy_pass"
    }

    try:
        conn = psycopg2.connect(**conn_params)
        cur = conn.cursor()

        # Fetch warehouses
        cur.execute("SELECT id, name FROM warehouses LIMIT 5;")
        warehouses = [{"id": row[0], "name": row[1]} for row in cur.fetchall()]

        # Fetch salespersons
        cur.execute("SELECT id, name FROM sales_persons LIMIT 5;")
        salespersons = [{"id": row[0], "name": row[1]} for row in cur.fetchall()]

        print("--- WAREHOUSES ---")
        print(json.dumps(warehouses, indent=2))
        print("--- SALESPERSONS ---")
        print(json.dumps(salespersons, indent=2))

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error fetching IDs: {e}")

if __name__ == "__main__":
    fetch_ids()
