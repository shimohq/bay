export class RequestAgent {
  constructor() {
    this.map = new Map();
  }

  set(k, v) {
    this.map.set(k, v);
  }

  get(k) {
    this.map.get(k);
  }
}
