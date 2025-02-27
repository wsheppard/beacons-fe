import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Route, Event, Router, RouterEvent, RouterOutlet } from '@angular/router';
import { BeaconServiceService } from './beacon-service.service';
import { BeaconComponentComponent } from './beacon-component/beacon-component.component';
import { CommonModule } from '@angular/common';
import {ChannelBarComponent} from './channel-bar/channel-bar.component';
import {NgxJsonViewerComponent, NgxJsonViewerModule} from 'ngx-json-viewer';
import { Beacon } from '../../interfaces';
import {BehaviorSubject, Observable, Subscription, combineLatest, of} from 'rxjs';
import { filter, map, startWith, tap } from 'rxjs/operators';
import {GroupService} from './local-service';
import {BeaconGroupComponent} from './beacon-group/beacon-group.component';
import {FormsModule} from '@angular/forms';


@Component({
  selector: 'app-root',
  standalone: true,

  imports: [
    NgxJsonViewerModule,
    RouterOutlet,
    FormsModule,
    ChannelBarComponent,
    BeaconComponentComponent,
    BeaconGroupComponent,
    CommonModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'beacons';
  isModalOpen: boolean = true;
  beaconsMark$ = new BehaviorSubject<Set<string>>(new Set<string>());
  beaconsSSID$ = new BehaviorSubject<Set<string>>(new Set<string>());
  private beacons$: Observable<Beacon[]>;

  filteredBeacons$ = new BehaviorSubject<Beacon[]>([]);
  filteredBeaconsCount: number = 0;
  groupsCount: number = 0;

  groupedBeacons$ = new BehaviorSubject<{ [group: string]: Beacon[] }>({});
  groups$: Observable<Record<string, string[]>>;

  newGrpValue: string = "";

  constructor(
    private beaconService: BeaconServiceService,
    private activeRoute: ActivatedRoute,
    private router: Router,
    private groupService: GroupService
  ) {

    /* APP ENTRY POINT ! */

    this.groups$ = this.groupService.groups$;

    this.beacons$ = this.beaconService.beaconData$;
    router.events
      .pipe(
        filter(
          (e: Event | RouterEvent): e is RouterEvent => e instanceof RouterEvent
        )
      )
      .subscribe((e: RouterEvent) => {
        if (e instanceof NavigationEnd) {
          console.log('Router Event End');
          /* WHY? Well, because there's a spurious router event at the 
           * start of day which suggests there are NO qps when there are */
          this.beaconsMark$.subscribe(() => this.updateQP());

          /* For same reason, setup the QP sub here */
          this.activeRoute.queryParams.subscribe((params) => {
            console.log('Query Params FIRES');
            console.log(params);

            if (!params) return;

            if ('chans' in params) 
              this.beaconService.updateChanPlan(params['chans']);

            if ('filter' in params) 
              this.doFilter(params['filter']);

            if ('ssid' in params) 
              this.doFilterSSID(params['ssid']);
          });
        }
      });

      this.filteredBeacons$.subscribe(beacons => {
        this.filteredBeaconsCount = beacons.length;
        //console.log( "Filtered: ", beacons.length );
      });

      // Observable stream of filtered (marked) beacons
      // Remember, we combineLatest because we want to trigger this 
      // on ANY of the streams updating
      combineLatest([
        this.beacons$,
        this.beaconsMark$,
        this.beaconsSSID$
      ]).pipe( 
      map(([beacons, marks, ssids]) => {
        const ret = beacons.filter((beacon) => {
          return marks.has(beacon.bssid) || ssids.has(beacon.ssid);
        })
        this.filteredBeacons$.next( ret || [] );
      })).subscribe()

      // Observable stream of grouped beacons
      combineLatest([this.beacons$, this.groups$]).pipe(
        map(([beacons, groups]) => {

          const groupedBeacons: { [group: string]: Beacon[] } = {};

          Object.keys(groups).forEach(group => {
            groupedBeacons[group] = beacons.filter(beacon => { 
              return groups[group].includes(beacon.bssid);
            });
          });

          console.log("Groups: ", groupedBeacons);
          this.groupedBeacons$.next(groupedBeacons);

        })).subscribe();

  }


  submitAddGrp() {
    this.groupService.addGroup(this.newGrpValue);  
  }

  // Observable stream of the remaining beacons
  get remainingBeacons$(): Observable<Beacon[]> {
    return combineLatest([
      this.beacons$,
      this.beaconsMark$,
      this.beaconsSSID$
    ]).pipe(
      map(([beacons, marks, ssids]) =>
        beacons.filter((beacon) => {
          return !marks.has(beacon.bssid) && !ssids.has(beacon.ssid);
        })
      )
    );
  }

  // Methods to mark/unmark beacons, updating 'beaconsMark$'
  markBeacon(bssid: string) {
    const currentMarks = new Set(this.beaconsMark$.value);
    currentMarks.add(bssid);
    this.beaconsMark$.next(currentMarks);
  }

  unmarkBeacon(bssid: string) {
    const currentMarks = new Set(this.beaconsMark$.value);
    currentMarks.delete(bssid);
    this.beaconsMark$.next(currentMarks);
  }

  toggleModal(state: boolean) {
    this.isModalOpen = state;
  }
  
  doFilterSSID(ssidqp: string) {
    const aps = ssidqp.split(',');
    let marks = new Set<string>();
    aps.forEach((item) => marks.add(item));
    console.log(marks);
    this.beaconsSSID$.next(marks);
  }

  /* Unpack the BSSID filter from QP into the 
   * local filter */
  doFilter(bssidqp: string) {
    const aps = bssidqp.split(',');
    let marks = new Set<string>();

    aps.forEach((item) => marks.add(item));

    console.log("Set BeaconsMark");
    this.beaconsMark$.next(marks);
  }

  /* Update the URL to include the updated marks */
  updateQP() {
    const currentMarks = new Set(this.beaconsMark$.value);
    // Fetch current query params
    const currentQueryParams = this.activeRoute.snapshot.queryParams;
    const newFilter = { filter: [...currentMarks].join(',') || null };

    console.log('NAVIGATE!');
    console.log(currentQueryParams);

    // Navigate, merging new params alongside existing ones
    this.router.navigate([], {
      queryParams: newFilter, // Spread in new params
      queryParamsHandling: 'merge', // Merge strategy
      relativeTo: this.activeRoute, // Stay on the current route
    });
  }

  ngOnInit(): void {
  }

  beaconClick( beacon: Beacon ) {
    console.log(beacon);
  }

}
