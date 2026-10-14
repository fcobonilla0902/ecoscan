// Centros de ejemplo: reemplázalos por centros reales (o conéctalos a una API / base de datos).
export const CENTERS = [
  {
    id: 'c1',
    name: 'Centro de Acopio Verde',
    address: 'Av. Principal 123',
    latitude: 25.6866,
    longitude: -100.3161,
    accepts: ['plastico', 'papel', 'vidrio', 'metal'],
    hours: 'Lun–Sáb 9:00–17:00',
  },
  {
    id: 'c2',
    name: 'EcoPunto Vidrio y Metal',
    address: 'Calle Reforma 45',
    latitude: 25.7,
    longitude: -100.3,
    accepts: ['vidrio', 'metal'],
    hours: 'Lun–Vie 8:00–16:00',
  },
  {
    id: 'c3',
    name: 'Punto Limpio Electrónicos y Pilas',
    address: 'Blvd. Industrial 800',
    latitude: 25.67,
    longitude: -100.33,
    accepts: ['otro'],
    hours: 'Mar–Dom 10:00–18:00',
  },
  {
    id: 'c4',
    name: 'Composta Comunitaria',
    address: 'Parque Central s/n',
    latitude: 25.69,
    longitude: -100.31,
    accepts: ['organico'],
    hours: 'Sáb 8:00–13:00',
  },
];

export function distanceKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
