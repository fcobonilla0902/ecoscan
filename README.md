# EcoScan — Escanea y recicla

App móvil (Expo SDK 57 / React Native) para iPhone y Android.

## Cómo probarla en tu celular
> El escáner con IA necesita el **servidor** de la carpeta `server/` (ver sección *Servidor de IA* abajo). Lo demás funciona sin él.

1. Instala **Node.js LTS** en tu computadora.
2. Instala la app **Expo Go** en tu celular (App Store / Google Play).
3. En esta carpeta:
   ```
   npm install
   npx expo start
   ```
4. Escanea el código QR con la cámara (iPhone) o desde Expo Go (Android). Celular y computadora deben estar en la misma red Wi-Fi.

## Qué incluye
- **Realidad aumentada**: cámara en vivo con 6 contenedores virtuales anclados en el espacio. Te muestra un residuo, giras el teléfono, apuntas la mira al contenedor correcto ~1 s y ganas puntos. Se abre desde Inicio o desde el resultado de un escaneo.
- **Escáner con IA**: tomas una foto del residuo y una IA de visión (Claude) identifica el objeto, su categoría y cómo desecharlo. Si la IA se equivoca, eliges el material manualmente.
- **Resultado**: categoría (plástico, papel, vidrio, metal, orgánico, especial), si es reciclable y cómo desecharlo.
- **Puntos y retos**: +10 pts por reciclar, retos con recompensa, historial. Se guarda en el teléfono.
- **Centros cercanos**: lista ordenada por distancia con botón "Cómo llegar".
- **Aprender**: guía rápida por tipo de residuo.

## Dónde personalizar
- `src/data/catalog.js` → agrega residuos y códigos de barras.
- `src/data/centers.js` → **los centros son de ejemplo**; reemplázalos por centros reales de tu zona.
- `src/store.js` → puntos y retos.

## Para publicar
Usa EAS Build (`npm i -g eas-cli`, luego `eas build`) para generar el .apk/.aab e .ipa.

## Nota sobre la realidad aumentada
Usa cámara + sensores de movimiento (funciona en Expo Go). No detecta superficies ni objetos reales; para eso (ARKit/ARCore) hace falta un *development build* con una librería nativa como ViroReact.

## Servidor de IA — versión GRATIS (necesario para escanear con foto)
La app NO lleva la clave de la IA dentro (cualquiera podría robarla). La foto se manda a un servidor tuyo (`server/`), que consulta a **Gemini de Google, que tiene plan gratuito**.

1. Entra a https://aistudio.google.com/apikey con tu cuenta de Google y toca **Create API key**. **No actives facturación ni agregues tarjeta**: así solo usas el plan gratuito y no te pueden cobrar.
2. En una terminal, en esta carpeta:
   ```
   # Mac / Linux
   GEMINI_API_KEY=tu-clave npm run server
   # Windows (PowerShell)
   $env:GEMINI_API_KEY="tu-clave"; npm run server
   ```
3. En otra terminal: `npx expo start`. La app encuentra el servidor sola (misma computadora, puerto 3000). Celular y computadora en el mismo Wi-Fi.

**Límites y privacidad del plan gratuito**
- Tiene un tope de fotos por minuto y por día (míralo en https://aistudio.google.com/rate-limit). Si se alcanza, la app avisa y puedes elegir el material manualmente.
- Google puede usar lo que envías en el plan gratuito para mejorar sus productos. Escanea solo residuos: nada de documentos, rostros o datos personales.
- Modelo por defecto: `gemini-3.5-flash-lite`. Cámbialo con la variable `AI_MODEL` si Google lo renombra.

**Opcional (de pago):** usar Claude en lugar de Gemini: `ANTHROPIC_API_KEY=... npm run server` (sin `GEMINI_API_KEY`).

Para usar la app fuera de tu casa, publica la carpeta `server/` en un hosting con plan gratuito (Render, Railway, Fly.io…) y pon su URL en `src/config.js`.
