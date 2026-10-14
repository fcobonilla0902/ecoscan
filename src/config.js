import Constants from 'expo-constants';

// Dirección del servidor de EcoScan (carpeta /server).
// Por defecto usa la misma computadora que sirve la app con `expo start`, puerto 3000,
// así que normalmente no tienes que cambiar nada. Si publicas el servidor en internet,
// pon aquí su URL, por ejemplo: 'https://ecoscan.tu-dominio.com'
export const SERVER_URL_OVERRIDE = '';

export function getServerUrl() {
  if (SERVER_URL_OVERRIDE) return SERVER_URL_OVERRIDE.replace(/\/$/, '');
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost || '';
  const host = hostUri.split(':')[0];
  // En modo túnel (expo start --tunnel) el host es de Expo, no de tu computadora:
  // en ese caso hay que poner la IP de tu PC en SERVER_URL_OVERRIDE.
  if (!host || /exp\.direct|ngrok|expo\.dev/.test(host)) return null;
  return `http://${host}:3000`;
}

export async function identifyPhoto(base64, mediaType = 'image/jpeg') {
  const base = getServerUrl();
  if (!base) throw new Error('No sé dónde está el servidor (¿modo túnel?). Pon la IP de tu computadora en SERVER_URL_OVERRIDE, en src/config.js. Ejemplo: http://192.168.1.50:3000');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(`${base}/identify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ image: base64, mediaType }),
      signal: ctrl.signal,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Error del servidor (${res.status})`);
    return data;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('El servidor tardó demasiado en responder.');
    if (e.message && e.message.includes('Network request failed')) {
      throw new Error('No pude conectar con el servidor. ¿Está corriendo (node server/index.js) y el celular está en el mismo Wi-Fi?');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}