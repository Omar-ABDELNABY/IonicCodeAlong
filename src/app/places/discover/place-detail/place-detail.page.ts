import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NavController, ModalController, ActionSheetController, LoadingController } from '@ionic/angular';
import { CreateBookingComponent } from '../../../bookings/create-booking/create-booking.component';
import { Place } from '../../place.model';
import { PlacesService } from '../../places.service';
import { Subscription } from 'rxjs';
import { BookingService } from 'src/app/bookings/booking.service';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-place-detail',
  templateUrl: './place-detail.page.html',
  styleUrls: ['./place-detail.page.scss'],
})
export class PlaceDetailPage implements OnInit, OnDestroy {

  private placesSubscription: Subscription;

  isBookable = false;
  place: Place;

  constructor(
    private router: Router,
    private navController: NavController,
    private modalController: ModalController,
    private activatedRoute: ActivatedRoute,
    private actionSheetController: ActionSheetController,
    private placeService: PlacesService,
    private bookingService: BookingService,
    private loadingController: LoadingController,
    private authService: AuthService) { }

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe(paramMap => {
      if (!paramMap.has('placeId')) {
        this.navController.navigateBack('/places/tabs/discover');
        return;
      }
      this.placesSubscription = this.placeService.getPlace(paramMap.get('placeId')).subscribe(place => {
        this.place = place;
        this.isBookable = this.place.userId !== this.authService.userId;
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

}
