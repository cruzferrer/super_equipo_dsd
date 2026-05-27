"""
Tests del Motor EPIC Playground (Versión 3.0).

Cubre:
  1. Lógica de Belnap (tablas de verdad)
  2. Conectivos matriciales
  3. Motor de propagación topológica (grafos y relaciones)
  4. Generación del Execution Trace
"""

import pytest
from core.belnap import BV, bv_and, bv_or, bv_not, bv_kjoin, bv_from_str
from core.connectives import get_connective, AND, OR, IMPLIES, PROPAGATION
from models.snapshot import (
    PlaygroundSnapshot, LogicGraph, LogicVariable, LogicRelation, PlaygroundMeta
)
from services.engine import run_propagation


# ═══════════════════════════════════════════
# 1. Lógica de Belnap (Intacta)
# ═══════════════════════════════════════════

class TestBelnap:

    def test_not_verdad(self):
        assert bv_not(BV.V) == BV.F

    def test_not_falsedad(self):
        assert bv_not(BV.F) == BV.V

    def test_not_ninguna(self):
        assert bv_not(BV.N) == BV.N

    def test_not_ambos(self):
        assert bv_not(BV.B) == BV.B

    def test_and_v_v(self):
        assert bv_and(BV.V, BV.V) == BV.V

    def test_and_v_f(self):
        assert bv_and(BV.V, BV.F) == BV.F

    def test_and_b_f(self):
        assert bv_and(BV.B, BV.F) == BV.F

    def test_or_v_f(self):
        assert bv_or(BV.V, BV.F) == BV.V

    def test_or_n_n(self):
        assert bv_or(BV.N, BV.N) == BV.N

    def test_kjoin_v_f_da_b(self):
        assert bv_kjoin(BV.V, BV.F) == BV.B

    def test_kjoin_n_v_da_v(self):
        assert bv_kjoin(BV.N, BV.V) == BV.V

    def test_bv_from_str(self):
        assert bv_from_str("v") == BV.V
        assert bv_from_str("TRUE") == BV.V
        assert bv_from_str("none") == BV.N
        assert bv_from_str("BOTH") == BV.B

    def test_bv_from_str_desconocido_da_n(self):
        assert bv_from_str("xyz") == BV.N


# ═══════════════════════════════════════════
# 2. Conectivos matriciales (Intactos)
# ═══════════════════════════════════════════

class TestConectivos:

    def test_and_matriz_simetrica_en_V(self):
        assert AND.apply(BV.V, BV.V) == BV.V

    def test_implies_v_f(self):
        assert IMPLIES.apply(BV.V, BV.F) == BV.F

    def test_implies_f_v(self):
        assert IMPLIES.apply(BV.F, BV.V) == BV.V

    def test_get_connective_valido(self):
        c = get_connective("AND")
        assert c.name == "AND"

    def test_get_connective_invalido(self):
        with pytest.raises(KeyError):
            get_connective("XOR_CUANTICO")

    def test_contrapositional_f_f(self):
        cp = get_connective("CONTRAPOSITIONAL")
        assert cp.apply(BV.F, BV.F) == BV.V


# ═══════════════════════════════════════════
# 3. Motor — Propagación Topológica (Nuevo)
# ═══════════════════════════════════════════

def _make_snapshot(variables: list[LogicVariable], relations: list[LogicRelation]) -> PlaygroundSnapshot:
    """Helper para instanciar rápidamente un Snapshot válido para pruebas."""
    graph = LogicGraph(
        variables={v.id: v for v in variables},
        relations={r.id: r for r in relations}
    )
    return PlaygroundSnapshot(logic=graph)


class TestMotorTopologico:

    def test_una_variable_sin_relaciones_no_cambia(self):
        snap = _make_snapshot(
            variables=[LogicVariable(id="p", value="V")],
            relations=[]
        )
        out = run_propagation(snap)
        assert out.logic.variables["p"].value == "V"
        assert out.execution_trace is not None
        assert out.execution_trace.stabilized is True

    def test_propagacion_directa_v_a_n(self):
        """p(V) -> q(N). La variable 'q' debe absorber la evidencia 'V'."""
        snap = _make_snapshot(
            variables=[
                LogicVariable(id="p", value="V"),
                LogicVariable(id="q", value="N")
            ],
            relations=[
                LogicRelation(id="r1", source="p", target="q", connective="PROPAGATION")
            ]
        )
        out = run_propagation(snap)
        assert out.logic.variables["q"].value == "V"

    def test_contradiccion_b(self):
        """Dos fuentes distintas mandan V y F a un mismo destino neutro."""
        snap = _make_snapshot(
            variables=[
                LogicVariable(id="p", value="V"),
                LogicVariable(id="q", value="F"),
                LogicVariable(id="r", value="N")
            ],
            relations=[
                LogicRelation(id="r1", source="p", target="r", connective="PROPAGATION"),
                LogicRelation(id="r2", source="q", target="r", connective="PROPAGATION")
            ]
        )
        out = run_propagation(snap)
        assert out.logic.variables["r"].value == "B"

    def test_flujo_contrapuesto(self):
        """Si la relación es contrapuesta, el destino evalúa hacia el origen (Modus Tollens)."""
        snap = _make_snapshot(
            variables=[
                LogicVariable(id="p", value="N"),
                LogicVariable(id="q", value="F")
            ],
            relations=[
                LogicRelation(id="r1", source="p", target="q", connective="IMPLIES", is_contrapositive=True)
            ]
        )
        out = run_propagation(snap)
        trace = out.execution_trace
        # Validamos que se haya registrado al menos una mutación antes de la estabilización
        assert len(trace.actions) > 1 

    def test_trace_registra_acciones_correctamente(self):
        """Valida que el ExecutionTrace cuente la historia paso a paso."""
        snap = _make_snapshot(
            variables=[
                LogicVariable(id="p", value="V"),
                LogicVariable(id="q", value="N")
            ],
            relations=[
                LogicRelation(id="r1", source="p", target="q", connective="PROPAGATION")
            ]
        )
        out = run_propagation(snap)
        trace = out.execution_trace
        
        assert len(trace.actions) == 2  # Acción 1: Mutación de 'q', Acción 2: Estabilización global
        
        accion_mutacion = trace.actions[0]
        assert accion_mutacion.variable_id == "q"
        assert accion_mutacion.old_value == "N"
        assert accion_mutacion.new_value == "V"
        assert accion_mutacion.is_stabilized is False

        accion_estabilizacion = trace.actions[1]
        assert accion_estabilizacion.is_stabilized is True