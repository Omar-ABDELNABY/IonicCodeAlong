import { Injectable } from '@angular/core';
import { Booking, BookingData } from './booking.model';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { take, delay, tap, switchMap, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({providedIn: 'root'})
export class BookingService {
    private _bookings = new BehaviorSubject<Booking[]>([]);
    private backendurl = environment.backendurl;

    constructor(
        private authService: AuthService,
        private httpClient: HttpClient,
        ) { }

    get bookings() {
        return this._bookings.asObservable();
    }

    fetchBookings() {
        return this.httpClient.get<{[key: string]: BookingData}>(
            `${this.backendurl}bookings.json?orderBy="userId"&equalTo="${this.authService.userId}"`
            )
            .pipe(
                map(bookingData => {
                    const bookings = [];
                    for (const key in bookingData) {
                        if (bookingData.hasOwnProperty(key)) {
                            bookings.push(new Booking(
                                key,
                                bookingData[key].placeId,
                                bookingData[key].userId,
                                bookingData[key].placeTitle,
                                bookingData[key].placeImage,
                                bookingData[key].firstName,
                                bookingData[key].lastName,
                                bookingData[key].guestNumber,
                                new Date(bookingData[key].bookedFrom),
                                new Date(bookingData[key].bookedTo)
                            ));
                        }
                    }
                    return bookings;
                }), tap(bookings => {
                    this._bookings.next(bookings);
                })
            );

    }

    addBooking(
        placeId: string,
        placeTitle: string,
        placeImage: string,
        firstName: string,
        lastName: string,
        guestNumber: number,
        dateFrom: Date,
        dateTo: Date
    ) {
        const newBooking = new Booking(
            Math.random().toString(),
            placeId,
            this.authService.userId,
            placeTitle,
            placeImage,
            firstName,
            lastName,
            guestNumber,
            dateFrom,
            dateTo
        );
        let generatedId: string;
        return this.httpClient.post<{ name: string }>(`${this.backendurl}bookings.json`, { ...newBooking, id: null })
        .pipe(
            switchMap(resData => {
              generatedId = resData.name;
              return this.bookings;
            }),
            take(1),
            tap(bookings => {
                newBooking.id = generatedId;
                this._bookings.next(bookings.concat(newBooking));
          }));

    }

    cancelBooking(bookingId: string) {
        return this.httpClient.delete(`${this.backendurl}bookings/${bookingId}.json`)
            .pipe(
                switchMap(() => {
                    return this.bookings;
                }),
                take(1),
                tap (bookings => {
                    this._bookings.next(bookings.filter(booking => booking.id !== bookingId));
                })
            );
    }
}







