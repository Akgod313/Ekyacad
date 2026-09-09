const CDN="https://esm.sh/@o.z/ngspice-wasm@0.0.0";
const WASM="https://cdn.jsdelivr.net/npm/@o.z/ngspice-wasm@0.0.0/";

function allocCString(mod,text){
  const len=typeof mod.lengthBytesUTF8==="function"?mod.lengthBytesUTF8(text)+1:new TextEncoder().encode(text).length+1;
  const ptr=mod._malloc(len);mod.stringToUTF8(text,ptr,len);return ptr;
}
function runMain(mod,args){
  if(typeof mod.callMain==="function")return mod.callMain(args.slice(1));
  if(typeof mod._main!=="function")throw new Error("ngspice WASM _main entry point unavailable");
  const ptrs=args.map(a=>allocCString(mod,a)),argv=mod._malloc((ptrs.length+1)*4);
  const heap32=mod.HEAPU32||new Uint32Array(mod.wasmMemory.buffer);
  ptrs.forEach((p,i)=>heap32[(argv>>2)+i]=p);heap32[(argv>>2)+ptrs.length]=0;
  try{return mod._main(ptrs.length,argv)}finally{for(const p of ptrs)mod._free(p);mod._free(argv)}
}
export async function runSpice(netlist,log=()=>{}){
  log("[spice] Loading ngspice WebAssembly…\n");
  const {default:createNgspiceModule}=await import(CDN);let output="";
  const ng=await createNgspiceModule({noInitialRun:true,locateFile:f=>WASM+f,print:t=>{output+=t+"\n"},printErr:t=>{output+=t+"\n"}});
  ng.FS.writeFile("/circuit.cir",netlist);
  const rc=runMain(ng,["ngspice","-b","/circuit.cir"]);
  if(rc&&rc!==0)output+=`[spice] exit code ${rc}\n`;
  log(output||"[spice] Simulation completed.\n");return output;
}
