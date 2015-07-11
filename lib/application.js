import fs from 'fs';
import path from 'path';
import koa from 'koa';
import koaRouter from 'koa-router';
import inflection from 'inflection';
import compose from 'composition';
import config from 'config';
import { Router } from './router';
import * as loader from '../loader';

export class Application {
  constructor() {
    this.koa = koa();
    this.use = this.koa.use.bind(this.koa);
    this.callback = this.koa.callback.bind(this.koa);

    this._routes = [];
    this.router = new Router(`${config.site.root}/`, this._routes);
  }

  static get dir () {
    throw new Error('`Application.get dir` should be override.');
  }
}
