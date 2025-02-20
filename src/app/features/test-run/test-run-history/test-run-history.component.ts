import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/authservice.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../../core/services/data-service';
import * as appConstants from 'src/app/app.constants';
import { Subscription } from 'rxjs';
import { SbiProjectModel } from 'src/app/core/models/sbi-project';
import { MatDialog } from '@angular/material/dialog';
import { BreadcrumbService } from 'xng-breadcrumb';
import { MatTableDataSource } from '@angular/material/table';
import Utils from 'src/app/app.utils';
import { TestRunHistoryModel } from 'src/app/core/models/testrunhistory';
import { SdkProjectModel } from 'src/app/core/models/sdk-project';
import { TranslateService } from '@ngx-translate/core';
import { UserProfileService } from 'src/app/core/services/user-profile.service';
import { AbisProjectModel } from 'src/app/core/models/abis-project';
import { error } from 'console';

@Component({
  selector: 'app-test-run-history',
  templateUrl: './test-run-history.component.html',
  styleUrls: ['./test-run-history.component.css'],
})
export class TestRunHistoryComponent implements OnInit {
  collectionId: string;
  collectionName: string;
  projectId: string;
  projectType: string;
  subscriptions: Subscription[] = [];
  dataLoaded = false;
  sbiProjectData: SbiProjectModel;
  sdkProjectData: SdkProjectModel;
  abisProjectData: AbisProjectModel;
  dataSource: MatTableDataSource<TestRunHistoryModel>;
  textDirection: any = this.userProfileService.getTextDirection();
  buttonPosition: any = this.textDirection == 'rtl' ? {'float': 'left'} : {'float': 'right'};
  displayedColumns: string[] = [
    'lastRunTime',
    'runStatus',
    'testCaseCount',
    'passCaseCount',
    'failCaseCount',
    'actions',
    'scrollIcon'
  ];
  // MatPaginator Inputs
  totalItems = 0;
  defaultPageSize = 10;
  pageSize = this.defaultPageSize;
  pageIndex = 0;
  pageSizeOptions: number[] = [5, 10, 15, 20];
  dataSubmitted = false;
  resourceBundleJson: any = {};

  constructor(
    public authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private breadcrumbService: BreadcrumbService,
    private dataService: DataService,
    private dialog: MatDialog,
    private router: Router,
    private translate: TranslateService,
    private userProfileService: UserProfileService
  ) {}

  async ngOnInit() {
    this.translate.use(this.userProfileService.getUserPreferredLanguage());
    this.resourceBundleJson = await Utils.getResourceBundle(this.userProfileService.getUserPreferredLanguage(), this.dataService);
    await this.initAllParams();
    await this.getCollection();
    if (this.projectType == appConstants.SBI) {
      await this.getSbiProjectDetails();
      this.initBreadCrumb();
    }
    if (this.projectType == appConstants.SDK) {
      await this.getSdkProjectDetails();
      this.initBreadCrumb();
    }
    if (this.projectType == appConstants.ABIS) {
      await this.getAbisProjectDetails();
      this.initBreadCrumb();
    }
    await this.getTestRunHistory();
    this.dataLoaded = true;
  }

  initBreadCrumb() {
    const breadcrumbLabels = this.resourceBundleJson['breadcrumb'];
    if (breadcrumbLabels) {
      this.breadcrumbService.set('@homeBreadCrumb', `${breadcrumbLabels.home}`);
      if (this.sbiProjectData) {
        this.breadcrumbService.set(
          '@projectBreadCrumb',
          `${this.projectType} ${breadcrumbLabels.project} - ${this.sbiProjectData.name}`
        );
      }
      if (this.sdkProjectData) {
        this.breadcrumbService.set(
          '@projectBreadCrumb',
          `${this.projectType} ${breadcrumbLabels.project} - ${this.sdkProjectData.name}`
        );
      }
      if (this.abisProjectData) {
        this.breadcrumbService.set(
          '@projectBreadCrumb',
          `${this.projectType} ${breadcrumbLabels.project} - ${this.abisProjectData.name}`
        );
      }
      this.breadcrumbService.set(
        '@collectionBreadCrumb',
        `${this.collectionName}`
      );
      this.breadcrumbService.set('@testrunBreadCrumb', `${breadcrumbLabels.testRunHistory}`);
    }
  }

  initAllParams() {
    return new Promise((resolve) => {
      this.activatedRoute.params.subscribe((param) => {
        this.projectId = param['projectId'];
        this.projectType = param['projectType'];
        this.collectionId = param['collectionId'];
      });
      resolve(true);
    });
  }

  async getCollection() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getCollection(this.collectionId).subscribe(
          (response: any) => {
            this.collectionName = response['response']['name'];
            resolve(true);
          },
          (errors) => {
            Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
            resolve(false);
          }
        )
      );
    });
  }

  async getTestRunStatus(runId: string) {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getTestRunStatus(runId).subscribe(
          (response: any) => {
            resolve(response['response']['resultStatus']);
          },
          (errors) => {
            Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
            resolve(false);
          }
        )
      );
    });
  }

  async getSbiProjectDetails() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getSbiProject(this.projectId).subscribe(
          (response: any) => {
            console.log(response);
            this.sbiProjectData = response['response'];
            console.log(this.sbiProjectData);
            resolve(true);
          },
          (errors) => {
            Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
            resolve(false);
          }
        )
      );
    });
  }

  async getSdkProjectDetails() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getSdkProject(this.projectId).subscribe(
          (response: any) => {
            //console.log(response);
            this.sdkProjectData = response['response'];
            resolve(true);
          },
          (errors) => {
            Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
            resolve(false);
          }
        )
      );
    });
  }

  async getAbisProjectDetails() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getAbisProject(this.projectId).subscribe(
          (response: any) => {
            //console.log(response);
            this.abisProjectData = response['response'];
            resolve(true);
          },
          (errors) => {
            Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
            resolve(false);
          }
        )
      );
    });
  }
  
  async getTestRunHistory() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService
          .getTestRunHistory(this.collectionId, this.pageIndex, this.pageSize)
          .subscribe(
            (response: any) => {
              console.log(response);
              this.populateTableData(response)
                .then(() => {
                  resolve(true);
                })
                .catch((error) => {
                  reject(error);
                });
            },
            (errors) => {
              Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
              resolve(false);
            }
          )
      );
    });
  }
  async backToProject() {
    await this.router.navigate([
      `toolkit/project/${this.projectType}/${this.projectId}`,
    ]);
  }

  async populateTableData(response: any) {
    if (response && response['errors'] && response['errors'].length != 0) {
      if (this.dataSource && this.dataSource.data) {
        this.dataSource.data = [];
      }
    }
    if (response && response['errors'] && response['errors'].length == 0) {
      if (this.dataSource && this.dataSource.data) {
        this.dataSource.data = [];
      }
      const resp = response['response'];
      let dataArr = resp['content'];
      this.totalItems = parseInt(resp['totalElements']);
      this.pageIndex = parseInt(resp['pageNo']);
      this.pageSize = parseInt(resp['pageSize']);
      console.log(`this.totalItems: ${this.totalItems}`);
      console.log(`this.pageIndex: ${this.pageIndex}`);
      console.log(`this.pageSize: ${this.pageSize}`);
      if (dataArr && dataArr.length > 0) {
        dataArr.sort(function (a: TestRunHistoryModel, b: TestRunHistoryModel) {
          if (a.lastRunTime < b.lastRunTime) return 1;
          if (a.lastRunTime > b.lastRunTime) return -1;
          return 0;
        });
      }
      let tableData = [];
      for (let row of dataArr) {
        let runStatus = await this.getTestRunStatus(row.runId);
        tableData.push({
          ...row,
          runStatus: runStatus,
        });
      }
      this.dataSource = new MatTableDataSource(tableData);
    }
  }

  async showResults(pageEvent: any) {
    this.dataLoaded = false;
    if (pageEvent) {
      this.pageSize = pageEvent.pageSize;
      this.pageIndex = pageEvent.pageIndex;
    }
    await this.getTestRunHistory();
    this.dataLoaded = true;
  }

  async viewTestRun(row: any) {
    await this.router.navigate([
      `toolkit/project/${this.projectType}/${this.projectId}/collection/${this.collectionId}/testrun/${row.runId}`,
    ]);
  }

  deleteTestRun(row: any) {
    this.dataLoaded = false;
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.deleteTestRun(row.runId).subscribe(
          (response: any) => {
            this.dataLoaded = true;
            console.log(response);
            this.getTestRunHistory()
              .then(() => {
                this.dataLoaded = true;
              })
              .catch((error) => {
                reject(error);
              });
          },
          (errors) => {
            this.dataLoaded = true;
            Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
          }
        )
      );
    });
  }
}
