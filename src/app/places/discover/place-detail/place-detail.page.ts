import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NavController, ModalController, ActionSheetController, LoadingController, AlertController } from '@ionic/angular';
import { CreateBookingComponent } from '../../../bookings/create-booking/create-booking.component';
import { Place } from '../../place.model';
import { PlacesService } from '../../places.service';
import { Subscription } from 'rxjs';
import { BookingService } from 'src/app/bookings/booking.service';
import { AuthService } from 'src/app/auth/auth.service';
import { MapModalComponent } from 'src/app/shared/map-modal/map-modal.component';

@Component({
  selector: 'app-place-detail',
  templateUrl: './place-detail.page.html',
  styleUrls: ['./place-detail.page.scss'],
})
export class PlaceDetailPage implements OnInit, OnDestroy {

  private placesSubscription: Subscription;

  isBookable = false;
  place: Place;
  isLoading = false;

  constructor(
    private router: Router,
    private navController: NavController,
    private modalController: ModalController,
    private activatedRoute: ActivatedRoute,
    private actionSheetController: ActionSheetController,
    private placeService: PlacesService,
    private bookingService: BookingService,
    private loadingController: LoadingController,
    private authService: AuthService,
    private alertController: AlertController) { }

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe(paramMap => {
      if (!paramMap.has('placeId')) {
        this.navController.navigateBack('/places/tabs/discover');
        return;
      }
      this.isLoading = true;
      this.placesSubscription = this.placeService.getPlace(paramMap.get('placeId')).subscribe(place => {
        this.place = place;
        this.isBookable = this.place.userId !== this.authService.userId;
        this.isLoading = false;
      }, error => {
        this.alertController.create({
          header: 'An error occured!',
          message: 'Place could not be fetched, please try again later!',
          buttons: [{text: 'Okay', handler: () => {
            this.router.navigate(['places/tabs/discover']);
          }}]
        }).then((alertElement) => {
          alertElement.present();
        });
      });
    });
  }

  ngOnDestroy(): void {
    if (this.placesSubscription) {
      this.placesSubscription.unsubscribe();
    }
  }

  onBookPlace() {
    // this.router.navigateByUrl('/places/tabs/discover');
    // this.navController.navigateBack('/places/tabs/discover');

    this.actionSheetController.create({
      header: 'Choose an action',
      buttons: [
        {
          text: 'Select Date',
          handler: () => {
            this.openBookingModal('select');
          }
        },
        {
          text: 'Random Date',
          handler: () => {
            this.openBookingModal('random');
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        },
      ],
    }).then(actionSheetElement => {
      actionSheetElement.present();
    });
  }

  openBookingModal(mode: 'select' | 'random') {
    this.modalController
    .create({
      component: CreateBookingComponent,
      componentProps: {
        selectedPlace: this.place,
        selectedMode: mode,
      },
      id: `bookPlace_${this.place.id}`
    })
    .then(modalElement => {
      modalElement.present();
      return modalElement.onDidDismiss();
    })
    .then(resultData => {
      console.log(resultData.data, resultData.role);
      if (resultData.role === 'confirm') {
        this.loadingController.create({message: 'Booking place...'})
        .then(loadingElement => {
          loadingElement.present();
          const data = resultData.data.bookingData;
          this.bookingService.addBooking(
          this.place.id,
          this.place.title,
          this.place.imageUrl,
          data.firstName,
          data.lastName,
          data.guestnumber,
          data.startDate,
          data.endDate
        ).subscribe(() => {
          loadingElement.dismiss();
        });
        });
      }
    });
  }

  onShowFullMap() {
    this.modalController.create({
      component: MapModalComponent,
      componentProps: {
        center: {lat: this.place.location.lat, lng: this.place.location.lng},
        selectable: false,
        closeButtonText: 'Close',
        title: this.place.location.address
      }
    }).then(modalElement => {
      modalElement.present();
    });
  }

}
