const AVR8_URL="https://esm.sh/avr8js@0.21.0";
const GCC_URL="https://cdn.jsdelivr.net/npm/@horang-corp/avr-gcc-wasm@0.2.0/index.js";
const GCC_ASSETS="https://cdn.jsdelivr.net/npm/@horang-corp/avr-gcc-wasm@0.2.0/";
function loadHex(source,target){for(const line of source.split(/\r?\n/)){if(line[0]===":"&&line.slice(7,9)==="00"){const bytes=parseInt(line.slice(1,3),16),addr=parseInt(line.slice(3,7),16);for(let i=0;i<bytes;i++)target[addr+i]=parseInt(line.slice(9+i*2,11+i*2),16)}}}
export async function compileUnoSketch(source,onStatus=()=>{}){
 onStatus("Loading AVR-GCC/WASM…");
 // The upstream package's compile() creates a Worker relative to its own module URL.
 // When loaded from a third-party CDN that Worker can be cross-origin, so create a
 // same-origin blob Worker and invoke the package's buildFirmware() inside it.
 const workerSource=`import { buildFirmware } from ${JSON.stringify(GCC_URL)};\nself.onmessage=async(e)=>{try{const result=await buildFirmware({source:e.data.source,assetsBase:e.data.assetsBase});self.postMessage({ok:true,result})}catch(err){self.postMessage({ok:false,error:{message:err?.message||String(err),stack:err?.stack||""}})}};`;
 const url=URL.createObjectURL(new Blob([workerSource],{type:"text/javascript"}));
 const worker=new Worker(url,{type:"module"});
 onStatus("Compiling Arduino Uno C++ entirely in this browser…");
 try{return await new Promise((resolve,reject)=>{
   worker.onmessage=e=>{const d=e.data||{};if(d.ok&&d.result?.hex)resolve(d.result);else reject(new Error(d.error?.message||"Compiler returned no Intel HEX"))};
   worker.onerror=e=>reject(new Error(e.message||"AVR-GCC worker failed"));
   worker.postMessage({source,assetsBase:GCC_ASSETS});
 })}finally{worker.terminate();URL.revokeObjectURL(url)}
}
export class AVR8Runner{
 constructor(engine,scene,log=()=>{}){this.engine=engine;this.scene=scene;this.log=log;this.running=false;this.boardId=null;this.avr=null;this.raf=0}
 async start(hex,boardId){this.stop();const p=this.scene.parts.get(boardId);if(!p||!["arduino","nano"].includes(p.userData.type))throw new Error("AVR8js mode currently targets Arduino Uno/Nano (ATmega328P).");this.boardId=boardId;const avr=await import(AVR8_URL);this.avr=avr;const program=new Uint16Array(0x8000);loadHex(hex,new Uint8Array(program.buffer));const cpu=new avr.CPU(program),timer0=new avr.AVRTimer(cpu,avr.timer0Config),timer1=new avr.AVRTimer(cpu,avr.timer1Config),timer2=new avr.AVRTimer(cpu,avr.timer2Config),portB=new avr.AVRIOPort(cpu,avr.portBConfig),portC=new avr.AVRIOPort(cpu,avr.portCConfig),portD=new avr.AVRIOPort(cpu,avr.portDConfig),usart=new avr.AVRUSART(cpu,avr.usart0Config,16e6);this.cpu=cpu;this.ports={B:portB,C:portC,D:portD};this.running=true;
  const updateDigital=(port,base,count)=>port.addListener(()=>{for(let i=0;i<count;i++){const state=port.pinState(i),pin=`D${base+i}`,key=`${boardId}:${pin}`;if(state===avr.PinState.High||state===avr.PinState.Low)this.engine.setPinOutput(boardId,pin,state===avr.PinState.High?1:0,"digital");else this.engine.pinOutputs.delete(key)}});
  const updateAnalog=(port,count)=>port.addListener(()=>{for(let i=0;i<count;i++){const state=port.pinState(i),pin=`A${i}`,key=`${boardId}:${pin}`;if(state===avr.PinState.High||state===avr.PinState.Low)this.engine.setPinOutput(boardId,pin,state===avr.PinState.High?1:0,"digital");else this.engine.pinOutputs.delete(key)}});
  updateDigital(portD,0,8);updateDigital(portB,8,6);updateAnalog(portC,6);usart.onByteTransmit=b=>this.log(String.fromCharCode(b));
  const frame=()=>{if(!this.running)return;this.syncInputs();const target=cpu.cycles+Math.min(300000,Math.max(30000,16e6/60));while(cpu.cycles<target){avr.avrInstruction(cpu);cpu.tick()}this.raf=requestAnimationFrame(frame)};frame();
 }
 syncInputs(){if(!this.ports)return;for(let i=0;i<8;i++)this.ports.D.setPin(i,this.engine.getPinVoltage(this.boardId,`D${i}`)>2.5);for(let i=0;i<6;i++)this.ports.B.setPin(i,this.engine.getPinVoltage(this.boardId,`D${8+i}`)>2.5);for(let i=0;i<6;i++)this.ports.C.setPin(i,this.engine.getPinVoltage(this.boardId,`A${i}`)>2.5)}
 stop(){this.running=false;if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;this.engine.clearPinOutputs()}
}
