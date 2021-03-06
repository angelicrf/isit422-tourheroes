import { Component, OnInit } from '@angular/core';
import { FilterService } from '../filter.service';
import {CdkDragDrop, moveItemInArray, transferArrayItem, CdkDrag} from '@angular/cdk/drag-drop';
import { GdCloudService } from '../gd-cloud.service';
import { DpCloudService } from '../dp-cloud.service';
import {buildFileListByFilter} from '../filetransfer/filterByFileType.js';
let clFile: string[];
let showData: string;

@Component({
  selector: 'app-filetransfer',
  templateUrl: './filetransfer.component.html',
  styleUrls: ['./filetransfer.component.css']
})
export class FiletransferComponent implements OnInit {

  leftServiceForm = false;
  rightServiceForm = false;
  
  serviceIcons = [
    "assets/images/dropbox.png",
    "assets/images/googledrive.png",
    "assets/images/onedrive.png",
    "assets/images/box.png",
    "assets/images/folder.png"
  ];

  serviceNames = [
    "Dropbox",
    "Google Drive",
    "OneDrive",
    "Box",
    "Local Files"
  ]

  serviceAccounts = [
    localStorage.getItem('dpEmail'),
    localStorage.getItem('gdUserEmail'),
    "(No account associated)",
    "(No account associated)",
    localStorage.getItem('localFilePath')
  ]

  service1 = 0;
  service2 = 1;

  folders: string[] = []

  files1: string[] = [];
  files1Data: Buffer[] = [];
  
  files2: string[]= [];
  files2Data: Buffer[] = [];

  filters: string[];
  acces_Token: any;

  constructor(public filterService: FilterService,
    private gdService: GdCloudService, 
    private dpService: DpCloudService) {
      showData = this.dpService.getCodefromUri();
    }

  ngOnInit(){
     this.getFilters();
     this.serviceAccounts[0] = localStorage.getItem('dpEmail')
  }

  async getLocalFiles(side) {
    let filePath = this.serviceAccounts[4];
    const files = await fetch('/api/Files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        path: filePath
      })
    })
    .then(response => response.json())
    .then(data => {
      if(side === 'left') {
        data.names.forEach((name) => {
          if(this.service1 === 4) {
            this.files1.push(name);
          }
        });
        data.files.forEach((file) => {
          if(this.service1 === 4) {
            this.files1Data.push(file);
          }
        });
      }
      else if(side === 'right') {
        data.names.forEach((name) => {
          if(this.service2 === 4) {
            this.files2.push(name);
          }
        });
        data.files.forEach((file) => {
          if(this.service2 === 4) {
            this.files2Data.push(file);
          }
        });
      }
      console.log(data)
    })
    .catch(err => console.log(err))
  }

  filterList(fil: string[], srv: number): string {
    let fList = "";
    let cnt = 0;
    fil.forEach((value, index) => {
      if(value.includes(this.serviceNames[srv])) {
        if(cnt != 0) {
          fList += ", " + value.substr(0, value.indexOf(" "));
        }
        else
          fList += value.substr(0, value.indexOf(" "));
        cnt++;
      }
    })

    return fList;
  }

  async addLocalFiles(fileName: string, fileData: Buffer) {
    let filePath = this.serviceAccounts[4];
    const files = await fetch('/api/AddFiles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        filePath: filePath,
        fileName: fileName,
        fileData: fileData
      })
    })
    .then(response => response.json())
    .catch(err => console.log(err))
  }

  async deleteLocalFiles(fileName: string, fileData: Buffer) {
    let filePath = this.serviceAccounts[4];
    const files = await fetch('/api/DeleteFiles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        filePath: filePath,
        fileName: fileName,
        fileData: fileData
      })
    })
    .then(response => response.json())
    .catch(err => console.log(err))
  }

  getFilters(): void {
    this.filters = this.filterService.getFilters();
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
                        event.container.data,
                        event.previousIndex,
                        event.currentIndex);
      
      let itemName = event.container.data[event.currentIndex];
      // if coming from left container
      if(event.previousContainer.id === "left") {
        // if left container is set to local files
        if(this.service1 === 4) {
          this.deleteLocalFiles(itemName, null);
        }
      }
      // if going to left container
      if(event.container.id === 'left') {
        // if left container is set to Google Drive
        if(this.service1 === 1) {
          this.addGDFile();
        }
        // if left container is set to local files
        if(this.service1 === 4) {
          // TODO: change to actual file, currently a placeholder
          this.addLocalFiles('left.txt', this.files2Data[0])
        }
      }
      // if coming from right container
      if(event.previousContainer.id === "right") {
        // if right container is set to local files
        if(this.service2 === 4) {
          this.deleteLocalFiles(itemName, null);
        }
      }
      // if going to right container
      if(event.container.id === 'right') {
        // if right container is set to Google Drive
        if(this.service2 === 1) {
          this.addGDFile();
        }
        // if right container is set to local files
        if(this.service2 === 4) {
          // TODO: change to actual file, currently a placeholder
          this.addLocalFiles('right.txt', this.files1Data[0])
        }
      }
    }
  }

  /** Predicate function that only allows filtered types to be dropped into a list */
  filterPredicate(item: CdkDrag<String>) {
    return item.data === "";
  }

  /** Predicate function that doesn't allow items to be dropped into a list. */
  noReturnPredicate() {
    return false;
  }

  async getFiles() {
    this.leftServiceForm = false
    return await new Promise((resolve,reject) => {
      return gapi.client
      .request({
        method: 'GET',
        path:
          'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
      })
      .then(async () => {
        let displayItems:any = await this.gdService.listGoogleDriveFiles();   
          
        return resolve(displayItems);
      })
    }) 
  }

  async displayClientFiles(){
       let holdClientFilesToDisplay = await this.getFiles()
       console.log("displayClientFiles " + holdClientFilesToDisplay);
       let keys = Object.keys(holdClientFilesToDisplay);
       for(let i = 0; i < keys.length; i++){
            this.files1.push((holdClientFilesToDisplay[i]));
      };
       return this.files1
  }
 async dpProcessFiles(){
  let displayResult:any = await this.dpService.sendMessageToNode(showData)
  this.dpService.dpGetClientInfo(displayResult)
 
  let retreiveDpFiles:any = await this.dpService.dpGetFilesList(displayResult)
  
  let filterName = this.filterList(this.filters, 0);
  //console.log("the value of filters is " + filterName)
  
  let keys = Object.keys(retreiveDpFiles);
  let holdArrayRetrieved = []
  
  for(let i = 0; i < keys.length; i++){
    holdArrayRetrieved.push(retreiveDpFiles[i])
  }
  let newFilteredFiles = buildFileListByFilter(filterName, holdArrayRetrieved )
  //console.log("newFilteredFiles " + newFilteredFiles)

   for(let i = 0; i < newFilteredFiles.length; i++){
      this.files1.push((newFilteredFiles[i])); 
   };
   let intersection: string[] = holdArrayRetrieved.filter(
     element => !newFilteredFiles.includes(element)  
      );
      console.log("intersection " + intersection)
    for (let index = 0; index < intersection.length; index++) {
      this.folders.push(intersection[index]);   
    }
   window.history.replaceState(null, null, window.location.pathname);
 }

  // TODO: pass actual data
  // TODO: change to multi-part to be able to name file
  async addGDFile() {
    return await new Promise((resolve,reject) => {
      return gapi.client
      .request({
        method: 'POST',
        path: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=media',
        'headers': {
          'Content-Type': 'text/plain',
          'Content-Length': 337
        },
        body: 'Test'
      })
      .then(async () => {
        console.log('Added')
      })
    }) 
  }

  // TODO: get the file id to pass into request
  async removeGDFile() {
    return await new Promise((resolve,reject) => {
      return gapi.client
      .request({
        method: 'DELETE',
        path: 'https://www.googleapis.com/upload/drive/v3/files/',
      })
      .then(async () => {
        console.log('Removed')
      })
    }) 
  }
}
