import * as yazl from 'yazl';
import {createWriteStream,readdirSync,mkdirSync} from 'node:fs';
import {join,basename,resolve} from 'node:path';
import {pipeline} from 'node:stream/promises';
const root=resolve(import.meta.dirname,'..'),out=join(root,'dist','windows'),dest=join(root,'dist','share');mkdirSync(dest,{recursive:true});
const files=readdirSync(out).filter(x=>/^WIRD_Quran_.*\.exe$/i.test(x));
if(!files.length)throw Error('No built Windows executables found in '+out);
for(const name of files){
 const z=new yazl.ZipFile();z.addFile(join(out,name),name,{compress:false,forceZip64Format:true});z.end({forceZip64Format:true});
 const filepath=join(dest,name+'.zip');await pipeline(z.outputStream,createWriteStream(filepath));
 console.log('ZIP64 package created:',filepath);
}
