import { EditorController } from "../index";
const editor = new EditorController();

editor.crearVariable({ id: "p" });
editor.crearVariable({ id: "q" });
editor.crearVariable({ id: "r" });

editor.crearPar({
  id: "par_1",
  ocurrencias: [],
  atributos_visuales: {
    x: 180,
    y: 160
  }
});

editor.crearPar({
  id: "par_2",
  ocurrencias: [],
  atributos_visuales: {
    x: 180,
    y: 320
  }
});

editor.crearOcurrencia({
  id: "occ_1",
  variable_id: "p",
  par_id: "par_1",
  atributos_visuales: {
    x: 100,
    y: 160
  }
});

editor.crearOcurrencia({
  id: "occ_2",
  variable_id: "q",
  par_id: "par_1",
  atributos_visuales: {
    x: 260,
    y: 160
  }
});

editor.crearOcurrencia({
  id: "occ_3",
  variable_id: "p",
  par_id: "par_2",
  atributos_visuales: {
    x: 100,
    y: 320
  }
});

editor.crearOcurrencia({
  id: "occ_4",
  variable_id: "r",
  par_id: "par_2",
  atributos_visuales: {
    x: 260,
    y: 320
  }
});

editor.agregarEvidenciaAOcurrencia("occ_1", "verde");
editor.agregarEvidenciaAOcurrencia("occ_3", "roja");
editor.agregarEvidenciaAOcurrencia("occ_4", "verde");

editor.crearArco({
  id: "a1",
  origen_ocurrencia: "occ_1",
  destino_ocurrencia: "occ_2",
  origen_variable: "p",
  destino_variable: "q",
  conectivo: "IMPLIES"
});

editor.crearArco({
  id: "a2",
  origen_ocurrencia: "occ_3",
  destino_ocurrencia: "occ_4",
  origen_variable: "p",
  destino_variable: "r",
  conectivo: "KJOIN"
});

const resultado = editor.generarMotorInput();

if (!resultado.ok) {
  console.log("Errores:");
  console.log(JSON.stringify(resultado.errors, null, 2));
} else {
  console.log(JSON.stringify(resultado.data, null, 2));
}