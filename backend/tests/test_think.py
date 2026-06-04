def test_think_chat(client):
    res = client.post(
        "/api/think/chat",
        json={"message": "Update Guest List Details", "history": []},
    )
    assert res.status_code == 200
    content = res.json()["data"]["content"]
    assert "Guest Ledger" in content
