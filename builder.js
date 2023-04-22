const fs = require('fs');
const path = require('path');


const process = function(src, dest){
  let wcbconfig = getConfig(src);
  dest = path.resolve(dest);
  if (fs.existsSync(dest)) {
    fs.rmdirSync(dest, { recursive: true });
  }   

  build(src,dest,wcbconfig);
}

function getConfig(src){

  const configPATH = path.join(src,'wcb.json');
  if (!fs.existsSync(configPATH)) {
    throw "wcb.json doesn't exist.";
  }

  const data = fs.readFileSync(configPATH);
  let jsonData = JSON.parse(data);

  relHtmlPathArr =  jsonData.hasOwnProperty('requiredHTML')? jsonData['requiredHTML']:[]
  absHtmlPathArr = relHtmlPathArr.map(p => path.resolve(p));
  jsonData['requiredHTML'] = absHtmlPathArr;
  jsonData['configPATH'] = configPATH;
  jsonData['minify'] = jsonData.hasOwnProperty('minify')?jsonData['minify']:false;
  return jsonData;
}

const build = function(src, dest,config) {

  dest = path.resolve(dest);
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true }).filter(file => (!file.isDirectory()) || path.join(src, file.name)!== dest); 

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      build(srcPath, destPath,config);
    } else {
      if(srcPath == config['configPATH']){
        continue;
      }
      if( !entry.name.endsWith('.html') || config['requiredHTML'].includes(srcPath) )
      {
        fs.copyFileSync(srcPath, destPath);
      }
      if (entry.name.endsWith('.js')) {
        const content = fs.readFileSync(destPath, 'utf-8');
        const updatedContent = content.replace(/_htmlFrom\('(.*)'\)/g, (_, p1) => {
          const htmlPath = path.join(path.dirname(srcPath), p1);
          const htmlContent = fs.readFileSync(htmlPath, 'utf-8');      
          let newCode =  ('`' + htmlContent.replace(/`/g, '\\`') + '`')
          if(config['minify'])
          {
            newCode = newCode.replace(/\s*\n\s*/g, '')
          }    
          return newCode
        });
        fs.writeFileSync(destPath, updatedContent);
      }
    }
  }
}

module.exports = {process}
