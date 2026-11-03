import { createRequire } from 'node:module';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import {pathToFileURL} from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require=createRequire(import.meta.url);
const viteRequire=createRequire(require.resolve('vitest/package.json'));
const {createServer}=await import(pathToFileURL(viteRequire.resolve('vite')).href);
const server=await createServer({configFile:resolve('vitest.config.ts'),server:{middlewareMode:true},appType:'custom',logLevel:'silent'});
try{
 const catalog=await server.ssrLoadModule('/src/data/catalog.ts');
 const Visual=(await server.ssrLoadModule('/src/components/PartVisual.tsx')).default;
 const data=catalog.parts.map(p=>({...p,brand:'KEYLAB 演示',isDemoData:true,status:'active',imageUrl:'/parts/'+p.slot+'.svg'}));
 await writeFile('src/data/demo-products.json',JSON.stringify(data,null,2)+'\n');
 await mkdir('public/parts',{recursive:true});
 for(const slot of catalog.slots){let svg=renderToStaticMarkup(React.createElement(Visual,{slot,color:'#a594d0'}));svg=svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');await writeFile('public/parts/'+slot+'.svg',svg+'\n')}
 console.log('演示商品：'+data.length+'；75%：'+data.filter(p=>p.layout==='ansi-81').length);
}finally{await server.close()}

