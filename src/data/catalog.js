// Catálogo de residuos. Agrega más objetos aquí para ampliar la app.
// category: plastico | papel | vidrio | metal | organico | otro
export const CATEGORIES = {
  plastico: { label: 'Plástico', icon: 'water-outline', bin: 'Contenedor amarillo / plásticos' },
  papel: { label: 'Papel y cartón', icon: 'document-text-outline', bin: 'Contenedor azul / papel' },
  vidrio: { label: 'Vidrio', icon: 'wine-outline', bin: 'Contenedor verde / vidrio' },
  metal: { label: 'Metal', icon: 'hardware-chip-outline', bin: 'Contenedor gris / metales' },
  organico: { label: 'Orgánico', icon: 'leaf-outline', bin: 'Composta o contenedor orgánico' },
  otro: { label: 'Especial', icon: 'warning-outline', bin: 'Centro de acopio especializado' },
};

export const CATALOG = [
  {
    id: 'botella-vidrio',
    name: 'Botella de vidrio',
    category: 'vidrio',
    recyclable: true,
    instructions: 'Vacíala y enjuágala. Quita la tapa (se recicla aparte). No necesitas quitar la etiqueta.',
    tip: 'El vidrio se puede reciclar infinitas veces sin perder calidad.',
    barcodes: [],
  },
  {
    id: 'frasco-vidrio',
    name: 'Frasco de vidrio',
    category: 'vidrio',
    recyclable: true,
    instructions: 'Enjuaga los restos de comida y retira la tapa metálica.',
    tip: 'Los frascos limpios también se pueden reutilizar en casa.',
    barcodes: [],
  },
  {
    id: 'vidrio-roto-cocina',
    name: 'Vidrio de cocina / espejos / focos',
    category: 'otro',
    recyclable: false,
    instructions: 'No va con el vidrio de envases: tiene otro punto de fusión. Envuélvelo bien y deséchalo como residuo general o llévalo a un centro especial.',
    tip: 'Los focos ahorradores contienen mercurio: llévalos a un punto de acopio.',
    barcodes: [],
  },
  {
    id: 'botella-pet',
    name: 'Botella PET (refresco / agua)',
    category: 'plastico',
    recyclable: true,
    instructions: 'Vacíala, aplástala y ponle la tapa de nuevo. Busca el número 1 (PET) en la base.',
    tip: 'El PET se transforma en fibras para ropa y nuevas botellas.',
    barcodes: [],
  },
  {
    id: 'bolsa-plastica',
    name: 'Bolsa de plástico',
    category: 'plastico',
    recyclable: true,
    instructions: 'Debe estar limpia y seca. Junta varias dentro de una sola bolsa y llévalas a un centro de acopio; no van en el contenedor normal.',
    tip: 'Lo mejor es reutilizarlas o cambiar a bolsas de tela.',
    barcodes: [],
  },
  {
    id: 'unicel',
    name: 'Unicel / poliestireno',
    category: 'otro',
    recyclable: false,
    instructions: 'Casi no se recicla. Evítalo cuando puedas; si está limpio, pregunta en centros de acopio especializados.',
    tip: 'Prefiere envases de cartón o reutilizables.',
    barcodes: [],
  },
  {
    id: 'caja-carton',
    name: 'Caja de cartón',
    category: 'papel',
    recyclable: true,
    instructions: 'Aplánala, quita la cinta adhesiva y mantenla seca.',
    tip: 'El cartón mojado o con grasa pierde valor de reciclaje.',
    barcodes: [],
  },
  {
    id: 'papel-oficina',
    name: 'Papel de oficina / periódico',
    category: 'papel',
    recyclable: true,
    instructions: 'Sepáralo seco y sin grapas grandes. Puedes dejar clips pequeños.',
    tip: 'Reciclar una tonelada de papel salva alrededor de 17 árboles.',
    barcodes: [],
  },
  {
    id: 'tetrapak',
    name: 'Envase Tetra Pak (leche / jugo)',
    category: 'papel',
    recyclable: true,
    instructions: 'Enjuágalo, aplástalo y llévalo a un centro que acepte envases multicapa.',
    tip: 'No todos los centros lo reciben: confirma antes de ir.',
    barcodes: [],
  },
  {
    id: 'lata-aluminio',
    name: 'Lata de aluminio',
    category: 'metal',
    recyclable: true,
    instructions: 'Vacíala, enjuágala y aplástala para ahorrar espacio.',
    tip: 'Reciclar aluminio ahorra hasta 95% de la energía de producirlo nuevo.',
    barcodes: [],
  },
  {
    id: 'lata-conserva',
    name: 'Lata de conserva (acero)',
    category: 'metal',
    recyclable: true,
    instructions: 'Retira restos de comida, enjuágala y mete la tapa dentro de la lata.',
    tip: 'El acero se separa fácil con un imán.',
    barcodes: [],
  },
  {
    id: 'restos-comida',
    name: 'Restos de comida / cáscaras',
    category: 'organico',
    recyclable: true,
    instructions: 'Aprovéchalos en composta casera o deposítalos en el contenedor orgánico.',
    tip: 'Evita carne, lácteos y grasas en la composta casera.',
    barcodes: [],
  },
  {
    id: 'pilas',
    name: 'Pilas y baterías',
    category: 'otro',
    recyclable: true,
    instructions: 'Nunca a la basura común. Guárdalas en un frasco y llévalas a un punto de acopio.',
    tip: 'Una sola pila puede contaminar miles de litros de agua.',
    barcodes: [],
  },
  {
    id: 'electronicos',
    name: 'Aparatos electrónicos',
    category: 'otro',
    recyclable: true,
    instructions: 'Llévalos a un centro de reciclaje de residuos electrónicos (RAEE). Borra tus datos antes.',
    tip: 'Contienen metales valiosos que se pueden recuperar.',
    barcodes: [],
  },
];

export function findByBarcode(code) {
  return CATALOG.find((i) => i.barcodes.includes(code)) || null;
}

// Mapea etiquetas de empaque de Open Food Facts a nuestras categorías.
export function itemFromPackagingTags(tags = [], productName = '') {
  const t = tags.join(' ').toLowerCase();
  let id = null;
  if (/glass|vidrio|verre/.test(t)) id = 'botella-vidrio';
  else if (/pet|bottle|botella/.test(t) && /plastic|pet/.test(t)) id = 'botella-pet';
  else if (/can|lata|aluminium|aluminum/.test(t)) id = 'lata-aluminio';
  else if (/tetra|brick|carton|cartón/.test(t)) id = 'tetrapak';
  else if (/paper|cardboard|papel/.test(t)) id = 'caja-carton';
  else if (/plastic|film|bag/.test(t)) id = 'bolsa-plastica';
  if (!id) return null;
  const base = CATALOG.find((i) => i.id === id);
  return productName ? { ...base, name: `${productName} (${base.name})` } : base;
}

export const LESSONS = [
  { category: 'vidrio', title: 'Vidrio', body: 'Envases de vidrio limpios y sin tapa. Aparte: espejos, focos y cristales de ventana.' },
  { category: 'plastico', title: 'Plástico', body: 'Revisa el número en la base. PET (1) y HDPE (2) son los más aceptados. Siempre limpios y secos.' },
  { category: 'papel', title: 'Papel y cartón', body: 'Seco y sin grasa. Las cajas de pizza grasosas y el papel encerado no se reciclan.' },
  { category: 'metal', title: 'Metal', body: 'Latas de aluminio y acero, enjuagadas. Las latas de aerosol vacías suelen aceptarse.' },
  { category: 'organico', title: 'Orgánico', body: 'Cáscaras, café, hojas. Haz composta y devuelve nutrientes a la tierra.' },
  { category: 'otro', title: 'Residuos especiales', body: 'Pilas, electrónicos, aceite usado y medicinas necesitan acopio especial.' },
];
