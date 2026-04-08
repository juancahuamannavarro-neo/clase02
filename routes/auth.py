from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

users_db = []  # Lista temporal para simular base de datos de usuarios

class RegisterRequest(BaseModel):
    correo: EmailStr
    contrasena: str

class LoginRequest(BaseModel):
    correo: EmailStr
    contrasena: str

@router.post("/register")
def register(request: RegisterRequest):
    # Validar longitud de contraseña
    if len(request.contrasena) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
    
    # Verificar si el usuario ya existe
    if any(u["correo"] == request.correo for u in users_db):
        logger.warning(f"Intento de registro con correo ya existente: {request.correo}")
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    
    user_data = {"correo": request.correo, "contrasena": request.contrasena}
    users_db.append(user_data)
    logger.info(f"Usuario registrado: {request.correo}")
    return {
        "mensaje": "Usuario registrado exitosamente",
        "datos": user_data
    }

@router.post("/login")
def login(request: LoginRequest):
    # Verificar si el usuario existe y la contraseña coincide
    user = next((u for u in users_db if u["correo"] == request.correo and u["contrasena"] == request.contrasena), None)
    if not user:
        logger.warning(f"Intento de login fallido para: {request.correo}")
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    logger.info(f"Login exitoso para: {request.correo}")
    return {
        "mensaje": "Login exitoso",
        "datos": user
    }