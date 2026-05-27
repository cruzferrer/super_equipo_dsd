from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router

app = FastAPI(
    title="EPiC Playground Logic Engine",
    description="Motor de Inferencia Matricial para lógica de Belnap",
    version="3.0.0"
)

# Configuración de CORS para permitir que el Editor web se comunique con el Motor
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, cambia esto por el dominio del Editor
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar las rutas
app.include_router(router)

@app.get("/")
def health_check():
    return {"status": "online", "message": "Motor EPiC operativo."}