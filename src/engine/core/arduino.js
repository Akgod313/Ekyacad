import * as THREE from "three";
export const BLINK_EXAMPLE=`// OpenCircuit 3D - Fast Arduino mode\nconst int LED = 13;\n\nvoid setup() {\n  pinMode(LED, OUTPUT);\n  Serial.println("Blink started");\n}\n\nvoid loop() {\n  digitalWrite(LED, HIGH);\n  delay(500);\n  digitalWrite(LED, LOW);\n  delay(500);\n}\n`;

function transpile(src){
 const asyncNames=[...src.matchAll(/\bvoid\s+([A-Za-z_]\w*)\s*\(/g)].map(m=>m[1]);
 let s=src.replace(/\/\*[\s\S]*?\*\//g,"").replace(/^\s*#include[^\n]*$/gm,"");
 s=s.replace(/\bconst\s+(?:unsigned\s+)?(?:int|long|float|double|bool|byte|char|String)\s+/g,"const ");
 s=s.replace(/\b(?:unsigned\s+)?(?:int|long|float|double|bool|byte|char|String)\s+([A-Za-z_]\w*)\s*(?=[=;,\)])/g,"let $1");
 s=s.replace(/\bServo\s+([A-Za-z_]\w*)\s*;/g,"let $1 = new Servo();");
 s=s.replace(/\bvoid\s+([A-Za-z_]\w*)\s*\(/g,"async function $1(");
 s=s.replace(/\b(?:int|long|float|double|bool|byte|String)\s+([A-Za-z_]\w*)\s*\(/g,"function $1(");
 s=s.replace(/([,(]\s*)(?:const\s+)?(?:unsigned\s+)?(?:int|long|float|double|bool|byte|char|String)\s+([A-Za-z_]\w*)/g,"$1$2");
 for(const name of asyncNames){const re=new RegExp(`(?<!function\\s)(?<!await\\s)\\b${name}\\s*\\(`,"g");s=s.replace(re,`await ${name}(`)}
 s=s.replace(/(?<!await\s)\bdelayMicroseconds\s*\(/g,"await delayMicroseconds(");
 s=s.replace(/(?<!await\s)\bdelay\s*\(/g,"await delay(");
 return s;
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

export class ArduinoRuntime{
 constructor(engine,scene,log=()=>{}){this.engine=engine;this.scene=scene;this.log=log;this.running=false;this.boardId=null;this.token=0;}
 stop(){this.running=false;this.token++;this.engine.clearPinOutputs();}
 async start(source,boardId){this.stop();this.running=true;this.boardId=boardId;const myToken=++this.token;const engine=this.engine,scene=this.scene,log=this.log,board=scene.parts.get(boardId),logic=board?.userData.params.logicVoltage||5;
  const pinName=(p,analog=false)=>typeof p==="string"&&/^[AD]/.test(p)?p:(analog?`A${Number(p)}`:`D${Number(p)}`);
  const api={HIGH:1,LOW:0,OUTPUT:1,INPUT:0,INPUT_PULLUP:2,PI:Math.PI,
   pinMode:()=>{},digitalWrite:(pin,v)=>engine.setPinOutput(boardId,pinName(pin),v?1:0,"digital"),analogWrite:(pin,v)=>engine.setPinOutput(boardId,pinName(pin),Math.max(0,Math.min(255,Number(v)||0)),"pwm"),digitalRead:pin=>engine.getPinVoltage(boardId,pinName(pin))>logic/2?1:0,analogRead:pin=>Math.round(Math.max(0,Math.min(logic,engine.getPinVoltage(boardId,pinName(pin,true))))/logic*1023),
   delay:ms=>sleep(Math.max(0,Number(ms)||0)),delayMicroseconds:us=>sleep(Math.max(0,(Number(us)||0)/1000)),millis:()=>performance.now(),micros:()=>Math.floor(performance.now()*1000),constrain:(x,a,b)=>Math.max(a,Math.min(b,x)),map:(x,a,b,c,d)=>c+(x-a)*(d-c)/(b-a),random:(a,b)=>b===undefined?Math.floor(Math.random()*a):Math.floor(a+Math.random()*(b-a)),
   tone:(pin,f)=>{engine.setPinOutput(boardId,pinName(pin),1,"digital");const buz=[...scene.parts.values()].find(p=>p.userData.type==="buzzer");if(buz)buz.userData.params.frequency=Number(f)||440},noTone:pin=>engine.setPinOutput(boardId,pinName(pin),0,"digital"),
   Serial:{begin:()=>{},print:v=>log(String(v??"")),println:v=>log(String(v??"")+"\n")},
   lcdPrint:(id,text)=>this.setTextDevice(id,"lcd1602",text),oledPrint:(id,text)=>this.setTextDevice(id,"oled",text),neopixelSet:(id,i,r,g,b)=>this.setPixel(id,i,r,g,b),dhtTemperature:id=>scene.parts.get(id)?.userData.params.temperature??23,dhtHumidity:id=>scene.parts.get(id)?.userData.params.humidity??50,ultrasonicDistance:id=>scene.parts.get(id)?.userData.params.distance??100,analogSensor:id=>scene.parts.get(id)?.userData.params.value??2.5,
   Servo:class{constructor(){this.pin=null}attach(pin){this.pin=pin}write(angle){const s=[...scene.parts.values()].find(p=>p.userData.type==="servo");if(s)s.userData.params.angle=Math.max(0,Math.min(180,Number(angle)||0))}},
   __isRunning:()=>this.running&&this.token===myToken,__yield:()=>sleep(0)
  };
  const names=Object.keys(api),vals=Object.values(api),js=transpile(source)+`\nif(typeof setup!=="function"||typeof loop!=="function") throw new Error("Sketch requires setup() and loop()");\nawait setup();\nwhile(__isRunning()){await loop();await __yield();}`;
  try{const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;await new AsyncFunction(...names,js)(...vals)}catch(e){if(this.running&&this.token===myToken){log(`[fast runtime error] ${e.message}\n`);this.stop();throw e}}
 }
 setTextDevice(id,type,text){let p=this.scene.parts.get(id);if(!p||p.userData.type!==type)p=[...this.scene.parts.values()].find(x=>x.userData.type===type);if(p){p.userData.params.text=String(text);this.renderDisplay(p)}}
 renderDisplay(p){const screen=p.userData.visual.screen;if(!screen)return;const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");canvas.width=512;canvas.height=160;ctx.fillStyle=p.userData.type==="oled"?"#041015":"#18270d";ctx.fillRect(0,0,512,160);ctx.fillStyle=p.userData.type==="oled"?"#8ee8ff":"#b6df79";ctx.font="32px monospace";String(p.userData.params.text||"").split("\n").slice(0,2).forEach((line,i)=>ctx.fillText(line.slice(0,24),18,55+i*55));screen.material.map?.dispose();screen.material.map=new THREE.CanvasTexture(canvas);screen.material.needsUpdate=true}
 setPixel(id,i,r,g,b){let p=this.scene.parts.get(id);if(!p||p.userData.type!=="neopixel")p=[...this.scene.parts.values()].find(x=>x.userData.type==="neopixel");if(!p)return;i=Math.max(0,Math.min((p.userData.params.count||8)-1,Number(i)||0));const h=n=>Math.max(0,Math.min(255,Number(n)||0)).toString(16).padStart(2,"0");p.userData.params.pixels[i]=`#${h(r)}${h(g)}${h(b)}`}
}
