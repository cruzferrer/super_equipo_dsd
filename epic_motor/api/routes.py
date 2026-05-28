from fastapi import APIRouter
from models.snapshot import PlaygroundSnapshot
from services.engine import run_propagation
from core.connectives import REGISTRY

router = APIRouter()

@router.get("/health")
async def health():
    return {"status": "ok", "motor": "EPIC Playground v3.0"}

@router.get("/conectivos")
async def get_conectivos():
    # Return dictionary with connectives as keys as expected by the TS client
    return {name: {} for name in REGISTRY.keys()}

@router.post("/calcular", response_model=PlaygroundSnapshot)
async def calcular_propagacion(snapshot: PlaygroundSnapshot):
    """
    Recibe el estado completo del EPiC Playground, ignora la capa visual,
    procesa la propagación lógica y devuelve el estado con el execution_trace.
    """
    # Pasamos el JSON tipado directo al motor
    resultado_mutado = run_propagation(snapshot)
    
    return resultado_mutado