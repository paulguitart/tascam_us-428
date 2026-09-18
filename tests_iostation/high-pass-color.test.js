const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','PreSonus_IOStation.js'),'utf8').replace(/\r\n/g,'\n');
const s={RED:[127,0,0],WHITE:[127,127,127],MAGENTA:[127,0,127]};vm.createContext(s);
const highPassStart=source.indexOf('function updateHighPassLED(');
const highPassEnd=source.indexOf('function setupHighPassFeedback(',highPassStart);
assert(highPassStart>=0&&highPassEnd>highPassStart);
vm.runInContext(source.slice(highPassStart,highPassEnd),s);
const preGainStart=source.indexOf('var preGainFeedbackValue = null');
const preGainEnd=source.indexOf('function setupPreGainFeedback(',preGainStart);
assert(preGainStart>=0&&preGainEnd>preGainStart);
vm.runInContext(source.slice(preGainStart,preGainEnd),s);
const state={knobMode:'HighPass',highPassEnabled:'0'},ctx={getState:k=>state[k]||'',setState:(k,v)=>state[k]=v};
const colors=[],lit=[];
s.setRGBLED_color=(_,note,color)=>colors.push({note,color:Array.from(color)});
s.onLED=(_,note)=>lit.push(note);
s.cChannel=42;s.updateHighPassLED(ctx);
assert.deepEqual(colors.pop(),{note:42,color:[127,127,127]});
state.highPassEnabled='1';s.updateHighPassLED(ctx);
assert.deepEqual(colors.pop(),{note:42,color:[127,0,0]});
state.knobMode='Pan';s.updateHighPassLED(ctx);
assert.equal(colors.length,0);assert.equal(lit.length,2);
let gain=.5;s.preGainFeedbackValue={getProcessValue:()=>gain};state.knobMode='PreGain';
for(const [v,expected] of [[.5,[127,127,127]],[0,[127,0,127]],[.499,[127,0,127]],[.501,[127,0,127]],[1,[127,0,127]]]){
  gain=v;s.updatePreGainLED(ctx);assert.deepEqual(colors.pop(),{note:42,color:expected});
}
console.log('PASS: Channel LED is white/red in High Pass and white/magenta in Pre Gain');
