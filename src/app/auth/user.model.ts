export class User {
	constructor(
		public id: string,
		public email: string,
		private _token: string,
		private tokenExpiationDate: Date, 
	) { }

	get token() {
		if (!this.tokenExpiationDate || this.tokenExpiationDate <= new Date()) {
			return null;
		}
		return this._token;
	}

	get TokenDuration() {
		if (!this.token) {
			return 0;
		}
		return this.tokenExpiationDate.getTime() - new Date().getTime();
	}
}