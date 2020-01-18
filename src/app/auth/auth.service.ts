import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { tap, map } from 'rxjs/operators';
import { BehaviorSubject, pipe, Observable, from } from 'rxjs';
import { User } from './user.model';
import { Plugins } from '@capacitor/core';

interface StoredAuthData {
  userId: string;
  token: string;
  tokenExpirationDate: string;
  email: string;
}

export interface AuthResponseData {
  kind?: string,
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {

  private _user = new BehaviorSubject<User>(null);;
  private _userIsAuthenticated = false;
  private _userId = null;
  private activeLogoutTimer: any;
  private signUpURL = environment.signUpURL + environment.googleWebApiKey;
  private signInURL = environment.signInURL + environment.googleWebApiKey;

  get userIsAuthenticated(): Observable<boolean> {
    return this._user.asObservable().pipe(
      map(user => {
        if (user) {
          return !!user.token;
        }
        return false;
      })
    );
  }

  get userId(): Observable<string> {
    return this._user.asObservable().pipe(
      map(user => {
        if (user) {
          return user.id;
        }
        return null;
      })
    );
  }

  get token() {
    return this._user.asObservable().pipe(
      map(user => {
        if (user) {
          return user.token;
        }
        return null;
      })
    );
  }

  constructor(private httpClient: HttpClient) { }

  ngOnDestroy() {
    if (this.activeLogoutTimer) {
      clearTimeout(this.activeLogoutTimer);
    }
  }

  autoLogin() {
    return from(Plugins.Storage.get({key: 'authData'})).pipe(
      map(storedData => {
        if(!storedData || !storedData.value) {
          return null;
        }
        const parsedData = JSON.parse(storedData.value) as StoredAuthData;
        const expirationTime = new Date(parsedData.tokenExpirationDate);
        if (expirationTime <= new Date()) {
          return null;
        }
        const user = new User(parsedData.userId,parsedData.email, parsedData.token, expirationTime);
        return user;
      }), tap(user => {
        if (user) {
          this._user.next(user);
          this.autoLogout(user.TokenDuration);
        }
      }), map(user => {
        return !!user;
      })
    );
  }

  signup(email: string, password: string) {
    return this.httpClient.post<AuthResponseData>(this.signUpURL, {
      email,
      password,
      returnSecureToken: true
    })
    .pipe(
      tap(this.setUserData.bind(this))
    );
  }

  login(email: string, password: string) {
    console.log('##################################################################################################')
    console.log('service.login');
    return this.httpClient.post<AuthResponseData>(this.signInURL, {
      email,
      password,
      returnSecureToken: true
    })
    .pipe(
      tap(this.setUserData.bind(this))
    );
  }

  logout() {
    if (this.activeLogoutTimer) {
      clearTimeout(this.activeLogoutTimer);
    }
    this._user.next(null);
    Plugins.Storage.remove({key: 'authData'});
  }

  autoLogout(duration: number) {
    console.log('duration', duration);
    if (this.activeLogoutTimer) {
      clearTimeout(this.activeLogoutTimer);
    }
    this.activeLogoutTimer = setTimeout(() => {
      this.logout();
    }, duration);
  }

  private setUserData(userData: AuthResponseData) {
    // expiresIn comes as a string representing time in seconds, getTime gets current time in milliseconds
    const expirationTime = new Date(new Date().getTime() + (+userData.expiresIn * 1000));
    const user = new User(
      userData.localId,
      userData.email,
      userData.idToken,
      expirationTime
    );
    this._user.next(user);
    this.autoLogout(user.TokenDuration);
    this.storeAuthData(userData.localId, userData.idToken, expirationTime.toISOString(), userData.email);
  }

  private storeAuthData(userId: string, token: string, tokenExpirationDate: string, email: string) {
    const data = JSON.stringify({userId, token, tokenExpirationDate, email});
    Plugins.Storage.set({key: 'authData', value: data});
  }
}
