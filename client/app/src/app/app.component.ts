import { Component, OnInit } from '@angular/core';
import { ImagesService } from './image.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  images:any;
  constructor (private imageService:ImagesService) {

  }
  title = 'app';
  ngOnInit():void {
  }
}
