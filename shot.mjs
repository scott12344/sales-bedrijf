/**
 * Visuele controle: doorloopt de app, vult een merkprofiel, zet twee testfoto's
 * klaar en legt elk sjabloon in alle formaten vast. Puur een ontwikkelhulp.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const uit = process.env.SHOT_DIR ?? '/tmp/kozijn-shots';
fs.mkdirSync(uit, { recursive: true });
const bestand = 'file:///home/user/sales-bedrijf/dist/index.html';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
const fouten = [];
page.on('console', (m) => m.type() === 'error' && fouten.push(m.text()));
page.on('pageerror', (e) => fouten.push(String(e)));

await page.goto(bestand);
await page.waitForTimeout(500);

/* Twee testfoto's maken zodat de sjablonen met echt beeld te beoordelen zijn. */
const maakFoto = async (variant) =>
  page.evaluate((v) => {
    const c = document.createElement('canvas');
    c.width = 1400;
    c.height = 1000;
    const g = c.getContext('2d');
    const lucht = g.createLinearGradient(0, 0, 0, 500);
    lucht.addColorStop(0, v === 'na' ? '#7fb2e5' : '#9aa7b0');
    lucht.addColorStop(1, v === 'na' ? '#cfe3f5' : '#c3c8cc');
    g.fillStyle = lucht;
    g.fillRect(0, 0, 1400, 520);
    g.fillStyle = v === 'na' ? '#8b5a44' : '#7d6a5c';
    g.fillRect(0, 320, 1400, 680);
    for (let y = 320; y < 1000; y += 26) {
      g.strokeStyle = 'rgba(0,0,0,0.08)';
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(1400, y);
      g.stroke();
    }
    const ramen = [
      [180, 430, 260, 320],
      [560, 430, 260, 320],
      [940, 430, 260, 320],
    ];
    for (const [rx, ry, rw, rh] of ramen) {
      g.fillStyle = v === 'na' ? '#2b3238' : '#e8e3d8';
      g.fillRect(rx - 14, ry - 14, rw + 28, rh + 28);
      g.fillStyle = v === 'na' ? '#9fc4e0' : '#b9b6a8';
      g.fillRect(rx, ry, rw, rh);
      if (v !== 'na') {
        g.strokeStyle = '#e8e3d8';
        g.lineWidth = 16;
        g.beginPath();
        g.moveTo(rx + rw / 2, ry);
        g.lineTo(rx + rw / 2, ry + rh);
        g.stroke();
      }
    }
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.fillRect(0, 940, 1400, 60);
    return c.toDataURL('image/jpeg', 0.9);
  }, variant);

const foto = await maakFoto('na');
fs.writeFileSync(path.join(uit, 'foto.jpg'), Buffer.from(foto.split(',')[1], 'base64'));

/* Merkprofiel invullen. */
await page.getByRole('tab', { name: 'Merk & aanbod' }).click();
await page.waitForTimeout(300);
const vul = async (label, waarde) =>
  page.locator('label.veld', { hasText: label }).first().locator('input').fill(waarde);
await vul('Bedrijfsnaam', 'Van Dijk Kozijnen');
await vul('Slogan', 'Warm, stil en onderhoudsvrij wonen');
await vul('Telefoon', '0413 - 55 12 30');
await vul('Website', 'vandijkkozijnen.nl');
await vul('Opgericht in', '2009');
await vul('Woningen per jaar', '180');
await vul('Gemiddelde score', '9,3');
await vul('Aantal beoordelingen', '412');
for (const plaats of ['Uden', 'Veghel', 'Oss']) {
  await page.locator('label.veld', { hasText: 'Werkgebied' }).locator('input[type=text]').fill(plaats);
  await page.getByRole('button', { name: 'Toevoegen', exact: true }).click();
}
await page.locator('label.veld', { hasText: 'Waarop geldt het?' }).locator('input').fill('op de montage bij een complete woning');
await page.locator('label.checkbox', { hasText: 'Actief' }).first().locator('input').check();
await page.locator('label.checkbox', { hasText: 'Referentieprijs getoetst' }).first().locator('input').check();
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(uit, '02-merk.png'), fullPage: true });

/* Studio: foto's koppelen. */
await page.getByRole('tab', { name: 'Studio' }).click();
await page.waitForTimeout(500);
await page.locator('div.veld', { hasText: 'Foto' }).first().locator('input[type=file]').setInputFiles(path.join(uit, 'foto.jpg'));
await page.waitForTimeout(900);
await page.screenshot({ path: path.join(uit, '03-studio.png'), fullPage: true });

/* Elk sjabloon in alle gekozen formaten vastleggen. */
const sjabloonSelect = page.locator('label.veld', { hasText: 'Sjabloon' }).locator('select');
const waarden = await sjabloonSelect.locator('option').evaluateAll((o) => o.map((x) => x.value));
const previews = page.locator('.previews').first();
for (const waarde of waarden) {
  await sjabloonSelect.selectOption(waarde);
  await page.waitForTimeout(500);
  await previews.screenshot({ path: path.join(uit, `sjabloon-${waarde}.png`) });
  const groot = await page.locator('.preview canvas').nth(1).evaluate((c) => c.toDataURL('image/png'));
  fs.writeFileSync(path.join(uit, `vol-${waarde}.png`), Buffer.from(groot.split(',')[1], 'base64'));
}

/* Actie-sjabloon met korting, en de flyer erbij. */
await sjabloonSelect.selectOption('aanbod');
await page.locator('label.veld', { hasText: 'Actie meenemen' }).locator('select').selectOption({ index: 1 });
await page.getByRole('button', { name: 'Flyer A5', exact: true }).click();
await page.waitForTimeout(700);
await previews.screenshot({ path: path.join(uit, 'sjabloon-aanbod-actie.png') });
// Op ware grootte wegschrijven: het canvas bevat al de volledige exportmaat.
for (const i of [0, 1, 2, 4]) {
  const data = await page.locator('.preview canvas').nth(i).evaluate((c) => c.toDataURL('image/png'));
  fs.writeFileSync(path.join(uit, `groot-aanbod-${i}.png`), Buffer.from(data.split(',')[1], 'base64'));
}

/* Kalender vullen. */
await page.getByRole('tab', { name: 'Kalender' }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: /Vul de planning/ }).click();
await page.waitForTimeout(900);
await page.screenshot({ path: path.join(uit, '06-kalender.png'), fullPage: true });

await page.getByRole('tab', { name: 'Koppelingen' }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(uit, '07-koppelingen.png'), fullPage: true });

await page.getByRole('tab', { name: 'Vandaag' }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(uit, '08-vandaag.png'), fullPage: true });


/* Functionele controle: levert de downloadknop een geldige zip op? */
await page.getByRole('tab', { name: 'Studio' }).click();
await page.waitForTimeout(500);
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button', { name: /Download alles/ }).click(),
]);
const zipPad = path.join(uit, 'pakket.zip');
await download.saveAs(zipPad);
console.log('zip:', download.suggestedFilename(), fs.statSync(zipPad).size, 'bytes');

console.log(fouten.length ? 'FOUTEN:\n' + fouten.join('\n') : 'geen console-fouten');
await browser.close();
