import fs from 'fs';
import path from 'path';

const INPUT_PATH = path.join(process.cwd(), 'program-studi.csv');
const OUTPUT_PATH = path.join(process.cwd(), 'src', 'data', 'ptn-data.json');

// Ensure directory exists
const dir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Keywords to identify PTN and Kedinasan
const PTN_KEYWORDS = [
  ' NEGERI ', ' NEGERI', 'NEGERI ', 'UNIVERSITAS INDONESIA', 
  'INSTITUT TEKNOLOGI BANDUNG', 'INSTITUT TEKNOLOGI SEPULUH NOPEMBER',
  'UNIVERSITAS GADJAH MADA', 'UNIVERSITAS AIRLANGGA', 'UNIVERSITAS PADJADJARAN',
  'UNIVERSITAS BRAWIJAYA', 'UNIVERSITAS DIPONEGORO', 'UNIVERSITAS HASANUDDIN',
  'UNIVERSITAS SEBELAS MARET', 'UNIVERSITAS UDAYANA', 'UNIVERSITAS SUMATERA UTARA',
  'UNIVERSITAS SYIAH KUALA', 'UNIVERSITAS ANDALAS', 'UNIVERSITAS SRIWIJAYA',
  'UNIVERSITAS RIAU', 'UNIVERSITAS TANJUNGPURA', 'UNIVERSITAS LAMBUNG MANGKURAT',
  'UNIVERSITAS MULAWARMAN', 'UNIVERSITAS PATTIMURA', 'UNIVERSITAS CENDERAWASIH',
  'UNIVERSITAS NUSA CENDANA', 'UNIVERSITAS HALU OLEO', 'UNIVERSITAS TADULAKO',
  'INSTITUT PERTANIAN BOGOR', 'UPN ', 'UIN ', 'IAIN ', 'STAIN ', 'POLITEKNIK KESEHATAN',
  'POLTEKKES', 'POLITEKNIK MANUFAKTUR', 'POLITEKNIK PERKAPALAN', 'POLITEKNIK ELEKTRONIKA'
];

const KEDINASAN_KEYWORDS = [
  'STAN', 'STIS', 'STIN', 'STMKG', 'STSN', 'POLTEKIP', 'POLTEKIM', 'IPDN',
  'SEKOLAH TINGGI SANDI NEGARA', 'SEKOLAH TINGGI INTELIJEN NEGARA',
  'SEKOLAH TINGGI METEOROLOGI', 'SEKOLAH TINGGI ILMU STATISTIK',
  'INSTITUT PEMERINTAHAN DALAM NEGERI', 'POLITEKNIK KEUANGAN NEGARA',
  'POLITEKNIK ILMU PEMASYARAKATAN', 'POLITEKNIK IMIGRASI', 'SEKOLAH TINGGI AKUNTANSI NEGARA'
];

function isPtnOrKedinasan(name) {
  const upperName = name.toUpperCase();
  for (const kw of PTN_KEYWORDS) {
    if (upperName.includes(kw)) return true;
  }
  for (const kw of KEDINASAN_KEYWORDS) {
    if (upperName.includes(kw)) return true;
  }
  return false;
}

const ptnData = {};

try {
  const content = fs.readFileSync(INPUT_PATH, 'utf-8');
  const lines = content.split('\n');
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Format: No,Nama Prodi,Nama PT,Jenjang,LLDikti,
    const match = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
    if (!match || match.length < 4) continue;
    
    const clean = match.map(m => {
      let val = m.startsWith(',') ? m.substring(1) : m;
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1).replace(/""/g, '"');
      }
      return val.trim();
    });

    const prodi = clean[1];
    const pt = clean[2];
    const jenjang = clean[3];

    if (!pt || !prodi) continue;

    if (isPtnOrKedinasan(pt)) {
      if (!ptnData[pt]) {
        ptnData[pt] = {
          name: pt,
          majors: []
        };
      }
      
      // Only include S1/D4/D3
      if (jenjang === 'S-1' || jenjang === 'D-IV' || jenjang === 'D-III' || jenjang === 'S1' || jenjang === 'D4' || jenjang === 'D3') {
        const majorName = `${prodi} (${jenjang})`;
        if (!ptnData[pt].majors.includes(majorName)) {
            ptnData[pt].majors.push(majorName);
        }
      }
    }
  }

  const ptnArray = Object.values(ptnData)
    .filter(pt => pt.majors.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
  
  // Sort majors
  ptnArray.forEach(pt => {
      pt.majors.sort();
  });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(ptnArray, null, 2));
  console.log(`Successfully wrote ${ptnArray.length} PTN/Kedinasan to ${OUTPUT_PATH}`);

} catch (err) {
  console.error('Error processing data:', err.message);
}
