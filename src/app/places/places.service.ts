import { Injectable } from '@angular/core';
import { Place, PlaceData } from './place.model';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject, of } from 'rxjs';
import { take, map, tap, delay, filter, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { PlaceLocation } from './location.model';

@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  private oldPlaces = [
    // new Place(
    //   'p1',
    //   'Manhattan Mansion',
    //   'In the heart of Newyork City',
    //   'https://imgs.6sqft.com/wp-content/uploads/2014/06/21042533/Carnegie-Mansion-nyc.jpg',
    //   149.99,
    //   new Date('2019-01-01'),
    //   new Date('2019-12-31'),
    //   'xyz'
    // ),
    // new Place(
    //   'p2',
    //   `L'Amour Toujours`,
    //   'A romantic place in Paris',
    //   'https://miro.medium.com/max/4096/1*t-nXIcaD3oP6CS4ydXV1xw.jpeg',
    //   189.99,
    //   new Date('2019-01-01'),
    //   new Date('2019-12-31'),
    //   'abc'
    // ),
    // new Place(
    //   'p3',
    //   'The Foggy Palace',
    //   'Not your average city trip',
    //   'https://i.pinimg.com/originals/9c/88/44/9c8844b217bdb6c17db14f51ad2e51a5.jpg',
    //   99.99,
    //   new Date('2019-01-01'),
    //   new Date('2019-12-31'),
    //   'abc'
    // )
  ];

  private backendurl = environment.backendurl;
  private firebaseStoreImage = environment.firebaseStoreImage;

  private urlPart = 'offered-places.json';
  private url = `${this.backendurl}${this.urlPart}`;
  private _places = new BehaviorSubject<Place[]>([]);

  constructor(
    private authService: AuthService,
    private httpClient: HttpClient
  ) {}

  fetchPlaces() {
    return this.httpClient.get<{ [key: string]: PlaceData }>(this.url).pipe(
      map(resData => {
        const places: Place[] = [];
        for (const key in resData) {
          if (resData.hasOwnProperty(key)) {
            places.push(
              new Place(
                key,
                resData[key].title,
                resData[key].description,
                resData[key].imageUrl,
                resData[key].price,
                new Date(resData[key].availableFrom),
                new Date(resData[key].availableTo),
                resData[key].userId,
                resData[key].location
              )
            );
          }
        }
        return places;
      }),
      tap(places => {
        this._places.next(places);
      })
    );
  }

  get places() {
    return this._places.asObservable();
  }

  getPlace(id: string) {
    return this.httpClient
      .get<PlaceData>(`${this.backendurl}offered-places/${id}.json`)
      .pipe(
        map(placeData => {
          return new Place(
            id,
            placeData.title,
            placeData.description,
            placeData.imageUrl,
            placeData.price,
            new Date(placeData.availableFrom),
            new Date(placeData.availableTo),
            placeData.userId,
            placeData.location
          );
        })
      );
  }

  uploadImage(image: File) {
    const uploadData = new FormData();
    uploadData.append('image', image);
    return this.httpClient.post<{ imageUrl: string, imagePath: string }>(
      this.firebaseStoreImage,
      uploadData
    );
  }

  addPlace(
    title: string,
    description: string,
    price: number,
    dateFrom: Date,
    dateTo: Date,
    location: PlaceLocation,
    imageUrl: string,
  ) {
    const newPlace = new Place(
      Math.random.toString(),
      title,
      description,
      imageUrl,
      price,
      dateFrom,
      dateTo,
      this.authService.userId,
      location
    );
    let generatedId: string;
    return this.httpClient
      .post<{ name: string }>(this.url, { ...newPlace, id: null })
      .pipe(
        switchMap(resData => {
          generatedId = resData.name;
          return this.places;
        }),
        take(1),
        tap(places => {
          newPlace.id = generatedId;
          this._places.next(places.concat(newPlace));
        })
      );
  }

  updatePlace(placeId: string, title: string, description: string) {
    let updatedPlaces: Place[];
    return this._places.pipe(
      take(1),
      switchMap(places => {
        if (!places || places.length <= 0) {
          return this.fetchPlaces();
        } else {
          return of(places);
        }
      }),
      switchMap(places => {
        const placeIndex = places.findIndex(place => place.id === placeId);
        updatedPlaces = [...places];
        const oldPlace = updatedPlaces[placeIndex];
        updatedPlaces[placeIndex] = new Place(
          placeId,
          title,
          description,
          oldPlace.imageUrl,
          oldPlace.price,
          oldPlace.availableFrom,
          oldPlace.availableTo,
          oldPlace.userId,
          oldPlace.location
        );
        return this.httpClient.put(
          `${this.backendurl}offered-places/${placeId}.json`,
          { ...updatedPlaces[placeIndex], id: null }
        );
      }),
      tap(() => {
        this._places.next(updatedPlaces);
      })
    );
  }
}
