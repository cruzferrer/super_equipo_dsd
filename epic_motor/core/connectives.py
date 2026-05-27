"""
Conectivos matriciales para el Motor de propagación EPIC.

Un conectivo es una función BV × BV → BV representada como una
matriz 4×4.  El Motor puede combinar conectivos en cadena para
modelar implicación, bicondicional, etc.

Orden canónico de filas/columnas: [V, F, N, B]
"""

from __future__ import annotations
from typing import Dict, List
from .belnap import BV, bv_and, bv_or, bv_not, bv_kjoin


_ORDER: List[BV] = [BV.V, BV.F, BV.N, BV.B]
_IDX:   Dict[BV, int] = {v: i for i, v in enumerate(_ORDER)}


class Connective:
    """
    Matriz 4×4 que define una operación binaria BV × BV → BV.

    matrix[i][j]  donde  i = índice del primer argumento (fila)
                          j = índice del segundo argumento (columna)
    """

    def __init__(self, name: str, matrix: List[List[BV]]) -> None:
        assert len(matrix) == 4 and all(len(r) == 4 for r in matrix), \
            "La matriz debe ser 4×4"
        self.name   = name
        self.matrix = matrix

    def apply(self, a: BV, b: BV) -> BV:
        return self.matrix[_IDX[a]][_IDX[b]]

    def __repr__(self) -> str:         # tabla legible
        header = f"{'':5}" + "".join(f"{v:5}" for v in _ORDER)
        rows   = [header]
        for i, row_val in enumerate(_ORDER):
            row = f"{row_val!s:5}" + "".join(f"{self.matrix[i][j]!s:5}" for j in range(4))
            rows.append(row)
        return f"Conectivo '{self.name}':\n" + "\n".join(rows)


# ─────────────────────────────────────────────
# Conectivos predefinidos
# ─────────────────────────────────────────────

def _build(name: str, fn) -> Connective:
    matrix = [[fn(r, c) for c in _ORDER] for r in _ORDER]
    return Connective(name, matrix)


AND         = _build("AND",         bv_and)
OR          = _build("OR",          bv_or)
KJOIN       = _build("KJOIN",       bv_kjoin)

# Implicación material: a→b ≡ ¬a ∨ b
IMPLIES     = _build("IMPLIES",     lambda a, b: bv_or(bv_not(a), b))

# Bicondicional: (a→b) ∧ (b→a)
BICONDITIONAL = _build(
    "BICONDITIONAL",
    lambda a, b: bv_and(
        bv_or(bv_not(a), b),
        bv_or(bv_not(b), a)
    )
)

# Propagación directa: resultado = kjoin de ambos valores de evidencia
PROPAGATION = KJOIN

# Propagación contrapuesta (modus tollens):  ¬b → ¬a
CONTRAPOSITIONAL = _build(
    "CONTRAPOSITIONAL",
    lambda a, b: bv_or(bv_not(b), a)   # ¬b ∨ a
)

# Registro de todos los conectivos disponibles
REGISTRY: Dict[str, Connective] = {
    "AND":              AND,
    "OR":               OR,
    "IMPLIES":          IMPLIES,
    "BICONDITIONAL":    BICONDITIONAL,
    "PROPAGATION":      PROPAGATION,
    "CONTRAPOSITIONAL": CONTRAPOSITIONAL,
    "KJOIN":            KJOIN,
}


def get_connective(name: str) -> Connective:
    key = name.upper().replace("-", "_")
    if key not in REGISTRY:
        raise KeyError(
            f"Conectivo '{name}' no encontrado. "
            f"Disponibles: {list(REGISTRY.keys())}"
        )
    return REGISTRY[key]
