"""
Motor de Propagación EPIC — núcleo de cálculo.

Algoritmo:
  1. Construir un grafo de dependencias Elemento → Conjuntos a los que pertenece.
  2. Para cada iteración:
       a. Por cada elemento, recolectar todos los valores de evidencia que
          llegan desde los conjuntos que lo contienen (usando el conectivo
          configurado en cada conjunto).
       b. Aplicar k-join de toda la evidencia recolectada sobre el valor
          actual del elemento.
       c. Si el valor cambió, registrar una Acción de propagación.
  3. Repetir hasta que ningún elemento cambie (estabilización) o se alcance
     el límite de iteraciones.
  4. Detectar cambios de variable (es_resultado_de) y emitir acciones
     de tipo "cambio_nombre".

Principios SOLID aplicados:
  - SRP: este módulo solo calcula; no parsea JSON ni renderiza.
  - OCP: agregar un nuevo conectivo = agregar entrada a REGISTRY en
         connectives.py; el Motor no cambia.
  - LSP: un subconjunto se trata exactamente igual que un conjunto raíz.
"""

from __future__ import annotations

import copy
from collections import defaultdict
from typing import Dict, List, Set, Tuple

from ..logic.belnap import BV, bv_kjoin
from ..logic.connectives import get_connective
from ..models.schemas import (
    Accion, ConjuntoIn, ElementoIn, ElementoOut,
    MotorInput, MotorOutput, TipoAccion,
)


# ─────────────────────────────────────────────
# Helpers internos
# ─────────────────────────────────────────────

_COLOR_MAP: Dict[BV, str] = {
    BV.V: "verde",
    BV.F: "rojo",
    BV.N: "gris",
    BV.B: "ambar",
}


def _color(bv: BV) -> str:
    return _COLOR_MAP.get(bv, "gris")


def _build_membership_index(
    conjuntos: List[ConjuntoIn],
    elementos: List[ElementoIn],
) -> Dict[str, List[str]]:
    """
    Devuelve  elem_id → [conjunto_id, ...]
    Infiere pertenencia tanto desde ElementoIn.pertenencia como desde
    la jerarquía de subconjuntos de ConjuntoIn.
    """
    index: Dict[str, List[str]] = defaultdict(list)

    # Pertenencia declarada explícitamente en cada elemento
    for elem in elementos:
        for cid in elem.pertenencia:
            if cid not in index[elem.id]:
                index[elem.id].append(cid)

    # Propagación por jerarquía: si C1 tiene subconjunto C2 y e1 ∈ C2,
    # entonces e1 también recibe influencia de C1.
    parent_of: Dict[str, List[str]] = defaultdict(list)
    for conj in conjuntos:
        for sub in conj.subconjuntos:
            parent_of[sub].append(conj.id)

    changed = True
    while changed:
        changed = False
        for eid, cids in list(index.items()):
            for cid in list(cids):
                for parent in parent_of.get(cid, []):
                    if parent not in index[eid]:
                        index[eid].append(parent)
                        changed = True

    return dict(index)


def _build_conjunto_map(conjuntos: List[ConjuntoIn]) -> Dict[str, ConjuntoIn]:
    return {c.id: c for c in conjuntos}


def _build_elemento_map(elementos: List[ElementoIn]) -> Dict[str, ElementoIn]:
    return {e.id: e for e in elementos}


# ─────────────────────────────────────────────
# Función principal del Motor
# ─────────────────────────────────────────────

def run(payload: MotorInput) -> MotorOutput:
    """
    Ejecuta la propagación completa y devuelve el estado estabilizado
    junto con la lista cronológica de acciones.
    """
    # ── Estado mutable (trabajamos con copias para no mutar la entrada) ──
    elementos: Dict[str, ElementoOut] = {
        e.id: ElementoOut.from_in(e)
        for e in payload.elementos
    }
    conjuntos: Dict[str, ConjuntoIn] = _build_conjunto_map(payload.conjuntos)

    membership = _build_membership_index(payload.conjuntos, payload.elementos)

    acciones: List[Accion] = []
    paso = 0

    # ── Iteración hasta estabilización ──
    for iteracion in range(1, payload.max_iteraciones + 1):
        paso = iteracion
        cambios_en_esta_iteracion: List[Tuple[str, BV, BV]] = []  # (id, antes, después)

        for eid, elem in elementos.items():
            valor_actual = elem.bv
            evidencia_acumulada: BV = valor_actual   # comenzamos con lo que ya sabemos

            conjuntos_origen = membership.get(eid, [])
            for cid in conjuntos_origen:
                conj = conjuntos.get(cid)
                if conj is None:
                    continue

                # El conjunto aporta su evidencia usando el conectivo configurado
                conectivo = get_connective(conj.conectivo)

                # La evidencia del conjunto = k-join de los valores de sus
                # elementos miembros (excluyendo el elemento en evaluación)
                miembros_del_conj: List[BV] = []
                for other_id, other_elem in elementos.items():
                    if other_id != eid and cid in membership.get(other_id, []):
                        miembros_del_conj.append(other_elem.bv)

                if miembros_del_conj:
                    # Valor agregado del conjunto: aplica el conectivo en cadena
                    evidencia_conj: BV = miembros_del_conj[0]
                    for mv in miembros_del_conj[1:]:
                        evidencia_conj = conectivo.apply(evidencia_conj, mv)

                    # Combina la evidencia del conjunto con la acumulada
                    nuevo_acumulado = bv_kjoin(evidencia_acumulada, evidencia_conj)

                    if nuevo_acumulado != evidencia_acumulada:
                        acciones.append(Accion(
                            paso=iteracion,
                            tipo_accion=TipoAccion.PROPAGACION,
                            elemento_id=eid,
                            origen=cid,
                            destino=next(
                                (c for c in conjuntos_origen if c != cid), cid
                            ),
                            valor_anterior=str(evidencia_acumulada),
                            valor_resultante=str(nuevo_acumulado),
                            conectivo_usado=conj.conectivo,
                            descripcion=(
                                f"Elemento {eid} recibe evidencia de {cid} "
                                f"({evidencia_acumulada} → {nuevo_acumulado})"
                            ),
                        ))
                        evidencia_acumulada = nuevo_acumulado

            # ── Propagación contrapuesta ──
            # Si el elemento tiene valor F o B, propagamos la negación
            # hacia sus vecinos que comparten conjuntos (modus tollens simplificado)
            if valor_actual in (BV.F, BV.B):
                for other_id, other_elem in elementos.items():
                    if other_id == eid:
                        continue
                    common_sets: Set[str] = set(membership.get(eid, [])) & set(
                        membership.get(other_id, [])
                    )
                    if common_sets:
                        contra_conj_id = next(iter(common_sets))
                        conj = conjuntos.get(contra_conj_id)
                        if conj is None:
                            continue
                        contra_conectivo = get_connective("CONTRAPOSITIONAL")
                        contra_val = contra_conectivo.apply(other_elem.bv, valor_actual)
                        if contra_val != other_elem.bv:
                            nuevo_other = bv_kjoin(other_elem.bv, contra_val)
                            if nuevo_other != other_elem.bv:
                                acciones.append(Accion(
                                    paso=iteracion,
                                    tipo_accion=TipoAccion.CONTRAPOSICION,
                                    elemento_id=other_id,
                                    origen=eid,
                                    destino=contra_conj_id,
                                    valor_anterior=str(other_elem.bv),
                                    valor_resultante=str(nuevo_other),
                                    conectivo_usado="CONTRAPOSITIONAL",
                                    descripcion=(
                                        f"Contrapuesta: {eid}({valor_actual}) "
                                        f"influye en {other_id} "
                                        f"({other_elem.bv} → {nuevo_other})"
                                    ),
                                ))
                                elementos[other_id] = _update_valor(
                                    elementos[other_id], nuevo_other
                                )

            # ── Registrar cambio global si hubo ──
            if evidencia_acumulada != valor_actual:
                cambios_en_esta_iteracion.append((eid, valor_actual, evidencia_acumulada))
                elementos[eid] = _update_valor(elementos[eid], evidencia_acumulada)

        # ── ¿Estabilizó? ──
        if not cambios_en_esta_iteracion:
            acciones.append(Accion(
                paso=iteracion,
                tipo_accion=TipoAccion.ESTABILIZACION,
                elemento_id="*",
                valor_resultante="*",
                descripcion=f"Sistema estabilizado en la iteración {iteracion}.",
            ))
            break
    else:
        iteracion = payload.max_iteraciones

    # ── Detectar cambios de variable (es_resultado_de) ──
    for cid, conj in conjuntos.items():
        if conj.es_resultado_de:
            # Los elementos del conjunto toman el alias de variable
            for eid in [e for e, ms in membership.items() if cid in ms]:
                acciones.append(Accion(
                    paso=paso + 1,
                    tipo_accion=TipoAccion.CAMBIO_NOMBRE,
                    elemento_id=eid,
                    origen=cid,
                    destino=conj.es_resultado_de,
                    valor_resultante=str(elementos[eid].bv),
                    descripcion=(
                        f"Variable del conjunto {cid} renombrada a "
                        f"'{conj.es_resultado_de}'"
                    ),
                ))

    # ── Actualizar colores en atributos_visuales ──
    for elem in elementos.values():
        elem.atributos_visuales.color = _color(elem.bv)

    estabilizado = acciones[-1].tipo_accion == TipoAccion.ESTABILIZACION if acciones else True

    # ── Resumen ──
    conteo: Dict[str, int] = {bv.value: 0 for bv in BV}
    for elem in elementos.values():
        conteo[elem.valor_verdad] += 1

    return MotorOutput(
        elementos=list(elementos.values()),
        conjuntos=list(conjuntos.values()),
        acciones=acciones,
        iteraciones_realizadas=iteracion,
        estabilizado=estabilizado,
        resumen={
            "total_elementos": len(elementos),
            "total_acciones":  len(acciones),
            "distribucion_valores": conteo,
        },
    )


def _update_valor(elem: ElementoOut, nuevo_bv: BV) -> ElementoOut:
    """Devuelve un nuevo ElementoOut con el valor_verdad actualizado."""
    data = elem.model_dump()
    data["valor_verdad"] = nuevo_bv.value
    return ElementoOut(**data)
