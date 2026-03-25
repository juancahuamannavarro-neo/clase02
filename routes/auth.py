from fastapi import APIRouter

router = APIRouter()

users_db = []  # Lista temporal para simular base de datos de usuarios

@router.post("/register")
def register(email: str, password: str):
    user_data = {"email": email, "password": password}
    users_db.append(user_data)
    return {
        "mensaje": "Usuario registrado exitosamente",
        "datos": user_data
    }

@router.post("/login")
def login(email: str, password: str):
    user_data = {"email": email, "password": password}
    users_db.append(user_data)  # Para simular el flujo de login
    return {
        "mensaje": "Login exitoso",
        "datos": user_data
    }