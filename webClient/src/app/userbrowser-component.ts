import {
  Component,
  ViewChild,
  ElementRef,
  OnInit,
  AfterViewInit,
  Inject,
  SimpleChange
} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Http, Response } from '@angular/http';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';

import {
  Angular2InjectionTokens,
  Angular2PluginWindowActions,
  Angular2PluginWindowEvents
} from 'pluginlib/inject-resources';

@Component({
  selector: 'userbrowser',
  templateUrl: 'userbrowser-component.html',
  styleUrls: ['userbrowser-component.css']
})
export class UserBrowserComponent implements OnInit, AfterViewInit {
  private simpleText: string;
  private resultNotReady: boolean = false;
  private showGrid: boolean = false;
  private columnMetaData: any = null;
  private unfilteredRows: any = null;
  private rows: any = null;
  private selectedRows: any[];
  private query: string;
  private error_msg: any;
  private url: string;
  private filter: any;
  @ViewChild('grid') grid; //above the constructor

  constructor(
    private element: ElementRef,
    private http: Http,
    @Inject(Angular2InjectionTokens.LOGGER) private log: ZLUX.ComponentLogger,
    @Inject(Angular2InjectionTokens.PLUGIN_DEFINITION)
    private pluginDefinition: ZLUX.ContainerPluginDefinition,
    @Inject(Angular2InjectionTokens.WINDOW_ACTIONS)
    private windowAction: Angular2PluginWindowActions,
    @Inject(Angular2InjectionTokens.WINDOW_EVENTS)
    private windowEvents: Angular2PluginWindowEvents
  ) {
    this.log.info(`User Browser constructor called`);
  }

  ngOnInit(): void {
    this.resultNotReady = true;
    this.log.info(
      `Calling own dataservice to get user listing for filter=${JSON.stringify(
        this.filter
      )}`
    );
    let uri = this.filter
      ? ZoweZLUX.uriBroker.pluginRESTUri(
          this.pluginDefinition.getBasePlugin(),
          'table',
          `${this.filter.type}/${this.filter.value}`
        )
      : ZoweZLUX.uriBroker.pluginRESTUri(
          this.pluginDefinition.getBasePlugin(),
          'table',
          null
        );
    setTimeout(() => {
      this.log.info(`Sending GET request to ${uri}`);
      this.http
        .get(uri)
        .map(res => res.json())
        .subscribe(
          data => {
            this.log.info(`Successful GET, data=${JSON.stringify(data)}`);
            this.columnMetaData = data.metadata;
            this.unfilteredRows = data.rows.map(x => Object.assign({}, x));
            this.rows = this.unfilteredRows;
            this.showGrid = true;
            this.resultNotReady = false;
          },
          error => {
            this.log.warn(`Error from GET. error=${error}`);
            this.error_msg = error;
            this.resultNotReady = false;
          }
        );
    }, 100);
  }

  ngAfterViewInit(): void {
    // the flex table div is not on the dom at this point
    // have to calculate the height for the table by subtracting all
    // the height of all fixed items from their container
    let fixedElems = this.element.nativeElement.querySelectorAll(
      'div.include-in-calculation'
    );
    let height = 0;
    fixedElems.forEach(function(elem, i) {
      height += elem.clientHeight;
    });
    this.windowEvents.resized.subscribe(() => {
      if (this.grid) {
        this.grid.updateRowsPerPage();
      }
    });
  }

  onTableSelectionChange(rows: any[]): void {
    this.selectedRows = rows;
  }
}
