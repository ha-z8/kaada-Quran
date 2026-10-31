import * as yazl from 'yazl';
import {createWriteStream,readdirSync,mkdirSync,statSync,existsSync} from 'node:fs';
import {join,relative,resolve,basename} from 'node:path';
import {pipeline} from 'node:stream/promises';
const root=resolve(import.meta.dirname,'..'),out=join(root,'dist','windows'),dest=join(root,'dist','share');
mkdirSync(dest,{recursive:true});
function scan(folder){const list=[];for(const entry of readdirSync(folder,{withFileTypes:true})){const f=join(folder,entry.name);if(entry.isDirectory())list.push(...scan(f));else if(entry.isFile())list.push(f)}return list}
async function writeZip(filepath,files,base,folderPrefix=''){
 const zip=new yazl.ZipFile();
 for(const f of files){
  const rel=relative(base,f).replace(/\\/g,'/');
  zip.addFile(f,folderPrefix+rel,{compress:false,forceZip64Format:true});
 }
 zip.end({forceZip64Format:true});
 await pipeline(zip.outputStream,createWriteStream(filepath));
 console.log('ZIP64 archive ready:',filepath,'files:',files.length);
}
const portable=join(out,'win-unpacked');
if(process.argv.includes('--folder')){
 if(!existsSync(portable))throw Error('Missing packaged Windows app directory '+portable);
 await writeZip(join(dest,'WIRD_Quran_Offline_Windows_x64_Folder.zip'),scan(portable),portable,'WIRD Quran/');
}
const installers=readdirSync(out).filter(n=>/^WIRD_Quran_.*\.exe$/i.test(n));
for(const n of installers)await writeZip(join(dest,n+'.zip'),[join(out,n)],out);
if(!installers.length&&!process.argv.includes('--folder'))throw Error('No Windows exe installer available');
