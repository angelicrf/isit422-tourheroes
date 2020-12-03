import { Injectable } from '@angular/core';
import { GDClientCredentials} from './gdClientCredentials';

let holdClientEmail = []
let holdClientFiles = []
let holdClientFileId = []
let getEmailValue = false

@Injectable({
  providedIn: 'root'
})
export class GdCloudService {

  constructor(private gdkh: GDClientCredentials) {
    this.gdkh.holdDataClient = holdClientEmail;
    this.gdkh.holdFilesClient = holdClientFiles;
    console.log("gdkh.holdDataClient " + this.gdkh.holdDataClient)
   }
 
  async googleImplementCallBack(){
    
    return await new Promise((resolve,reject) => {
     gapi.load('client:auth2', () => {
      gapi.client
      .init({
        apiKey: 'AIzaSyCoO79P9OtAYVmr6PUSNqRF69PmAMwyuiA',
        discoveryDocs: [
          'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
        ],
        clientId:
          '160810936655-90na0qia4bkvqrsljk6acttn60tru758.apps.googleusercontent.com',
        scope:
          'profile email https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata',
      })
      .then(function() {
        console.log("client initialized...")
        let showClient = gapi.auth2.getAuthInstance();
        showClient.signIn({prompt: 'consent' })
        .then((googleUser: gapi.auth2.GoogleUser) => {
          let clientaccessToken = googleUser.getAuthResponse().access_token
          let clientEmail = googleUser.getBasicProfile().getEmail();
          let clientName = googleUser.getBasicProfile().getName();
          let InstantiateClient = showClient.isSignedIn.get();
          getEmailValue = true
          let mongoDbUserId = localStorage.getItem('userMnId')
          sendGdClientInfo(clientName,clientEmail,mongoDbUserId)
          holdClientEmail.push(clientEmail,clientaccessToken)
          accessTokenGoogleDrive(clientaccessToken)
          return resolve(holdClientEmail)
         })
       })
     })
   }) 
  }
  async listGoogleDriveFiles() {
    console.log('listGoogleDriveFiles called')
     return await new Promise((resolve,reject) => {
      return gapi.client.drive.files
      .list({
        fields:
          'nextPageToken, files(id, name, mimeType, modifiedTime, size, webContentLink)',
        q: "'root' in parents and trashed = false",
      })
      .then((res) => { 
        let allClientFiles:any = []
              res.result.files.forEach(fl => {
                if(fl.mimeType == "application/octet-stream"){
                  allClientFiles.push((fl.name + '.bin'));
                }else
                allClientFiles.push((fl.name + '.' + fl.fileExtension + "/" + fl.id));      
              })
              console.log('files from gd-cloud Services ' + allClientFiles)
            return resolve(allClientFiles);
          })
        .catch((err) => console.log('err from listGoogleDriveFiles ' + err))
     }) 
  }
  async gDUploadFromNode() {
    return await new Promise((resolve,reject) => {
      fetch('/api/UploadGd', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
        .then((response) => {
          console.log(response)
          return resolve(response) })
        .catch((err) => console.log(err));
    })
  }
  gDUpdateFileName() {
    fetch('/api/GDUpdateFile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
      .then((response) => {return console.log(response)})
      .catch((err) => console.log(err));
  }
  //Take care of the fileId
  async getGdId(fileId:string){
    return new Promise((resolve, reject) => {
      let myHeaders = new Headers();
          myHeaders.append('Accept', '/');
          myHeaders.append('Origin', 'x-requested-with');
          myHeaders.append('Content-Type', 'application/json');
    
          let raw = JSON.stringify({
            title: 'codefromAngular',
            gdSaveId: fileId,
          });
          let requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body:raw
          }; 
          fetch(
            '/api/GdId',
            requestOptions
          )
            .then((response) =>
              {return response.text()}
                  )//verify on this
            .then(response => {return resolve(response)})
            .catch((err) => console.log('Error from GDId ' + err))
    })
  }
 async gDDownloadFromNode() {
    return await new Promise((resolve,reject) => {
      fetch('/api/DownloadGd', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
        .then((response) => {
          console.log(response)
          return resolve(response) })
        .catch((err) => console.log(err));
    })  
  } 
}

function sendGdClientInfo(getGdName,getgdEmail,getUserMongoId){
  let gdClientValue = JSON.stringify({
    gdname: getGdName,
    gdemail: getgdEmail,
    usermongoid: getUserMongoId, 
  })
  let myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
  return fetch('/api/MCGdClient',{
    method: 'POST',
    headers: myHeaders,
    body: gdClientValue
  })
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(err => console.log(err))
}
function  accessTokenGoogleDrive(saveDg:string){
  console.log('I am in features GDAccessToken Post ' + saveDg)
  return new Promise((resolve, reject) => {
    let myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');

    let raw = JSON.stringify({
      title: 'accessTokenfromAngular',
      accessTokenDg: saveDg
    });

    let requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
    };

    fetch('/api/GDAcessToken', requestOptions)
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        console.log('the acces_token is ', result[Object.keys(result)[0]]);
        let resultAccessToken = result[Object.keys(result)[0]];
        resolve(resultAccessToken);
      })
      .catch((error) => console.log('error', error));
  });
}

