const fs = require('fs');
let content = fs.readFileSync('/tmp/cleaned.tsx', 'utf8');

let startIndex = content.indexOf('function VistaDashboard({ t }: { t: any }) {');
let endIndex = content.indexOf('function VistaUsuarios({ t }: { t: any }) {');
let dashboardStr = content.substring(startIndex, endIndex);

let divMatch = dashboardStr.match(/<div/g) || [];
let endDivMatch = dashboardStr.match(/<\/div>/g) || [];
console.log("VistaDashboard divs: ", divMatch.length, " endDivs: ", endDivMatch.length);

let totalDivMatch = content.match(/<div/g) || [];
let totalEndDivMatch = content.match(/<\/div>/g) || [];
console.log("Total divs: ", totalDivMatch.length, " endDivs: ", totalEndDivMatch.length);

