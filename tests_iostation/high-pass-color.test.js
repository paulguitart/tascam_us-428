const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const s={require:()=>require('../api/midiremote_api_v1')};vm.createContext(s);
vm.runInContext(fs.readFileSync(require('path').join(__dirname,'..','PreSonus_IOStation.js'),'utf8'),s);
for(const [hz,expected] of [[20,[0,127,0]],[20*Math.pow(15,1/3),[0,127,127]],[20*Math.pow(15,2/3),[0,0,127]],[300,[127,0,127]]]){
const c=s.getHighPassColor(hz);assert.deepEqual([c.red,c.green,c.blue].map(Math.round),expected);
}
for(let hz=20;hz<=1000;hz+=.5){const c=s.getHighPassColor(hz),rgb=[c.red,c.green,c.blue];assert.equal(Math.max(...rgb),127);assert.equal(Math.min(...rgb),0);}
console.log('PASS: saturated high-pass gradient, endpoint clamps, no white/gray or dim midpoint');
