import { MongoClient } from "../../../deps.ts";
import { IDBOBJ } from "../../@types/IDBObj.ts";
import config from "../../ursamu.config.ts";
import { IChannel } from "../../@types/Channels.ts";
import { IMail } from "../../@types/IMail.ts";
import { IArticle, IBoard } from "../../@types/index.ts";

function d(...args) {
  const e = new Error();
  const level = e.stack.split("\n").slice(3, 5);
  console.log(...args, level);
}

export class DBO<T> {
  db: any;

  constructor(path: string) {
    this.collection = path.replace('.','_');
    const uri = `mongodb://root:root@mongo/`;
    this.client = new MongoClient(uri);
    this.client.connect();
  }

  coll() {
    return this.client.db().collection(this.collection);
  }

  async create(data: T) {
    await this.coll().insertOne(data);
    return await this.query(data)
  }

  async query(query?: any) {
    const ret = await this.coll().find(query);
    return await ret.toArray();
  }

  async all() {
    const ret = await this.coll().find({});
    return await ret.toArray();
  }

  async modify(query: any, operator: string, data: any) {
    var body = {}
    body[operator] = data
    const ret = await this.coll().updateMany(query, body)
    return await this.query(query)
  }

  async delete(query: any) {
  }

  /*
  async remove(query: any) {
    d("[database remove] gets", query);
    await this.coll().deleteMany(query);
  }
  */

  async length(query: any) {
  }

  /*
  async count(query: any) {
    d("[database count] gets", query);
    const ret = await this.coll().count(query);
    d("[database count] returns", ret);
    return ret;
  }
  */
}

export interface ICounters {
  _id: string;
  seq: number;
}

export const counters = new DBO<ICounters>(`${config.server?.counters}`);
export const bboard = new DBO<IBoard>(`${config.server?.bboard}`);
export const dbojs = new DBO<IDBOBJ>(`${config.server?.db}`);
export const chans = new DBO<IChannel>(`${config.server?.chans}`);
export const mail = new DBO<IMail>(`${config.server?.mail}`);
export const wiki = new DBO<IArticle>(`${config.server?.wiki}`);
