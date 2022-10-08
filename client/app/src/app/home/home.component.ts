import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  images:any;
  constructor(private http:HttpClient) { }

  ngOnInit(): void {
    this.http.get('http://localhost:3000/images').subscribe((res:any)=>{
      console.log(res, "gaya");
      this.images = res.data;
    });
  }

}
