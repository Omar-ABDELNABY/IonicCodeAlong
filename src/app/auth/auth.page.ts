import { Component, OnInit } from '@angular/core';
import { AuthService, AuthResponseData } from './auth.service';
import { Router } from '@angular/router';
import { LoadingController, AlertController } from '@ionic/angular';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {

  isLogin = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController) { }

  ngOnInit() { }

  authenticate(email: string, password: string) {
    console.log('##################################################################################################')
    console.log('authenticate');
    this.loadingController.create({
      keyboardClose: true,
      message: this.isLogin ? 'Logging in...' : 'Signing up...'
    })
    .then(loadingElement => {
      loadingElement.present();
      let authObservable: Observable<AuthResponseData>;
      if (this.isLogin) {
        authObservable = this.authService.login(email, password);
      } else {
        authObservable = this.authService.signup(email, password);
      }
      authObservable.subscribe(resData => {
        console.log('##################################################################################################')
        console.log('resData');
        console.log(resData);
        loadingElement.dismiss();
        this.router.navigateByUrl('/places/tabs/discover');
      }, errorRes => {
        console.log('##################################################################################################')
        console.log(errorRes);
        loadingElement.dismiss();
        const errorCode = errorRes.error.error.message;
        let message = `Couldn\'t ${this.isLogin ? 'login' : 'signup'}, please try again`;
        console.log('##################################################################################################')
        console.log(errorCode);
        if(errorCode === 'EMAIL_EXISTS') {
          message = 'This email address already exists!';
        }
        if(errorCode === 'EMAIL_NOT_FOUND') {
          message = 'Email address couln\'t be found!';
        }
        if(errorCode === 'INVALID_PASSWORD') {
          message = 'Invalid Password!';
        }
        this.showAlert(message);
      });
    });
  }

  onSubmit(form: NgForm) {
    if (form.invalid) {
      return;
    }
    console.log('##################################################################################################')
    console.log('onSubmit');
    const email = form.value.email;
    const password = form.value.password;
    this.authenticate(email,password);
    form.reset();
  }

  onSwitchAuthMode() {
    this.isLogin = !this.isLogin;
  }

  private showAlert(message: string) {
    this.alertController.create({
      header: 'Authentication Failed',
      message,
      buttons: ['Ok']
    }).then(alertElement => {
      alertElement.present();
    });
  }
}
