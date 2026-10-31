'use strict';
const {app,BrowserWindow,protocol,net,shell}=require('electron');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
protocol.registerSchemesAsPrivileged([{scheme:'wird',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}]);
const root=__dirname;
function resolveWithin(base,pathname){
 let rel;try{rel=decodeURIComponent(pathname).replace(/^\/+/, '')||'index.html'}catch{return null}
 if(rel.includes('\\')||rel.includes('\0'))return null;
 const full=path.resolve(base,rel);
 return full.startsWith(path.resolve(base)+path.sep)?full:null;
}
function makeWindow(){
 const w=new BrowserWindow({width:1320,height:900,minWidth:820,minHeight:590,show:false,autoHideMenuBar:true,backgroundColor:'#f7f8f5',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});
 w.once('ready-to-show',()=>w.show());
 w.webContents.setWindowOpenHandler(({url})=>{if(/^https:\/\//.test(url))shell.openExternal(url);return {action:'deny'}});
 w.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith('wird://app/')){event.preventDefault();if(/^https:\/\//.test(url))shell.openExternal(url)}});
 w.loadURL('wird://app/index.html');
}
app.whenReady().then(()=>{
 protocol.handle('wird',request=>{
  const u=new URL(request.url);
  if(u.hostname!=='app')return new Response('Not found',{status:404});
  const isAudio=u.pathname.startsWith('/offline-audio/');
  const rel=isAudio?u.pathname.slice('/offline-audio/'.length):u.pathname;
  const base=isAudio?path.join(process.resourcesPath,'offline-audio'):root;
  const file=resolveWithin(base,rel);
  if(!file||!fs.existsSync(file)||!fs.statSync(file).isFile())return new Response('Not found',{status:404});
  return net.fetch(pathToFileURL(file).href);
 });
 makeWindow();
 app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)makeWindow()});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
