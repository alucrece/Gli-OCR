def get_auth_token_and_bien(client):
    """Helper pour récupérer un token JWT et créer un bien"""
    client.post("/auth/register", json={
        "email": "owner@test.com",
        "password": "motdepasse123",
        "nom": "Owner",
        "prenom": "Test"
    })
    response = client.post("/auth/login", data={
        "username": "owner@test.com",
        "password": "motdepasse123"
    })
    token = response.json()["access_token"]
    bien = client.post("/biens/", json={
        "adresse": "12 rue de la Paix",
        "ville": "Paris",
        "code_postal": "75001",
        "surface": 45.0,
        "loyer_mensuel": 1200.0,
        "charges_mensuelles": 150.0
    }, headers={"Authorization": f"Bearer {token}"})
    return token, bien.json()["id"]

def test_create_locataire_authenticated(client):
    token, bien_id = get_auth_token_and_bien(client)
    response = client.post("/locataires/", json={
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@test.com",
        "telephone": "0612345678",
        "date_entree": "2026-01-01",
        "depot_garantie": 2400.0,
        "bien_id": bien_id
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 201
    data = response.json()
    assert data["nom"] == "Dupont"
    assert data["prenom"] == "Jean"
    assert data["bien_id"] == bien_id

def test_create_locataire_unauthenticated(client):
    response = client.post("/locataires/", json={
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@test.com",
        "date_entree": "2026-01-01",
        "depot_garantie": 2400.0,
        "bien_id": 1
    })
    assert response.status_code == 401

def test_get_locataires_empty(client):
    token, _ = get_auth_token_and_bien(client)
    response = client.get("/locataires/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json() == []

def test_get_locataires_after_creation(client):
    token, bien_id = get_auth_token_and_bien(client)
    client.post("/locataires/", json={
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@test.com",
        "date_entree": "2026-01-01",
        "depot_garantie": 2400.0,
        "bien_id": bien_id
    }, headers={"Authorization": f"Bearer {token}"})
    response = client.get("/locataires/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert len(response.json()) == 1

def test_create_locataire_bien_inexistant(client):
    token, _ = get_auth_token_and_bien(client)
    response = client.post("/locataires/", json={
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@test.com",
        "date_entree": "2026-01-01",
        "depot_garantie": 2400.0,
        "bien_id": 999
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 404

def test_delete_locataire(client):
    token, bien_id = get_auth_token_and_bien(client)
    create = client.post("/locataires/", json={
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@test.com",
        "date_entree": "2026-01-01",
        "depot_garantie": 2400.0,
        "bien_id": bien_id
    }, headers={"Authorization": f"Bearer {token}"})
    locataire_id = create.json()["id"]
    response = client.delete(
        f"/locataires/{locataire_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 204