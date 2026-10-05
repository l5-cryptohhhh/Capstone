export type Vars = Record<string, string | number>

/** Sostituisce i segnaposto {nome}; se la variabile manca il segnaposto resta visibile. */
export function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`))
}
