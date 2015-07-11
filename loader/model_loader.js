import fs from 'fs';
import path from 'path';
import inflection from 'inflection';
import config from 'config';
import Sequelize from 'sequelize';

export let models = function (dir) {
  var sequelize = new Sequelize(
    config.database.name,
    config.database.user,
    config.database.pass,
    config.database
  );

  let models = new Map();
  let modelRelations = new Map();
  models.set('sequelize', sequelize);

  fs.readdirSync(dir).forEach(filename => {
    filename = path.basename(filename, '.js');

    if (filename === 'sequelize') {
      throw new Error('Model cannot use the name of "sequelize"');
    }

    let m = require(path.join(dir, filename));
    let modelName = inflection.camelize(filename);
    let model = m[modelName];

    let modelInstance = sequelize.import(modelName, (sequelize, DataTypes) => {
      let arg = {};
      let options = {};
      arg.option = function (name, def) {
        options[name] = def;
      };
      let properties = {};
      arg.property = function (name, def) {
        properties[name] = def;
      };
      let relations = new Map();
      arg.relation = {};
      ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany'].forEach(relation => {
        relations.set(relation, []);
        arg.relation[relation] = function (model, options) {
          relations[relation].push({ model, options });
        };
      });

      model.init(sequelize, arg);
      let definition = [modelName].concat(properties).concat(options);
      ['hooks', 'instanceMethods', 'classMethods'].forEach(function(property) {
        var obj = options[property];
        if (!obj) {
          return;
        }
        Object.keys(obj).forEach(key => {
          if (typeof obj[key] === 'function' && obj[key].constructor && obj[key].constructor.name === 'GeneratorFunction') {
            obj[key] = co.wrap(obj[key]);
          }
        });
      });

      modelRelations.set(modelName, relations);
      return sequelize.define.apply(sequelize, definition);
    });

    models.set(modelName, modelInstance);
  });

  for (let [srcModel, relations] of modelRelations) {
    for (let [type, defs] of relations) {
      defs.forEach(({ tgtModel, options }) => {
        models.get(srcModel)[type](models.get(tgtModel), options);
      });
    }
  }

  return models;
};
