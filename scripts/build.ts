import * as fs from 'fs-extra';
import * as path from 'path';
import consola from 'consola';
import minify from 'minify';
import {obfuscate} from 'javascript-obfuscator';

const rootPath: string = process.cwd();
const distDir: string = path.join(rootPath, 'dist');
const indexScript: string = path.join(distDir, 'index.js');

if (!fs.existsSync(distDir)) {
    consola.error("TypeScript was not compiled");
    process.exit(1);
}

minify(indexScript).then(script => {
    fs.writeFileSync(indexScript, obfuscate(script, {
        compact: true,
        simplify: true
    }).getObfuscatedCode());
}).catch(consola.error);