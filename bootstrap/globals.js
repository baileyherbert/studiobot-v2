const path = require('path');
const fs = require('fs');

// For documentation, see /src/framework/types/global.d.ts

global._ = require('lodash');
global.pub = p => path.join(__dirname, '../public', p);
global.tmp = p => path.join(__dirname, '../', p);
global.rootpath = p => path.join(__dirname, '../', p);
global.sleep = t => new Promise(resolve => setTimeout(resolve, t));

global.readPublicFile = p => {
    let filePath = path.join(__dirname, '../public', p);

    if (!fs.existsSync(filePath)) {
        throw new Error('Public file does not exist: ' + p);
    }

    let data = fs.readFileSync(filePath).toString();
    let lines = data.split('\n');

    return lines.filter(function (line) {
        return line.indexOf('#') != 0;
    }).join('\n').trim();
};
