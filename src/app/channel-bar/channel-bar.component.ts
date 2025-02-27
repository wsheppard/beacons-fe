import {CommonModule} from '@angular/common';
import { Component, Input } from '@angular/core';
import {BeaconServiceService} from '../beacon-service.service';
import {BehaviorSubject, tap, Observable, Subject, bufferTime, combineLatest, filter, map, withLatestFrom} from 'rxjs';
import {CmanData} from '../../../interfaces';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';


interface CmanUI {
  cman: CmanData,
  icon: string|null
}

@Component({
  selector: 'app-channel-bar',
  standalone: true,
  imports: 
    [
    CommonModule,
    NgbTooltipModule,
    FormsModule
  ],
  templateUrl: './channel-bar.component.html',
  styleUrl: './channel-bar.component.scss',
})
export class ChannelBarComponent {
  public cman$: Observable<CmanData[]>;
  clickSubject$ = new BehaviorSubject<CmanUI|null>(null);
  inflight = new Set<number>([]);
  localCman$ = new BehaviorSubject<CmanUI[]>([]);
  newChanValue: string = "";

  constructor(private beaconService: BeaconServiceService) {
    this.cman$ = this.beaconService.cmanData$;

    /* 
     * So this.cman$ is the stream from SSE with channel data.
     * `clickSubject$` is the local stream used to de-bounce updates to the 
     * scan plan.
     */
    combineLatest([this.cman$, this.clickSubject$]).pipe(
      map(([cmans, chan]) => {

        const localMap = new Map( this.localCman$.getValue().map( item => [item.cman.chan, item.cman] ));
              
        cmans.forEach( item => {
          localMap.set( item.chan, item );
        }) 
 
        /* If scan state changes */
        if ( chan != null )
          localMap.set( chan.cman.chan, chan.cman );
         
        console.log("Existing cman local: ", localMap);
        
        if (chan == null) {
          //console.log('Reset Click Stream');
          this.inflight.clear();
        } else {
          this.inflight.add(chan.cman.chan);
        }

        const ret = [...localMap.values()].map((item) => {
          const ret2: CmanUI = { cman: item, icon: this.chan_icon(item) };
          return ret2;
        });
          
        const ret_sorted: CmanUI[] = ret.sort( (a,b) => a.cman.chan - b.cman.chan );
        this.localCman$.next(ret_sorted);
      })
    ).subscribe();
    
    this.cman$.subscribe( data => {
          this.inflight.clear();
    });

    this.clickSubject$.pipe(
      filter( item => item!=null ),
      tap( item => { if (item) this.inflight.add(item.cman.chan) } ),
      bufferTime(5000),  // Adjust time as needed
      // Ensure non-empty batches
      filter(batch => batch.length > 0),
        withLatestFrom(this.cman$),
    ).subscribe(([clickBatch, latestCmanData]) => {

      if ( clickBatch.some( el => el === null ) )
        return;

      // Process each click in the batch with the latest cmanData
      console.log("************ OFF WE GO *************");

      const activeChans = new Set<number>();

      // Add active chans from the first array
      latestCmanData.forEach(({ chan, active }) => {
        if (active) 
          activeChans.add(chan);
      });

      // Add or remove based on the inverse active state from the second array
      clickBatch.forEach((item) => {
        if (!item)
          return;
        if (!item.cman.active) 
          activeChans.add(item.cman.chan);  // Invert logic: add if originally false
        else 
          activeChans.delete(item.cman.chan);       // Active in 2nd array means not adding/deleting from set
      });

      const chanArray = Array.from(activeChans).map(chan => ({ chan:chan }));

      console.log("Update with:");
      console.log(chanArray);

      this.beaconService.postChanPlan(chanArray).subscribe( (result) => {
        this.clickSubject$.next(null);
      });

    });

  }
  
  chan_icon(chan: CmanData){
    if (this.inflight.has(chan.chan))
      return "bi-arrow-clockwise";
    else if (chan.active)
      return "bi-wifi";
    else
      return null;
  }


  channelToFrequency(channel: number): number | null {
    // Basic lookup table for common 5 GHz channels to frequency in MHz
    // This table does not cover all channels, especially those with DFS (Dynamic Frequency Selection)
    const fiveGHzLookup: { [key: number]: number } = {
      36: 5180,
      40: 5200,
      44: 5220,
      48: 5240,
      52: 5260,
      56: 5280,
      60: 5300,
      64: 5320,
      100: 5500,
      104: 5520,
      108: 5540,
      112: 5560,
      116: 5580,
      120: 5600,
      124: 5620,
      128: 5640,
      132: 5660,
      136: 5680,
      140: 5700,
      144: 5720,
      149: 5745,
      153: 5765,
      157: 5785,
      161: 5805,
      165: 5825,
    };

    if (channel >= 1 && channel <= 14) {
      // 2.4 GHz Band
      return 2407 + channel * 5;
    } else if (fiveGHzLookup[channel]) {
      // 5 GHz Band lookup
      return fiveGHzLookup[channel];
    } else {
      // Channel not found
      return null;
    }
  }

  chanToFreq(channel: any): number | null {
    // Check if the channel is within the 2.4 GHz band range
    channel = Number(channel);
    return this.channelToFrequency(channel);
  }

  getColorForTime(value: number, min: number = 0, max: number = 60): string {
    const halfway = (max - min) / 2;
    let red = 0;
    let green = 0;

    if (value <= halfway) {
      // From green to yellow
      // Linearly scale red up and keep green at max
      red = (255 * value) / halfway; // Scale red from 0 to 255 as value goes from min to halfway
      green = 255; // Keep green constant for the green to yellow transition
    } else {
      // From yellow to red
      // Linearly scale green down, keep red at max
      red = 255; // Keep red constant for the yellow to red transition
      green = 255 * (1 - (value - halfway) / halfway); // Scale green from 255 to 0 as value goes from halfway to max
    }
    return `rgb(${Math.round(red)}, ${Math.round(green)}, 0)`;
  }

  submitAddChannel(){
    const data = Number(this.newChanValue);
    if ( !this.chanToFreq(data) )
      {
        this.newChanValue = "";
        console.error("Bad channel: ", data);
        return;
      }
    this.inflight.add(data);
    console.log("Submit... ", data);
    this.beaconService.addChan(Number(data)).subscribe( res => console.log(res) );
    this.newChanValue = "";
  }

}
