import { Component, OnInit, OnDestroy } from '@angular/core';
import { Place } from '../../place.model';
import { ActivatedRoute } from '@angular/router';
import { NavController, LoadingController } from '@ionic/angular';
import { PlacesService } from '../../places.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-offer',
  templateUrl: './edit-offer.page.html',
  styleUrls: ['./edit-offer.page.scss'],
})
export class EditOfferPage implements OnInit, OnDestroy {

  private placesSubscription: Subscription;

  place: Place;
  form: FormGroup;

  constructor(
    private activatedRoute: ActivatedRoute,
    private navController: NavController,
    private placesService: PlacesService,
    private loadingController: LoadingController, 
    ) { }

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe(paramMap => {
      if (!paramMap.has('placeId')) {
        this.navController.navigateBack('/places/tabs/offers');
        return;
      }
      this.placesSubscription = this.placesService.getPlace(paramMap.get('placeId')).subscribe(place => {
        this.place = place;
      });
      this.form = new FormGroup({
        title: new FormControl(this.place.title, {
          updateOn: 'blur',
          validators: [Validators.required]
        }),
        description: new FormControl(this.place.description, {
          updateOn: 'blur',
          validators: [Validators.required, Validators.maxLength(180)]
        }),
      });
    });
  }
  ngOnDestroy(): void {
    if (this.placesSubscription) {
      this.placesSubscription.unsubscribe();
    }
  }

  onUpdateOffer() {
    if (this.form.invalid) {
      return;
    }
    this.loadingController.create({keyboardClose: true, message: 'Editing place...'})
      .then(loadingElement => {
        loadingElement.present();
        this.placesService.updatePlace(
          this.place.id,
          this.form.value.title,
          this.form.value.description,
        ).subscribe(() => {
          loadingElement.dismiss();
          this.form.reset();
          this.navController.navigateBack('/places/tabs/offers');
        });
      });
  }

}
