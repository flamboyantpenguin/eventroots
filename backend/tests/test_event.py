def test_templates(client):
    res = client.get("/api/templates")
    assert res.status_code == 200
    templates = res.json()["data"]
    assert len(templates) == 5
    assert templates[0]["title"] == "Wedding"


def test_events_crud(client):
    listed = client.get("/api/events")
    assert listed.status_code == 200
    assert len(listed.json()["data"]) == 4

    created = client.post(
        "/api/events",
        json={
            "title": "New Meetup",
            "status": "Planning",
            "progress": "5%",
            "image": "https://example.com/img.jpg",
        },
    )
    assert created.status_code == 201
    event_id = created.json()["data"]["id"]

    updated = client.put(
        f"/api/events/{event_id}",
        json={"progress": "10%"},
    )
    assert updated.status_code == 200
    assert updated.json()["data"]["progress"] == "10%"

    deleted = client.delete(f"/api/events/{event_id}")
    assert deleted.status_code == 200
