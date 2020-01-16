import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { PlacesService } from '../../places.service';
import { NavController, LoadingController } from '@ionic/angular';
import { PlaceLocation } from '../../location.model';
import { switchMap } from 'rxjs/operators';

function base64toBlob(base64Data, contentType) {
  contentType = contentType || '';
  const sliceSize = 1024;
  const byteCharacters = window.atob(base64Data);
  const bytesLength = byteCharacters.length;
  const slicesCount = Math.ceil(bytesLength / sliceSize);
  const byteArrays = new Array(slicesCount);

  for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
    const begin = sliceIndex * sliceSize;
    const end = Math.min(begin + sliceSize, bytesLength);

    const bytes = new Array(end - begin);
    for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
      bytes[i] = byteCharacters[offset].charCodeAt(0);
    }
    byteArrays[sliceIndex] = new Uint8Array(bytes);
  }
  return new Blob(byteArrays, { type: contentType });
}

@Component({
  selector: 'app-new-offer',
  templateUrl: './new-offer.page.html',
  styleUrls: ['./new-offer.page.scss'],
})
export class NewOfferPage implements OnInit {

  form: FormGroup;
  constructor(
    private placesService: PlacesService,
    private navController: NavController,
    private loadingController: LoadingController) { }

  ngOnInit() {
    this.form = new FormGroup({
      title: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required]
      }),
      description: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required, Validators.maxLength(180)]
      }),
      price: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required, Validators.min(1)]
      }),
      dateFrom: new FormControl(null, {
        validators: [Validators.required]
      }),
      dateTo: new FormControl(null, {
        validators: [Validators.required]
      }),
      location: new FormControl(null, [Validators.required]),
      image: new FormControl(null)
    });
  }

  onCreateOffer() {
    if (this.form.invalid || !this.form.get('image').value) {
      return;
    }
    this.loadingController.create({keyboardClose: true, message: 'Creating place...'})
      .then(loadingElement => {
        loadingElement.present();
        this.placesService.uploadImage(this.form.get('image').value)
          .pipe(
            switchMap(uploadResponse => {
              return this.placesService.addPlace(
                this.form.value.title,
                this.form.value.description,
                +this.form.value.price,
                new Date(this.form.value.dateFrom),
                new Date(this.form.value.dateTo),
                this.form.value.location,
                uploadResponse.imageUrl
              );
            })
          ).subscribe(() => {
          loadingElement.dismiss();
          this.form.reset();
          this.navController.navigateBack('/places/tabs/offers');
        });
      });
  }

  onLocationPicked(pickedLocation: PlaceLocation) {
    this.form.patchValue({ location: pickedLocation });
  }

  onImagePicked(imageData: string | File) {
    let imageFile;
    if (typeof imageData === 'string') {
      try {
        imageFile = base64toBlob(imageData.replace('data:image/jpeg;base64,', ''), 'image/jpeg');
      } catch (error) {
        console.log(error);
        return;
      }
    } else {
      imageFile = imageData;
    }
    this.form.patchValue({ image: imageFile });
  }

}
