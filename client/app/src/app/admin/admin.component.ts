import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  constructor(private http:HttpClient) { }

  uploadForm = new FormGroup({
    tags: new FormControl(),
    category: new FormControl(),
    subCategory: new FormControl(),
    fileSource: new FormControl()
  });
  preview: string = '';

  ngOnInit(): void {
  }
  get f(){
    return this.uploadForm.controls;
  }
  onFileChange(event:any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.uploadForm.patchValue({
        fileSource: file
      });
    }
  }
  save() {
    const formData = new FormData();
    formData.append('filename', this.uploadForm.get('fileSource')?.value);
    formData.append('subCategory', this.uploadForm.get('subCategory')?.value);
    formData.append('tags', this.uploadForm.get('tags')?.value);
    formData.append('category', this.uploadForm.get('category')?.value);
    this.preview = JSON.stringify(this.uploadForm.value);

    this.http.post('http://localhost:3000/products', formData)
      .subscribe(res => {
        console.log(res,'gaya');
        alert('Uploaded Successfully.');
      })
  
  }

}
