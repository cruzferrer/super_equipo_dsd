"""
API REST del Motor EPIC — FastAPI.

Endpoints:
  POST /calcular          Ejecuta la propagación completa.
  GET  /conectivos        Lista los conectivos disponibles.
  GET  /health            Health-check simple.

CORS habilitado para localhost:3000 (React dev server).
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from ..models.schemas import MotorInput, MotorOutput
from ..engine.propagation import run
from ..logic.connectives import REGISTRY

app = FastAPI(
    title="EPIC Playground — Motor de Cálculo",
    description=(
        "Motor de propagación basado en la lógica cuatrivalente de Belnap. "
        "Recibe elementos y conjuntos en formato JSON y devuelve el estado "
        "estabilizado junto con la secuencia de acciones para el Visualizador."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────

@app.get("/health", tags=["Sistema"])
def health():
    return {"status": "ok", "motor": "EPIC Playground v1.0"}


@app.get("/conectivos", tags=["Motor"])
def listar_conectivos():
    """
    Devuelve la lista de conectivos disponibles junto con sus tablas de verdad.
    """
    result = {}
    order = ["V", "F", "N", "B"]
    for name, conn in REGISTRY.items():
        tabla = {}
        for a in order:
            for b in order:
                from ..logic.belnap import BV
                tabla[f"{a}∧{b}"] = str(conn.apply(BV(a), BV(b)))
        result[name] = {"tabla": tabla}
    return result


@app.post(
    "/calcular",
    response_model=MotorOutput,
    tags=["Motor"],
    summary="Ejecutar propagación completa",
    response_description=(
        "Estado estabilizado: elementos con valores finales, "
        "lista de acciones para el Simulador/Visualizador."
    ),
)
def calcular(payload: MotorInput) -> MotorOutput:
    """
    Recibe la definición estructural del Editor (elementos + conjuntos)
    y ejecuta el algoritmo de propagación hasta estabilización.

    **Respuesta**: elementos actualizados + `acciones.json` listo para
    ser consumido por el Visualizador React.
    """
    if not payload.elementos:
        raise HTTPException(status_code=422, detail="Se requiere al menos un elemento.")

    try:
        resultado = run(payload)
    except KeyError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del Motor: {e}")

    return resultado


# ─────────────────────────────────────────────
# Punto de entrada (desarrollo)
# ─────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("epic_motor.api.app:app", host="0.0.0.0", port=8000, reload=True)
