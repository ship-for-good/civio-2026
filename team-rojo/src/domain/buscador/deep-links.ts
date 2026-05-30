// TODO-VERIFY: el parámetro `text` en la URL de PLACE no ha sido verificado
// contra el portal en producción. La URL base es correcta; el query-param puede
// diferir en la plataforma real.
export function buildContratacionDeepLink(query: string): string {
  const text = encodeURIComponent(query.trim());
  return `https://contrataciondelestado.es/wps/portal/plataforma?text=${text}`;
}
