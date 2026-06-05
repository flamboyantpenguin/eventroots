from fastapi import APIRouter
import psycopg2

router = APIRouter(prefix="/vendor", tags=["vendor"])


def get_connection():
    return psycopg2.connect(
        host="localhost",
        port=5432,
        database="erdb0",
        user="postgres",
        password="1234"
    )

@router.get("")
def get_vendors():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT v.id, v.name, c.name, v.location, v.data, v.created_at, v.updated_at
        FROM vendors v
        JOIN category c ON v.category_id = c.id
        ORDER BY v.created_at DESC
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    vendors = []

    for row in rows:
        vendors.append({
            "vendor_id": str(row[0]),
            "name": row[1],
            "category": row[2],
            "location": row[3],
            "data": row[4],
            "created_at": str(row[5]),
            "updated_at": str(row[6])
        })

    return {
        "status": "success",
        "vendors": vendors
    }