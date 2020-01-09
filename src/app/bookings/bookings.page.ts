import { Component, OnInit, OnDestroy } from '@angular/core';
import { BookingService } from './booking.service';
import { Booking } from './booking.model';
import { IonItemSliding, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.page.html',
  styleUrls: ['./bookings.page.scss'],
})
export class BookingsPage implements OnInit, OnDestroy {

  private bookingsSubscription: Subscription;

  loadedBookings: Booking[];

  constructor(private bookingService: BookingService, private loadingController: LoadingController) { }

  ngOnInit() {
    this.bookingsSubscription = this.bookingService.bookings.subscribe(bookings => {
      this.loadedBookings = bookings;
    });
  }
  ngOnDestroy(): void {
    if (this.bookingsSubscription) {
      this.bookingsSubscription.unsubscribe();
    }
  }

  onCancelBooking(bookingId: string, slidingElement: IonItemSliding) {
    slidingElement.close();
    this.loadingController.create({message: 'Deleting booking...'})
      .then(loadingElement => {
        loadingElement.present();
        this.bookingService.cancelBooking(bookingId).subscribe(() => {
          loadingElement.dismiss();
        });
      });
  }

}
