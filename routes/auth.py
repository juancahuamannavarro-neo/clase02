from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

users_db = []  # Lista temporal para simular base de datos de usuarios

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
def register(request: RegisterRequest):
    # Verificar si el usuario ya existe
    if any(u["email"] == request.email for u in users_db):
        logger.warning(f"Intento de registro con email ya existente: {request.email}")
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    
    user_data = {"email": request.email, "password": request.password}
    users_db.append(user_data)
    logger.info(f"Usuario registrado: {request.email}")
    return {
        "mensaje": "Usuario registrado exitosamente",
        "datos": user_data
    }

@router.post("/login")
def login(request: LoginRequest):
    # Verificar si el usuario existe y la contraseña coincide
    user = next((u for u in users_db if u["email"] == request.email and u["password"] == request.password), None)
    if not user:
        logger.warning(f"Intento de login fallido para: {request.email}")
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    logger.info(f"Login exitoso para: {request.email}")
    return {
        "mensaje": "Login exitoso",
        "datos": user
    }