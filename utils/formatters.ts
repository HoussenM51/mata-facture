
/**
 * Formate un nombre en Ariary avec un espace comme séparateur de milliers.
 */
export const formatAr = (val: number): string => {
  const rounded = Math.round(val);
  return new Intl.NumberFormat('fr-FR')
    .format(rounded)
    .replace(/\s/g, ' ')
    .replace(/\u00A0/g, ' ') + ' Ar';
};

/**
 * Convertit un montant en lettres (Français)
 */
export const numberToWords = (amount: number): string => {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

  const convertGroup = (n: number): string => {
    let res = '';
    const h = Math.floor(n / 100);
    const t = n % 100;
    
    if (h > 0) res += (h === 1 ? 'cent' : units[h] + ' cent') + ' ';
    if (t > 0) {
      if (t < 10) res += units[t];
      else if (t < 20) res += teens[t - 10];
      else {
        res += tens[Math.floor(t / 10)];
        if (t % 10 > 0) res += (t % 10 === 1 ? '-et-un' : '-' + units[t % 10]);
      }
    }
    return res.trim();
  };

  if (amount === 0) return 'zéro Ariary';
  
  let result = '';
  const millions = Math.floor(amount / 1000000);
  const thousands = Math.floor((amount % 1000000) / 1000);
  const remainder = Math.floor(amount % 1000);

  if (millions > 0) result += convertGroup(millions) + (millions > 1 ? ' millions ' : ' million ');
  if (thousands > 0) result += (thousands === 1 ? 'mille ' : convertGroup(thousands) + ' mille ');
  if (remainder > 0) result += convertGroup(remainder);

  return result.trim().charAt(0).toUpperCase() + result.trim().slice(1) + ' Ariary';
};
