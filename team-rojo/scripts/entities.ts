export type Entity = { idAmb: number; name: string };

const PROC_ID = 133628;

export function portadaUrl(idAmb: number) {
  return `https://transparencia.sede.gob.es/procedimiento/portada?idProc=${PROC_ID}&idAmb=${idAmb}`;
}

export const ENTITY_LIST: Entity[] = [
  { idAmb: 101503, name: "Agencia Española de Protección de Datos" },
  { idAmb: 101504, name: "Casa Real" },
  { idAmb: 101505, name: "Secretaría de Estado de la Seguridad Social y Pensiones" },
  { idAmb: 101506, name: "Ministerio de Agricultura, Pesca y Alimentación" },
  { idAmb: 101507, name: "Ministerio de Asuntos Exteriores, Unión Europea y Cooperación" },
  { idAmb: 101508, name: "Ministerio de Ciencia, Innovación y Universidades" },
  { idAmb: 101509, name: "Ministerio de Cultura" },
  { idAmb: 101510, name: "Ministerio de Defensa" },
  { idAmb: 101511, name: "Ministerio de Derechos Sociales, Consumo y Agenda 2030" },
  { idAmb: 101512, name: "Ministerio de Economía, Comercio y Empresa" },
  { idAmb: 101513, name: "Ministerio de Educación, Formación Profesional y Deportes" },
  { idAmb: 101514, name: "Ministerio de Hacienda" },
  { idAmb: 101515, name: "Ministerio de Igualdad" },
  { idAmb: 101516, name: "Ministerio de Inclusión, Seguridad Social y Migraciones" },
  { idAmb: 101517, name: "Ministerio de Industria y Turismo" },
  { idAmb: 101518, name: "Ministerio del Interior" },
  { idAmb: 101519, name: "Ministerio de Juventud e Infancia" },
  { idAmb: 101520, name: "Ministerio de Política Territorial y Memoria Democrática" },
  { idAmb: 101521, name: "Ministerio de la Presidencia, Justicia, y Relaciones con Cortes" },
  { idAmb: 101522, name: "Ministerio de Sanidad" },
  { idAmb: 101523, name: "Ministerio de Trabajo y Economía Social" },
  { idAmb: 101524, name: "Ministerio para la Transformación Digital y de la Función Pública" },
  { idAmb: 101525, name: "Ministerio para la Transición Ecológica y el Reto Demográfico" },
  { idAmb: 101526, name: "Ministerio de Transportes y Movilidad Sostenible" },
  { idAmb: 101527, name: "Ministerio de Vivienda y Agenda Urbana" },
];
