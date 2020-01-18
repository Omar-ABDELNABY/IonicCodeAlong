### How to get the application running

- In \src\environments directory create environment.ts file, and copy the content of environment.prod.ts into it, then fill the "googleMapsApiKey" & "googleWebApiKey" with their values

- From [firebase settings](https://console.firebase.google.com/project/ionic-angular-course-omar/settings/serviceaccounts/adminsdk) click on "Generate new private key" button, and store the file in \functions directory with name "ionic-angular.json"

- install firebase-tools "npm i -g firebase-tools", if you need to mogify the cloud functions (used for image upload)

