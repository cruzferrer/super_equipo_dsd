# 🚀 Inicio Rápido - EPiC Playground Integrado

## Comandos Correctos para Iniciar el Sistema

### 1️⃣ Iniciar el Motor API


```
cd epic_motor
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```


✅ El motor debe estar corriendo en `http://localhost:8000`

---

### 2️⃣ Compilar el Editor TypeScript

**En una nueva terminal:**

```powershell
cd epic_simulador
npm install
npm run build:editor
```

Esto genera los archivos en `epic_simulador/dist/`

---

### 3️⃣ Iniciar el Simulador

```powershell
cd epic_simulador
npm run dev
```

✅ Abre tu navegador en `http://localhost:5173/`

---

## ⚠️ Errores Comunes

### Error: "ImportError: attempted relative import beyond top-level package"

**Causa:** Estás usando el comando incorrecto.

**Solución:** Usa `main:app` en lugar de `api.app:app`:
```powershell
python -m uvicorn main:app --reload --port 8000
```

### Error: "Cannot find module '../epic_editor/dist/...'"

**Causa:** No compilaste el código TypeScript.

**Solución:**
```powershell
cd epic_simulador
npm run build:editor
```

### Error: "No se pudo conectar con el Motor"

**Causa:** El motor no está corriendo.

**Solución:** Verifica que el motor esté corriendo en `http://localhost:8000/docs`

---

## 📋 Checklist de Inicio

- [ ] Motor corriendo en puerto 8000
- [ ] Editor TypeScript compilado (carpeta `dist/` existe)
- [ ] Simulador corriendo en puerto 5173
- [ ] Navegador abierto en `http://localhost:5173/`

---

## 🎯 Uso Rápido

1. Ve a la pestaña **"Editor Interactivo"**
2. Crea un conjunto con el botón "Añadir"
3. Crea variables dentro del conjunto
4. Crea relaciones entre variables
5. Click en **"⚡ Calcular con el Motor API"**
6. Ve la animación en la pestaña **"Vista de Cajitas"**

---

## 📚 Documentación Completa

Para más detalles, consulta:
- `epic_simulador/INTEGRATION_README.md` - Documentación completa de la integración
- `epic_simulador/README.md` - Documentación del simulador
- `epic_motor/READ_ME.txt` - Documentación del motor

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa este documento
2. Revisa la consola del navegador (F12)
3. Revisa los logs del motor en la terminal
4. Consulta `epic_simulador/INTEGRATION_README.md` sección "Solución de Problemas"