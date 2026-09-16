const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const s={require:()=>require('../api/midiremote_api_v1')};vm.createContext(s);
vm.runInContext(fs.readFileSync(require('path').join(__dirname,'..','PreSonus_IOStation.js'),'utf8'),s);
for(const [hz,expected] of [[20,[0,127,0]],[20*Math.pow(15,1/3),[127,48,0]],[20*Math.pow(15,2/3),[100,0,127]],[300,[127,0,127]]]){
const c=s.getHighPassColor(hz);assert.deepEqual([c.red,c.green,c.blue].map(Math.round),expected);
}
for(let hz=20;hz<=1000;hz+=.5){const c=s.getHighPassColor(hz),rgb=[c.red,c.green,c.blue];assert(Math.abs(Math.max(...rgb)-127)<1e-9);assert(Math.min(...rgb)<49);assert(c.blue <= c.red * 1.28);}
console.log('PASS: green/amber/purple/magenta gradient, endpoint clamps, no white/gray or dim midpoint');
