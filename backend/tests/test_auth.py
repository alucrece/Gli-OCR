def test_register_success(client):
    response = client.post("/auth/register", json={
        "email": "test@test.com",
        "password": "motdepasse123",
        "nom": "Test",
        "prenom": "User"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@test.com"
    assert data["nom"] == "Test"
    assert data["prenom"] == "User"
    assert "id" in data
    assert "hashed_password" not in data

def test_register_duplicate_email(client):
    client.post("/auth/register", json={
        "email": "test@test.com",
        "password": "motdepasse123",
        "nom": "Test",
        "prenom": "User"
    })
    response = client.post("/auth/register", json={
        "email": "test@test.com",
        "password": "autremdp",
        "nom": "Autre",
        "prenom": "User"
    })
    assert response.status_code == 400

def test_login_success(client):
    client.post("/auth/register", json={
        "email": "test@test.com",
        "password": "motdepasse123",
        "nom": "Test",
        "prenom": "User"
    })
    response = client.post("/auth/login", data={
        "username": "test@test.com",
        "password": "motdepasse123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password(client):
    client.post("/auth/register", json={
        "email": "test@test.com",
        "password": "motdepasse123",
        "nom": "Test",
        "prenom": "User"
    })
    response = client.post("/auth/login", data={
        "username": "test@test.com",
        "password": "mauvaismdp"
    })
    assert response.status_code == 401

def test_login_unknown_email(client):
    response = client.post("/auth/login", data={
        "username": "inconnu@test.com",
        "password": "motdepasse123"
    })
    assert response.status_code == 401

def test_get_me_authenticated(client):
    client.post("/auth/register", json={
        "email": "test@test.com",
        "password": "motdepasse123",
        "nom": "Test",
        "prenom": "User"
    })
    login = client.post("/auth/login", data={
        "username": "test@test.com",
        "password": "motdepasse123"
    })
    token = login.json()["access_token"]
    response = client.get("/auth/me", headers={
        "Authorization": f"Bearer {token}"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@test.com"

def test_get_me_unauthenticated(client):
    response = client.get("/auth/me")
    assert response.status_code == 401