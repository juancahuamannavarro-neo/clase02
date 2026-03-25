from fastapi import APIRouter

router = APIRouter()

servicios_db = [
    {"nombre": "consulta", "precio": 50},
    {"nombre": "baño", "precio": 60},
    {"nombre": "corte", "precio": 100}
]

mascotas_db = []

@router.get("/servicios")
def listar_servicios():
    return {
        "servicios": servicios_db
    }

@router.post("/agregar-servicio")
def agregar_servicio(nuevo: dict):
    servicios_db.append(nuevo)
    return {
        "mensaje": "¡Servicio guardado!"
    }

@router.post("/registrar-mascota")
def registrar_mascota(correo: str, nombre_mascota: str, tipo_servicio: str, fecha: str):
    mascota = {
        "correo": correo,
        "nombre_mascota": nombre_mascota,
        "tipo_servicio": tipo_servicio,
        "fecha": fecha
    }
    mascotas_db.append(mascota)
    return {
        "mensaje": "Mascota registrada exitosamente",
        "mascota": mascota
    }

@router.get("/mascotas/{correo}")
def listar_mascotas_usuario(correo: str):
    mascotas_usuario = [m for m in mascotas_db if m["correo"] == correo]
    return {
        "correo": correo,
        "mascotas": mascotas_usuario
    }

@router.get("/reporte/{correo}")
def reporte_usuario(correo: str):
    mascotas_usuario = [m for m in mascotas_db if m["correo"] == correo]
    servicios_registrados = [m["tipo_servicio"] for m in mascotas_usuario]
    cantidad_servicios = len(mascotas_usuario)
    
    total_gastado = 0
    for mascota in mascotas_usuario:
        servicio = next((s for s in servicios_db if s["nombre"] == mascota["tipo_servicio"]), None)
        if servicio:
            total_gastado += servicio["precio"]
    
    return {
        "correo": correo,
        "cantidad_servicios": cantidad_servicios,
        "servicios": list(set(servicios_registrados)),  # unique services
        "total_gastado": total_gastado
    }