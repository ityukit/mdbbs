import fs from 'fs';
import path from 'path';

export default async function dynamicLoader(directory,callback,subdir) {
  if (!subdir) {
    subdir = '/'; // Default to root directory
  }
  const files = fs.readdirSync(`${directory}${subdir}`);
  for (const file of files) {
    if (fs.statSync(`${directory}${subdir}${file}`).isFile()) {
      if (!file.startsWith('.') && !file.startsWith('_') && file.endsWith('.js')) {
        const modulePath = `${directory}${subdir}${file}`;
        console.log(modulePath)
        const module = await import('../../' + modulePath);
        const moduleName = file.substring(0, file.length - 3); // Remove .js extension
        if (callback){
          await callback(subdir,moduleName,module);
        }
      }
    }else if (fs.statSync(`${directory}${subdir}${file}`).isDirectory()) {
      if (!file.startsWith('.') && !file.startsWith('_')) {
        await dynamicLoader(directory, callback, `${subdir}${file}/`);
      }
    }
  }
}

