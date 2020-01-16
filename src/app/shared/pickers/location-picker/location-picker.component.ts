import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ModalController, ActionSheetController, AlertController } from '@ionic/angular';
import { MapModalComponent } from '../../map-modal/map-modal.component';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { map, switchMap } from 'rxjs/operators';
import { PlaceLocation, Coordinates } from 'src/app/places/location.model';
import { of } from 'rxjs';
import { Plugins, Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-location-picker',
  templateUrl: './location-picker.component.html',
  styleUrls: ['./location-picker.component.scss'],
})
export class LocationPickerComponent implements OnInit {

  private apiKey = environment.googleMapsApiKey;

  @Output() locationPick = new EventEmitter<PlaceLocation>();
  @Input() showPreview = false;
  selectedLocationImage: string;
  isLoading = false;

  constructor(
    private modalController: ModalController,
    private httpClient: HttpClient,
    private actionSheetController: ActionSheetController,
    private alertController: AlertController) { }

  ngOnInit() {}

  onPickLocation() {
    this.actionSheetController.create({
      header: 'Please Choose',
      buttons:[
        {
          text: 'Auto Locate',
          handler: () => {
            this.locateUser();
          }
        },
        {
          text: 'Pick on map',
          handler: () => {
            this.openMap();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        },
      ]
    }).then(actionSheet => {
      actionSheet.present();
    });
  }

  private locateUser() {
    this.isLoading = true;
    if (!Capacitor.isPluginAvailable('Geolocation')) {
      this.isLoading = false;
      this.showErrorAlert();
      return;
    }
    Plugins.Geolocation.getCurrentPosition().then(geoPosition => {
      const coordinates: Coordinates = {lat: geoPosition.coords.latitude, lng: geoPosition.coords.longitude};
      this.createPlace(coordinates.lat, coordinates.lng);
      this.isLoading = false;
    }).catch(err => {
      this.isLoading = false;
      console.log(err);
      this.showErrorAlert();
    });
  }
  private showErrorAlert() {
    this.alertController.create({
      header: 'Could not fetch Location',
      message: 'Please use ther map to pick a location',
      buttons: ['Okay']
    }).then(alertElement => {
      alertElement.present();
    });
  }

  private openMap() {
    this.modalController.create({component: MapModalComponent}).then(mapModal => {
      mapModal.onDidDismiss().then(modalData => {
        if (!modalData.data) {
          return;
        }
        this.createPlace(modalData.data.lat, modalData.data.lng)
      });
      mapModal.present();
    });
  }

  private createPlace(lat: number, lng: number) {
    const pickedLocation: PlaceLocation = {
      lat,
      lng,
      address: null,
      staticMapImageUrl: null
    };
    this.isLoading = true;
    this.getAddress(pickedLocation.lat, pickedLocation.lng)
      .pipe(
        switchMap(address => {
          pickedLocation.address = address;
          pickedLocation.address = address;
          return of(this.getMapImage(pickedLocation.lat, pickedLocation.lng, 14));
        })
      ).subscribe(staticMapImageUrl => {
        pickedLocation.staticMapImageUrl = staticMapImageUrl;
        this.selectedLocationImage = staticMapImageUrl;
        this.isLoading = false;
        this.locationPick.emit(pickedLocation);
      });
  }

  private getAddress(lat: number, lng: number) {
    return this.httpClient.get<any>(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`)
      .pipe(
        map(geoData => {
          if (!geoData || !geoData.results || geoData.results.length === 0) {
            return null;
          }
          return geoData.results[0].formatted_address;
        })
      );
  }

  private getMapImage(lat: number, lng: number, zoom: number) {
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${lng}&size=500x300&maptype=roadmap
    &markers=color:red%7Clabel:Place%7C${lat},${lng}
    &key=${this.apiKey}`;
  }

}
