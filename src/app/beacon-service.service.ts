import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone, OnInit } from '@angular/core';
import { shareReplay,Observable, Subject, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ChanPlan, Beacon, CmanData, payload } from '../../interfaces';

@Injectable({
  providedIn: 'root'
})
export class BeaconServiceService  {

  private sseSubject = new Subject<payload>();
  private eventSrc: EventSource;
  private beacons_url = '/api/beacons';
  private chanplan_url = "/api/chanplan";
  private beacon_url = '/api/beacon';

  // Assuming initial values for CmanData[] and Beacon[] are empty arrays
  private cmanDataSubject = new BehaviorSubject<CmanData[]>([]);
  private beaconDataSubject = new BehaviorSubject<Beacon[]>([]);

  // Expose as Observable for subscribers
  cmanData$: Observable<CmanData[]> = this.cmanDataSubject.asObservable();
  beaconData$: Observable<Beacon[]> = this.beaconDataSubject.asObservable();

  constructor(
    private zone: NgZone,
    private http: HttpClient
  ) {

      this.eventSrc = new EventSource(this.beacons_url);
      this.eventSrc.onmessage = (event) => {
        // Using NgZone to ensure state updates are detected by Angular
        this.zone.run(() => {
          const data: { cman: CmanData[], bdata: Beacon[] } = JSON.parse(event.data); // Decode the JSON payload

          const cman_sorted: CmanData[] = data.cman.sort( (a,b) => a.chan - b.chan );
          this.cmanDataSubject.next(cman_sorted); // Update cmanData$

          const bdata_sorted: Beacon[] = data.bdata.sort( (a,b) => a.bssid.localeCompare(b.bssid));
          this.beaconDataSubject.next(bdata_sorted); // Update beaconData$
        });
      };

      this.eventSrc.onerror = (error) => {
        this.zone.run(() => {
          this.sseSubject.error(error); // Handle any errors
        });
      };
  }

  resetCounter(mac: string) {
    return this.http.post<string>(this.beacon_url + `/${mac}`, { cmd: 'reset'});
  }

  getLatestCh(): CmanData[] {
    return this.cmanDataSubject.getValue();
  }

  getChanPlan(): Observable<ChanPlan[]> {
    return this.http.get<ChanPlan[]>(this.chanplan_url)
  }

  /* Update the chan plan entirely */
  postChanPlan(data:{chan:number}[]) {
    return this.http.post<string>(this.chanplan_url, data);
  }

  addChan( newChan: number ) {
      const cman = this.getLatestCh();
      const chanArray = Array.from(cman).map(chan => ({ chan:chan.chan }));

      const newCman = { chan: newChan, ts: 0, active: false };
      cman.push( newCman );
      const cman_sorted: CmanData[] = cman.sort( (a,b) => a.chan - b.chan );
      this.cmanDataSubject.next(cman_sorted); // Update cmanData$
      
      chanArray.push( { chan:newChan } );
      return this.postChanPlan( chanArray );
  }

  /* Expecting multiple channels in csv */
  updateChanPlan(chanstr: string) {

    console.log(`Here I am: ${chanstr}`);

    // Convert query string to an array of values
    const chans = chanstr.split(',');


    const dataToSend = chans.reduce((acc: { chan:number }[], current:string ) => {
      const obj = { 'chan':Number(current) };
      acc.push(obj);
      return acc;
    }, []);

    console.log("Posting chan-plan: ", chans);
    this.postChanPlan(dataToSend).subscribe();
  }

}
