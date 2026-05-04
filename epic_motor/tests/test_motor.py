"""
Tests del Motor EPIC Playground.

Cubre:
  1. Lógica de Belnap (tablas de verdad)
  2. Conectivos matriciales
  3. Motor de propagación — casos simples y complejos
  4. Estabilización y detección de ciclos
  5. Propagación contrapuesta
  6. Jerarquía de subconjuntos
"""

import pytest
from ..logic.belnap import BV, bv_and, bv_or, bv_not, bv_kjoin, bv_from_str
from ..logic.connectives import get_connective, AND, OR, IMPLIES, PROPAGATION
from ..models.schemas import (
    ElementoIn, ConjuntoIn, MotorInput, AtributosVisualesElemento,
)
from ..engine.propagation import run


# ═══════════════════════════════════════════
# 1. Lógica de Belnap
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
        # B ∧ F = F  (F domina en AND)
        assert bv_and(BV.B, BV.F) == BV.F

    def test_or_v_f(self):
        assert bv_or(BV.V, BV.F) == BV.V

    def test_or_n_n(self):
        assert bv_or(BV.N, BV.N) == BV.N

    def test_kjoin_v_f_da_b(self):
        # Combinar evidencia positiva y negativa → contradicción B
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
# 2. Conectivos matriciales
# ═══════════════════════════════════════════

class TestConectivos:

    def test_and_matriz_simetrica_en_V(self):
        assert AND.apply(BV.V, BV.V) == BV.V

    def test_implies_v_f(self):
        # V → F = ¬V ∨ F = F ∨ F = F
        assert IMPLIES.apply(BV.V, BV.F) == BV.F

    def test_implies_f_v(self):
        # F → V = ¬F ∨ V = V ∨ V = V
        assert IMPLIES.apply(BV.F, BV.V) == BV.V

    def test_get_connective_valido(self):
        c = get_connective("AND")
        assert c.name == "AND"

    def test_get_connective_invalido(self):
        with pytest.raises(KeyError):
            get_connective("XOR_CUANTICO")

    def test_contrapositional_f_f(self):
        cp = get_connective("CONTRAPOSITIONAL")
        # ¬F ∨ F = V ∨ F = V
        assert cp.apply(BV.F, BV.F) == BV.V


# ═══════════════════════════════════════════
# 3. Motor — propagación simple
# ═══════════════════════════════════════════

def _make_elem(id: str, valor: str, pertenencia: list[str]) -> ElementoIn:
    return ElementoIn(id=id, valor_verdad=valor, pertenencia=pertenencia)

def _make_conj(id: str, conectivo: str = "PROPAGATION") -> ConjuntoIn:
    return ConjuntoIn(id=id, conectivo=conectivo)


class TestMotorSimple:

    def test_un_elemento_sin_vecinos_no_cambia(self):
        payload = MotorInput(
            elementos=[_make_elem("e1", "V", ["C1"])],
            conjuntos=[_make_conj("C1")],
        )
        out = run(payload)
        assert out.elementos[0].valor_verdad == "V"
        assert out.estabilizado

    def test_dos_elementos_v_y_f_producen_b(self):
        """
        e1=V y e2=F en el mismo conjunto C1.
        Al combinar evidencia, ambos deberían alcanzar B (contradicción).
        """
        payload = MotorInput(
            elementos=[
                _make_elem("e1", "V", ["C1"]),
                _make_elem("e2", "F", ["C1"]),
            ],
            conjuntos=[_make_conj("C1", "KJOIN")],
        )
        out = run(payload)
        valores = {e.id: e.valor_verdad for e in out.elementos}
        assert valores["e1"] == "B"
        assert valores["e2"] == "B"

    def test_dos_elementos_n_no_cambian(self):
        payload = MotorInput(
            elementos=[
                _make_elem("e1", "N", ["C1"]),
                _make_elem("e2", "N", ["C1"]),
            ],
            conjuntos=[_make_conj("C1")],
        )
        out = run(payload)
        for e in out.elementos:
            assert e.valor_verdad == "N"

    def test_elemento_v_propaga_a_n_en_mismo_conjunto(self):
        """e1=V debe influir en e2=N → e2 debería absorber evidencia de V."""
        payload = MotorInput(
            elementos=[
                _make_elem("e1", "V", ["C1"]),
                _make_elem("e2", "N", ["C1"]),
            ],
            conjuntos=[_make_conj("C1", "KJOIN")],
        )
        out = run(payload)
        valores = {e.id: e.valor_verdad for e in out.elementos}
        assert valores["e2"] == "V"   # N kjoin V = V

    def test_acciones_registradas(self):
        payload = MotorInput(
            elementos=[
                _make_elem("e1", "V", ["C1"]),
                _make_elem("e2", "N", ["C1"]),
            ],
            conjuntos=[_make_conj("C1", "KJOIN")],
        )
        out = run(payload)
        assert len(out.acciones) > 0

    def test_accion_estabilizacion_presente(self):
        payload = MotorInput(
            elementos=[_make_elem("e1", "V", ["C1"])],
            conjuntos=[_make_conj("C1")],
        )
        out = run(payload)
        tipos = [a.tipo_accion for a in out.acciones]
        assert "estabilizacion" in tipos


# ═══════════════════════════════════════════
# 4. Motor — jerarquía de subconjuntos
# ═══════════════════════════════════════════

class TestMotorJerarquia:

    def test_subconjunto_hereda_influencia(self):
        """
        C1 contiene a C2 como subconjunto.
        e1 ∈ C2, e2 ∈ C1.
        e1=V debe propagar a e2 a través de la jerarquía.
        """
        payload = MotorInput(
            elementos=[
                _make_elem("e1", "V", ["C2"]),
                _make_elem("e2", "N", ["C1"]),
            ],
            conjuntos=[
                ConjuntoIn(id="C1", subconjuntos=["C2"], conectivo="KJOIN"),
                ConjuntoIn(id="C2", conectivo="KJOIN"),
            ],
        )
        out = run(payload)
        valores = {e.id: e.valor_verdad for e in out.elementos}
        # e2 debe recibir evidencia V desde C1 (que contiene a C2 con e1=V)
        assert valores["e2"] == "V"

    def test_elemento_en_subconjunto_no_pierde_valor_propio(self):
        payload = MotorInput(
            elementos=[
                _make_elem("e1", "F", ["C2"]),
                _make_elem("e2", "V", ["C2"]),
            ],
            conjuntos=[
                ConjuntoIn(id="C1", subconjuntos=["C2"], conectivo="KJOIN"),
                ConjuntoIn(id="C2", conectivo="KJOIN"),
            ],
        )
        out = run(payload)
        valores = {e.id: e.valor_verdad for e in out.elementos}
        # F + V = B (contradicción)
        assert valores["e1"] == "B"
        assert valores["e2"] == "B"


# ═══════════════════════════════════════════
# 5. Motor — cambio de variable (es_resultado_de)
# ═══════════════════════════════════════════

class TestCambioVariable:

    def test_accion_cambio_nombre_generada(self):
        payload = MotorInput(
            elementos=[_make_elem("e1", "V", ["C1"])],
            conjuntos=[ConjuntoIn(id="C1", es_resultado_de="Z", conectivo="PROPAGATION")],
        )
        out = run(payload)
        tipos = [a.tipo_accion for a in out.acciones]
        assert "cambio_nombre" in tipos

    def test_destino_cambio_nombre_correcto(self):
        payload = MotorInput(
            elementos=[_make_elem("e1", "V", ["C1"])],
            conjuntos=[ConjuntoIn(id="C1", es_resultado_de="Z", conectivo="PROPAGATION")],
        )
        out = run(payload)
        rename = next(a for a in out.acciones if a.tipo_accion == "cambio_nombre")
        assert rename.destino == "Z"


# ═══════════════════════════════════════════
# 6. Motor — resumen y metadatos
# ═══════════════════════════════════════════

class TestResumen:

    def test_resumen_contiene_distribucion(self):
        payload = MotorInput(
            elementos=[
                _make_elem("e1", "V", ["C1"]),
                _make_elem("e2", "F", ["C1"]),
            ],
            conjuntos=[_make_conj("C1")],
        )
        out = run(payload)
        assert "distribucion_valores" in out.resumen

    def test_resumen_total_elementos(self):
        payload = MotorInput(
            elementos=[_make_elem("e1", "V", ["C1"])],
            conjuntos=[_make_conj("C1")],
        )
        out = run(payload)
        assert out.resumen["total_elementos"] == 1

    def test_iteraciones_realizadas_mayor_cero(self):
        payload = MotorInput(
            elementos=[_make_elem("e1", "V", ["C1"])],
            conjuntos=[_make_conj("C1")],
        )
        out = run(payload)
        assert out.iteraciones_realizadas >= 1
