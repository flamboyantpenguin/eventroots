def test_list_users(client):
    res = client.get("/api/users")
    assert res.status_code == 200
    users = res.json()["data"]
    assert len(users) == 12
    assert users[0]["name"] == "Ananya Das"


def test_create_and_delete_user(client):
    payload = {
        "name": "Test User",
        "email": "test@example.com",
        "event": "Wedding",
        "status": "active",
    }
    created = client.post("/api/users", json=payload)
    assert created.status_code == 201
    user_id = created.json()["data"]["id"]

    deleted = client.delete(f"/api/users/{user_id}")
    assert deleted.status_code == 200


def test_list_vendors_with_filters(client):
    res = client.get("/api/vendors", params={"category": "Catering", "sort": "name-asc"})
    assert res.status_code == 200
    vendors = res.json()["data"]
    assert all(v["category"] == "Catering" for v in vendors)


def test_vendor_meta(client):
    cats = client.get("/api/vendors/meta/categories")
    locs = client.get("/api/vendors/meta/locations")
    assert cats.status_code == 200
    assert locs.status_code == 200
    assert "Catering" in cats.json()["data"]
    assert "Kochi" in locs.json()["data"]
