from fastapi import FastAPI
import logging

from fastapi.middleware.cors import CORSMiddleware
from routes.servicios import router as servicios_router
from routes.auth import router as auth_router

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('petcare.log')
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def saludar():
    logger.info("Endpoint / accedido")
    return {"mensaje": "¡Hola! Bienvenido a mi API"}

@app.get("/bienvenido/{nombre}")
def saludar_persona(nombre: str):
    logger.info(f"Endpoint /bienvenido/{nombre} accedido")
    return {"mensaje": f"Hola {nombre}, ¡qué bueno verte por aquí!"}

app.include_router(servicios_router)
app.include_router(auth_router)
