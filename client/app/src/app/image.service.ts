import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImagesService {

  constructor(private http:HttpClient) { }

  apiUrl = 'http://3.87.8.163:3000/images';

  // getAllImages():Observable<any> {
  //   return this.http.get(`${this.apiUrl}`);
  // }
}
