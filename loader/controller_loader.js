import fs from 'fs';
import path from 'path';
import inflection from 'inflection';

export let controllers = function (dir) {
  let controllers = new Map();

  fs.readdirSync(dir).forEach(filename => {
    filename = path.basename(filename, '.js');
    let end = '_controller';
    if (!filename.endsWith(end)) {
      return;
    }

    let m = require(path.join(dir, filename));
    let controller = m[inflection.camelize(filename)];
    controller.init();
    let name = filename.replace(new RegExp(`${end}$`), '');
    controllers.set(name, controller);
  });

  return controllers;
};
