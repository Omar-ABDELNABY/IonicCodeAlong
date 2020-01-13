import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { PlacesService } from '../../places.service';
import { NavController, LoadingController } from '@ionic/angular';
import { PlaceLocation } from '../../location.model';

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
    });
  }

  onCreateOffer() {
    if (this.form.invalid) {
      return;
    }
    this.loadingController.create({keyboardClose: true, message: 'Creating place...'})
      .then(loadingElement => {
        loadingElement.present();
        this.placesService.addPlace(
          this.form.value.title,
          this.form.value.description,
          +this.form.value.price,
          new Date(this.form.value.dateFrom),
          new Date(this.form.value.dateTo),
          this.form.value.location
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

}
