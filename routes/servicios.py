from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import List
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

servicios_db = [
    {"nombre": "consulta", "precio": 50},
    {"nombre": "baño", "precio": 60},
    {"nombre": "corte", "precio": 100}
]

mascotas_db = []

class ServicioBase(BaseModel):
    nombre: str
    precio: float

class MascotaBase(BaseModel):
    correo: EmailStr
    nombre: str
    tipo_servicio: str
    fecha: str

@router.get("/servicios")
def listar_servicios():
    logger.info("Listando servicios")
    return {
        "servicios": servicios_db
    }

@router.post("/agregar-servicio")
def agregar_servicio(request: ServicioBase):
    if request.precio <= 0:
        logger.warning(f"Intento de agregar servicio con precio inválido: {request.nombre} - {request.precio}")
        raise HTTPException(status_code=400, detail="El precio debe ser mayor a 0")
    
    nuevo = {"nombre": request.nombre, "precio": request.precio}
    servicios_db.append(nuevo)
    logger.info(f"Servicio agregado: {request.nombre} - ${request.precio}")
    return {
        "mensaje": "¡Servicio guardado!"
    }

@router.post("/registrar-mascota")
def registrar_mascota(request: MascotaBase):
    # Verificar que el servicio existe
    servicio_existe = any(s["nombre"] == request.tipo_servicio for s in servicios_db)
    if not servicio_existe:
        logger.warning(f"Intento de registrar mascota con servicio inexistente: {request.tipo_servicio}")
        raise HTTPException(status_code=400, detail="El servicio especificado no existe")
    
    mascota = {
        "correo": request.correo,
        "nombre": request.nombre,
        "tipo_servicio": request.tipo_servicio,
        "fecha": request.fecha
    }
    mascotas_db.append(mascota)
    logger.info(f"Mascota registrada: {request.nombre} para {request.correo}")
    return {
        "mensaje": "Mascota registrada exitosamente",
        "mascota": mascota
    }

@router.get("/mascotas/{correo}")
def listar_mascotas_usuario(correo: EmailStr):
    logger.info(f"Listando mascotas para: {correo}")
    mascotas_usuario = [m for m in mascotas_db if m["correo"] == correo]
    return {
        "correo": correo,
        "mascotas": mascotas_usuario
    }

@router.get("/reporte/{correo}")
def reporte_usuario(correo: EmailStr):
    logger.info(f"Generando reporte para: {correo}")
    mascotas_usuario = [m for m in mascotas_db if m["correo"] == correo]
    servicios_registrados = [m["tipo_servicio"] for m in mascotas_usuario]
    cantidad_servicios = len(mascotas_usuario)
    
    total_gastado = 0
    for mascota in mascotas_usuario:
        servicio = next((s for s in servicios_db if s["nombre"] == mascota["tipo_servicio"]), None)
        if servicio:
            total_gastado += servicio["precio"]
    
    logger.info(f"Reporte generado para {correo}: {cantidad_servicios} servicios, total ${total_gastado}")
    return {
        "correo": correo,
        "cantidad_servicios": cantidad_servicios,
        "servicios": list(set(servicios_registrados)),  # unique services
        "total_gastado": total_gastado
    }