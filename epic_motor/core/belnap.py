"""
Lógica de Belnap de cuatro valores (FOUR / Bilattice FOUR).

Dominio: {V, F, N, B}
  V = Verdad          (solo evidencia positiva)
  F = Falsedad        (solo evidencia negativa)
  N = Ninguna         (sin evidencia — neutro)
  B = Ambos           (evidencia positiva Y negativa — contradicción)

Dos operaciones fundamentales del retículo:
  - meet (∧) sobre el orden de VERDAD   (t-order): V>N, V>B, F>N, F>B
  - join (∨) sobre el orden de VERDAD
  - meet (⊗) sobre el orden de INFORMACIÓN (k-order): B>V, B>F, V>N, F>N

Las matrices de transición del Motor extienden estos operadores para
modelar la propagación de valores entre elementos y conjuntos.
"""

from enum import Enum
from typing import Dict, Tuple


class BV(str, Enum):
    """Valores de Belnap."""
    V = "V"   # Verdad
    F = "F"   # Falsedad
    N = "N"   # Ninguna (None / unknown)
    B = "B"   # Ambos   (Both  / contradiction)

    def __str__(self) -> str:
        return self.value


# ─────────────────────────────────────────────
# Tablas de verdad para AND, OR, NOT
# ─────────────────────────────────────────────

_AND: Dict[Tuple[str, str], BV] = {
    (BV.V, BV.V): BV.V, (BV.V, BV.F): BV.F, (BV.V, BV.N): BV.N, (BV.V, BV.B): BV.B,
    (BV.F, BV.V): BV.F, (BV.F, BV.F): BV.F, (BV.F, BV.N): BV.F, (BV.F, BV.B): BV.F,
    (BV.N, BV.V): BV.N, (BV.N, BV.F): BV.F, (BV.N, BV.N): BV.N, (BV.N, BV.B): BV.N,
    (BV.B, BV.V): BV.B, (BV.B, BV.F): BV.F, (BV.B, BV.N): BV.N, (BV.B, BV.B): BV.B,
}

_OR: Dict[Tuple[str, str], BV] = {
    (BV.V, BV.V): BV.V, (BV.V, BV.F): BV.V, (BV.V, BV.N): BV.V, (BV.V, BV.B): BV.V,
    (BV.F, BV.V): BV.V, (BV.F, BV.F): BV.F, (BV.F, BV.N): BV.F, (BV.F, BV.B): BV.B,
    (BV.N, BV.V): BV.V, (BV.N, BV.F): BV.F, (BV.N, BV.N): BV.N, (BV.N, BV.B): BV.B,
    (BV.B, BV.V): BV.V, (BV.B, BV.F): BV.B, (BV.B, BV.N): BV.B, (BV.B, BV.B): BV.B,
}

_NOT: Dict[str, BV] = {
    BV.V: BV.F,
    BV.F: BV.V,
    BV.N: BV.N,
    BV.B: BV.B,
}

# Unión de información (k-join): combina evidencia de dos fuentes
# N < V, N < F, V < B, F < B  →  join produce el valor "más informado"
_KJOIN: Dict[Tuple[str, str], BV] = {
    (BV.N, BV.N): BV.N, (BV.N, BV.V): BV.V, (BV.N, BV.F): BV.F, (BV.N, BV.B): BV.B,
    (BV.V, BV.N): BV.V, (BV.V, BV.V): BV.V, (BV.V, BV.F): BV.B, (BV.V, BV.B): BV.B,
    (BV.F, BV.N): BV.F, (BV.F, BV.V): BV.B, (BV.F, BV.F): BV.F, (BV.F, BV.B): BV.B,
    (BV.B, BV.N): BV.B, (BV.B, BV.V): BV.B, (BV.B, BV.F): BV.B, (BV.B, BV.B): BV.B,
}


def bv_and(a: BV, b: BV) -> BV:
    return _AND[(a, b)]

def bv_or(a: BV, b: BV) -> BV:
    return _OR[(a, b)]

def bv_not(a: BV) -> BV:
    return _NOT[a]

def bv_kjoin(a: BV, b: BV) -> BV:
    """Combina evidencia de dos fuentes (k-order join). Usada en propagación."""
    return _KJOIN[(a, b)]

def bv_from_str(s: str) -> BV:
    """Convierte string a BV, insensible a mayúsculas."""
    mapping = {"v": BV.V, "f": BV.F, "n": BV.N, "b": BV.B,
               "true": BV.V, "false": BV.F, "none": BV.N, "both": BV.B}
    try:
        return BV(s.upper())
    except ValueError:
        return mapping.get(s.lower(), BV.N)
