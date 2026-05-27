from models.snapshot import PlaygroundSnapshot, ExecutionTrace, ExecutionAction
from core.belnap import bv_kjoin
from core.connectives import get_connective
import copy

def run_propagation(snapshot: PlaygroundSnapshot) -> PlaygroundSnapshot:
    """
    Recibe el Snapshot, calcula la propagación matricial sobre el grafo lógico
    y devuelve el mismo Snapshot mutado con el execution_trace inyectado.
    """
    # 1. Inicializar el rastro de ejecución
    trace = ExecutionTrace()
    snapshot.execution_trace = trace
    
    variables = snapshot.logic.variables
    relations = snapshot.logic.relations.values()
    max_iter = snapshot.meta.max_iterations
    
    paso_actual = 0
    estabilizado = False

    # 2. Bucle de Estabilización
    for iteracion in range(1, max_iter + 1):
        paso_actual = iteracion
        cambios_en_esta_iteracion = 0
        
        # Iteramos sobre todas las aristas (relaciones) del grafo
        for rel in relations:
            source_var = variables.get(rel.source)
            target_var = variables.get(rel.target)
            
            if not source_var or not target_var:
                continue

            # Determinar la dirección del flujo según la lógica contrapuesta
            if rel.is_contrapositive:
                # Modus Tollens: Flujo inverso (Target -> Source)
                origen = target_var
                destino = source_var
                # Usualmente la contrapositiva aplica la matriz en orden inverso
                conectivo = get_connective("CONTRAPOSITIONAL")
            else:
                # Flujo directo (Source -> Target)
                origen = source_var
                destino = target_var
                conectivo = get_connective(rel.connective)

            # Aplicar la matriz del conectivo
            evidencia_entrante = conectivo.apply(origen.bv, destino.bv)
            
            # Unir la evidencia entrante con el valor actual del destino (k-join)
            nuevo_valor = bv_kjoin(destino.bv, evidencia_entrante)
            
            # Si el valor de la variable mutó, registramos la acción
            if nuevo_valor != destino.bv:
                old_val_str = destino.value
                destino.value = nuevo_valor.value  # Mutamos el estado
                
                accion = ExecutionAction(
                    step=paso_actual,
                    variable_id=destino.id,
                    old_value=old_val_str,
                    new_value=destino.value,
                    description=f"La variable '{destino.id}' cambió de {old_val_str} a {destino.value} vía {rel.connective} desde '{origen.id}'"
                )
                trace.actions.append(accion)
                cambios_en_esta_iteracion += 1

        # 3. Condición de salida temprana
        if cambios_en_esta_iteracion == 0:
            estabilizado = True
            # Registrar la acción final de estabilización
            trace.actions.append(ExecutionAction(
                step=paso_actual,
                variable_id="*",
                old_value="*",
                new_value="*",
                description=f"El sistema se estabilizó en la iteración {iteracion}.",
                is_stabilized=True
            ))
            break

    # 4. Finalizar el Trace
    trace.stabilized = estabilizado
    trace.total_iterations = paso_actual
    
    return snapshot