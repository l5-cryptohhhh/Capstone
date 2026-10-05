import type { Lang } from '../i18n/metricLabels'

/** Nome inglese usato dalla fonte dati → codice paese ISO, per tradurre le nazionalità nella lingua dell'interfaccia. */
const CODES: Record<string, string> = {
  Albania: 'AL', Algeria: 'DZ', Angola: 'AO', Argentina: 'AR', Armenia: 'AM', Australia: 'AU', Austria: 'AT',
  Azerbaijan: 'AZ', Belgium: 'BE', Benin: 'BJ', Bolivia: 'BO', 'Bosnia and Herzegovina': 'BA', Brazil: 'BR',
  Bulgaria: 'BG', 'Burkina Faso': 'BF', Cameroon: 'CM', Canada: 'CA', 'Cape Verde Islands': 'CV', Chile: 'CL',
  China: 'CN', Colombia: 'CO', Comoros: 'KM', Congo: 'CG', 'DR Congo': 'CD', 'Costa Rica': 'CR', Croatia: 'HR',
  Cuba: 'CU', Curaçao: 'CW', Cyprus: 'CY', 'Czech Republic': 'CZ', Denmark: 'DK', 'Dominican Republic': 'DO',
  Ecuador: 'EC', Egypt: 'EG', 'Equatorial Guinea': 'GQ', Estonia: 'EE', Finland: 'FI', France: 'FR', Gabon: 'GA',
  Gambia: 'GM', Georgia: 'GE', Germany: 'DE', Ghana: 'GH', Greece: 'GR', Guadeloupe: 'GP', Guinea: 'GN',
  'Guinea-Bissau': 'GW', Haiti: 'HT', Honduras: 'HN', Hungary: 'HU', Iceland: 'IS', Iran: 'IR', Ireland: 'IE',
  Israel: 'IL', Italy: 'IT', 'Ivory Coast': 'CI', Jamaica: 'JM', Japan: 'JP', Kenya: 'KE', Kosovo: 'XK',
  'Korea Republic': 'KR', Latvia: 'LV', Lithuania: 'LT', Luxembourg: 'LU', Madagascar: 'MG', Mali: 'ML',
  Martinique: 'MQ', Mexico: 'MX', Montenegro: 'ME', Morocco: 'MA', Mozambique: 'MZ', Netherlands: 'NL',
  'New Zealand': 'NZ', Nigeria: 'NG', 'North Macedonia': 'MK', Norway: 'NO', Panama: 'PA', Paraguay: 'PY',
  Peru: 'PE', Poland: 'PL', Portugal: 'PT', Romania: 'RO', Russia: 'RU', 'Saudi Arabia': 'SA', Senegal: 'SN',
  Serbia: 'RS', 'Sierra Leone': 'SL', Slovakia: 'SK', Slovenia: 'SI', 'South Africa': 'ZA', Spain: 'ES',
  Sweden: 'SE', Switzerland: 'CH', Syria: 'SY', Togo: 'TG', Tunisia: 'TN', Turkey: 'TR', Ukraine: 'UA',
  Uruguay: 'UY', USA: 'US', Uzbekistan: 'UZ', Venezuela: 'VE', Zambia: 'ZM', Zimbabwe: 'ZW',
}

/** Le nazioni del Regno Unito non hanno un codice paese: si traducono a mano. */
const UK_NATIONS: Record<string, Record<Lang, string>> = {
  England: { it: 'Inghilterra', en: 'England' },
  Scotland: { it: 'Scozia', en: 'Scotland' },
  Wales: { it: 'Galles', en: 'Wales' },
  'Northern Ireland': { it: 'Irlanda del Nord', en: 'Northern Ireland' },
}

const cache = new Map<Lang, Intl.DisplayNames>()

/** Nazionalità nella lingua corrente; se il nome non è noto resta quello della fonte. */
export function countryName(name: string | null | undefined, lang: Lang): string | null {
  if (!name) return null
  if (UK_NATIONS[name]) return UK_NATIONS[name][lang]
  const code = CODES[name]
  if (!code) return name
  try {
    let names = cache.get(lang)
    if (!names) {
      names = new Intl.DisplayNames([lang], { type: 'region' })
      cache.set(lang, names)
    }
    return names.of(code) ?? name
  } catch {
    return name
  }
}
