import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  images: any;
  imagePaths: any;
  constructor(private http: HttpClient) { }

  deriveImagePaths = (images: Array<any>) => {
    let urls = '';
    images.map((image: any) => {

      const thumb = image.path.replace(/medium/g,  "thumb");
      const large = image.path.replace(/medium/g, "large");

      urls = `${thumb} 150w, 
     ${image.path} 800w, 
     ${large} 1200w
     sizes="(max-width: 650px) calc((100vw - 30px - 15px) / 2), 
 (max-width: 900px) calc((100vw - 30px - 15px) / 2), 
 (max-width: 1440px) calc((100vw - 60px - 60px) / 3), 
 (max-width: 1600px) calc((100vw - 160px - 60px) / 3), 
 calc((1600px - 160px - 60px) / 3)
     `;
      
      image['urls'] = urls;
    });

  }

  ngOnInit(): void {
    this.http.get('http://3.87.8.163:3000/images').subscribe((res: any) => {
      console.log(res, "gaya");
      this.images = res.data;
      this.deriveImagePaths(this.images);
    });
  }

}
