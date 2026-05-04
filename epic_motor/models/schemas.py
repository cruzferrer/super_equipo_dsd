"""
Modelos Pydantic que reflejan exactamente los contratos JSON acordados:
  - ElementoIn / ElementoOut  ←→  elementos.json
  - ConjuntoIn / ConjuntoOut  ←→  conjuntos.json
  - Accion                    ←→  acciones.json  (generado por el Motor)
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator
from ..logic.belnap import BV, bv_from_str


# ─────────────────────────────────────────────
#  elementos.json
# ─────────────────────────────────────────────

class AtributosVisualesElemento(BaseModel):
    posicion: Dict[str, float] = Field(default_factory=lambda: {"x": 0.0, "y": 0.0})
    color:    Optional[str]    = None   # el Motor lo asigna según valor_verdad

    model_config = {"extra": "allow"}


class ElementoIn(BaseModel):
    """Elemento tal como llega del Editor."""
    id:                str
    valor_verdad:      str                        = "N"
    pertenencia:       List[str]                  = Field(default_factory=list)
    proviene:          List[str]                  = Field(default_factory=list)
    atributos_visuales: AtributosVisualesElemento = Field(
                            default_factory=AtributosVisualesElemento)

    @field_validator("valor_verdad", mode="before")
    @classmethod
    def normalizar_bv(cls, v: Any) -> str:
        return bv_from_str(str(v)).value

    @property
    def bv(self) -> BV:
        return BV(self.valor_verdad)


class ElementoOut(ElementoIn):
    """Elemento con el valor_verdad final calculado por el Motor."""
    valor_verdad_inicial: str = ""   # preserva el valor de entrada para trazabilidad

    @classmethod
    def from_in(cls, e: ElementoIn) -> "ElementoOut":
        data = e.model_dump()
        data["valor_verdad_inicial"] = e.valor_verdad
        return cls(**data)


# ─────────────────────────────────────────────
#  conjuntos.json
# ─────────────────────────────────────────────

class AtributosVisualesConjunto(BaseModel):
    radio: float          = 50.0
    forma: str            = "elipse"
    posicion: Dict[str, float] = Field(default_factory=lambda: {"x": 0.0, "y": 0.0})

    model_config = {"extra": "allow"}


class ConjuntoIn(BaseModel):
    """Conjunto / contenedor tal como llega del Editor."""
    id:                str
    subconjuntos:      List[str]                  = Field(default_factory=list)
    es_resultado_de:   Optional[str]              = None   # ej. "Z" para p→q renombrado
    conectivo:         str                        = "PROPAGATION"
    atributos_visuales: AtributosVisualesConjunto = Field(
                            default_factory=AtributosVisualesConjunto)


# ─────────────────────────────────────────────
#  acciones.json  (salida del Motor)
# ─────────────────────────────────────────────

class TipoAccion(str):
    PROPAGACION   = "propagacion"
    ESTABILIZACION = "estabilizacion"
    CAMBIO_NOMBRE  = "cambio_nombre"
    CONTRAPOSICION = "contraposicion"


class Accion(BaseModel):
    """Una acción / evento generado durante la estabilización del Motor."""
    paso:            int               # número de iteración
    tipo_accion:     str               # TipoAccion.*
    elemento_id:     str
    origen:          Optional[str]     = None
    destino:         Optional[str]     = None
    valor_anterior:  Optional[str]     = None
    valor_resultante: str              = "N"
    conectivo_usado:  Optional[str]    = None
    descripcion:      str              = ""


# ─────────────────────────────────────────────
#  Payload de entrada/salida de la API
# ─────────────────────────────────────────────

class MotorInput(BaseModel):
    elementos: List[ElementoIn]
    conjuntos: List[ConjuntoIn]
    max_iteraciones: int = Field(default=100, ge=1, le=500)


class MotorOutput(BaseModel):
    elementos: List[ElementoOut]
    conjuntos: List[ConjuntoIn]
    acciones:  List[Accion]
    iteraciones_realizadas: int
    estabilizado: bool
    resumen: Dict[str, Any] = Field(default_factory=dict)
