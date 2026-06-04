def test_signup_and_login(client):
    signup = client.post(
        "/api/auth/signup",
        json={"username": "riya", "email": "riya@example.com", "password": "secret12"},
    )
    assert signup.status_code == 201
    assert "access_token" in signup.json()["data"]

    login = client.post(
        "/api/auth/login",
        json={"email": "riya@example.com", "password": "secret12"},
    )
    assert login.status_code == 200
    assert login.json()["data"]["user"]["username"] == "riya"
