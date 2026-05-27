from __future__ import annotations
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator
from core.belnap import BV, bv_from_str

# ─────────────────────────────────────────────
#  1. Capa Lógica (Lo único que lee el Motor)
# ─────────────────────────────────────────────

class LogicVariable(BaseModel):
    id: str
    value: str = "N"  # V, F, N, B
    
    @field_validator("value", mode="before")
    @classmethod
    def normalizar_bv(cls, v: Any) -> str:
        return bv_from_str(str(v)).value

    @property
    def bv(self) -> BV:
        return BV(self.value)

class LogicSet(BaseModel):
    id: str
    elements: List[str] = Field(default_factory=list)

class LogicRelation(BaseModel):
    id: str
    source: str
    target: str
    connective: str = "PROPAGATION"
    is_contrapositive: bool = False

class LogicGraph(BaseModel):
    variables: Dict[str, LogicVariable] = Field(default_factory=dict)
    sets: Dict[str, LogicSet] = Field(default_factory=dict)
    relations: Dict[str, LogicRelation] = Field(default_factory=dict)

# ─────────────────────────────────────────────
#  2. Capa de Ejecución (La historia para Gonzalo)
# ─────────────────────────────────────────────

class ExecutionAction(BaseModel):
    step: int
    variable_id: str
    old_value: str
    new_value: str
    description: str
    is_stabilized: bool = False

class ExecutionTrace(BaseModel):
    actions: List[ExecutionAction] = Field(default_factory=list)
    stabilized: bool = False
    total_iterations: int = 0

# ─────────────────────────────────────────────
#  3. Metadatos y Capa Visual (Ceguera Espacial)
# ─────────────────────────────────────────────

class PlaygroundMeta(BaseModel):
    max_iterations: int = Field(default=100, ge=1, le=500)
    version: str = "1.1"

class PlaygroundSnapshot(BaseModel):
    """Contrato Único de Verdad (Shared Domain.json)"""
    meta: PlaygroundMeta = Field(default_factory=PlaygroundMeta)
    logic: LogicGraph = Field(default_factory=LogicGraph)
    visual: Dict[str, Any] = Field(default_factory=dict) # ¡Ignoramos el contenido visual!
    execution_trace: Optional[ExecutionTrace] = None