

export interface ChanPlan {
  chan: number,
  dwell?: number
}

export interface CmanData {
  chan: number,
  ts: number,
  active: boolean,
  inflight?: boolean
}

export interface Beacon {
  bssid: string,
  ssid: string,
  age: number,
  channel: string,
  freq: number,
  dbm: number,
  ibss: boolean,
  vendorie: any,
  rsn: any
};

export interface payload {
  cman: CmanData[],
  bdata: Beacon[]
}
