const express = require('express');
const bodyparser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const multer = require('multer');
const fs = require("fs-extra");
const sharp = require('sharp');
const path = require('path')

const  MulterSharpResizer = class {
    /**
     * Constructor method
     * @param  {object} req
     * @param  {string || object} filename
     * @param  {array} sizes
     * @param  {string} uploadPath
     * @param  {string} fileUrl
     * @param  {Object} sharpOptions
     */
    constructor(req, filename, sizes, uploadPath, fileUrl, sharpOptions) {
      this.req = req;
      this.filename = filename;
      this.sizes = sizes;
      this.uploadPath = uploadPath;
      this.sharpOptions = sharpOptions || {};
      this.fileUrl = fileUrl;
      this.filesUploaded = [];
      this.imageExt = null;
      this.imageFilename = null;
      this.imageUploadPath = null;
      this.data = [];
      this.tmpOriginalname = null;
    }
  
    /**
     * Resize files method
     */
    async resize() {
      if (this.req.files) {
        if (!this.req.files.map) {
          for (const prop in this.req.files) {
            await Promise.all(
              this.req.files[prop].map(async (file, i) => {
                await this.promiseAllResize(
                  file,
                  i,
                  prop,
                  typeof this.filename === "object"
                    ? this.filename[prop]
                    : this.filename
                );
              })
            );
          }
          return;
        }
      }
  
      // Check multiple files
      if (this.req.file) {
        return await this.promiseAllResize(this.req.file);
      }
  
      // Promise.all() multiple files for resizing
      await Promise.all(
        this.req.files.map(async (file, i) => {
          await this.promiseAllResize(file, i);
        })
      );
    }
  
    /**
     * Get Data method
     * Data transform, preparation and return
     */
    getData() {
      // Check multiple files
      // Categorize files by size
      if (this.req.files) {
        if (!this.req.files.map) {
          return this.removeProp(this.getDataWithFields(), "field");
        } else {
          for (let i = 0; i < this.req.files.length - 1; i++) {
            this.data.push({
              ...this.filesUploaded.splice(0, this.sizes.length),
            });
          }
        }
      }
  
      this.data.push(this.filesUploaded);
  
      return this.data.map((file) =>
        this.renameKeys({ ...this.sizes.map((size, i) => size.path) }, file)
      );
    }
  
    /**
     * Change keys name method
     * @param  {object} keysMap
     * @param  {object} obj
     */
    renameKeys(keysMap, obj) {
      return Object.keys(obj).reduce((acc, key) => {
        this.tmpOriginalname = obj[key].originalname;
        this.tmpField = obj[key].field;
        delete obj[key].originalname;
        delete obj[key].field;
        return {
          ...acc,
          originalname: this.tmpOriginalname,
          field: this.tmpField,
          ...{ [keysMap[key] || key]: obj[key] },
        };
      }, {});
    }
  
    /**
     * Promise.all() for resize files method
     * @param  {object} file
     * @param  {number} i
     */
    promiseAllResize(file, i, prop = "", filenameParam = this.filename) {
      Promise.all(
        this.sizes.map((size) => {
          this.imageExt = file.mimetype.split("/")[1];
          this.imageFilename = `${filenameParam.split(/\.([^.]+)$/)[0]}${
            i != undefined ? `-${i}` : ""
          }-${size.path}.${this.imageExt}`;
          this.imageUploadPath = this.uploadPath.concat(`/${size.path}`);
          fs.mkdirsSync(this.imageUploadPath);
          this.filesUploaded.push({
            originalname: file.originalname,
            ...(prop && { field: prop }),
            filename: this.imageFilename,
            path: `${this.fileUrl}/${size.path}/${this.imageFilename}`,
          });
          return sharp(file.buffer)
            .resize(size.width, size.height, this.sharpOptions)
            .toFile(`${this.imageUploadPath}/${this.imageFilename}`);
        })
      );
    }
  
    /**
     * Grouping data by field
     * Return Data that send with multer fields method
     */
    getDataWithFields() {
      for (const prop in this.req.files) {
        for (let i = 0; i < this.req.files[prop].length; i++) {
          this.data.push({
            ...this.filesUploaded.splice(0, this.sizes.length),
          });
        }
      }
  
      return this.groupByFields(
        this.data.map((file) =>
          this.renameKeys({ ...this.sizes.map((size, i) => size.path) }, file)
        ),
        "field"
      );
    }
  
    /**
     * Grouping data by specific property method
     * @param  {array} array
     * @param  {property} prop
     */
    groupByFields(array, prop) {
      return array.reduce(function (r, a) {
        r[a[prop]] = r[a[prop]] || [];
        r[a[prop]].push(a);
        return r;
      }, Object.create(null));
    }
  
    /**
     * Remove specific property method
     * @param  {object} obj
     * @param  {string} propToDelete
     */
    removeProp(obj, propToDelete) {
      for (var property in obj) {
        if (typeof obj[property] == "object") {
          delete obj.property;
          let newJsonData = this.removeProp(obj[property], propToDelete);
          obj[property] = newJsonData;
        } else {
          if (property === propToDelete) {
            delete obj[property];
          }
        }
      }
      return obj;
    }
  };





const app = express();

app.use(cors());
app.use(bodyparser.json());



// app.use('/static', express.static(path.join(__dirname, 'public')));


// app.use('/static', express.static(path.join(__dirname, 'public/uploads/2022/10/thumb')));




// app.use(express.static(path.join(`${__dirname}`, '/public')));
app.use(express.static('public'));
app.use(express.static("../client/app/dist/app/"));

// app.use('/images', express.static('public'));

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

const insertImageContent = (req) => {
    const name = req.body.name;
    const category = req.body.category;
    var filename = req.body.filename[0].originalname;
    var path = req.body.filename[0].thumb.path;
    let q = `insert into images (name, category,path) values('${name}', '${category}','${path}')`;
    db.query(q);
};

const resizerImages = async (req, res, next) => {
    
    const today = new Date();
    const year = today.getFullYear();
    const month = `${today.getMonth() + 1}`.padStart(2,"0");


    const filename = {
        filename: `gallery-${Date.now()}`
    }
    const sizes = [{
        path: 'original',
        with: null,
        height: null
    },

    {
        path: 'large',
        with: 1000,
        height: 600
    },
    {
        path: 'medium',
        with: 300,
        height: 160
    }, {
        path: 'thumb',
        with: 150,
        height: 150
    }
    ];
    
    const uploadPath = `./public/uploads/${year}/${month}/${req.body.name}`;

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${year}/${month}/${req.body.name}`;

    const sharpOptions = {
        fit: "contain",
        background: {r:255,g:255,b:255}
    };

    


    const resizeObj = new MulterSharpResizer(
        req, 
        filename, 
        sizes, uploadPath, fileUrl
    );
    await resizeObj.resize();
    const getDataUploaded =  resizeObj.getData();
     req.body.filename = getDataUploaded.filename;
     
     insertImageContent(req,res,next);
     next();
}

const createProduct =  async(req, res,next)=> {
    res.status(201).json({
        status:'success',
        filename: req.body.filename
    });
};


const uploadProductImages = upload.fields([
    { name: "filename", maxCount: 4 }
]);


app.post("/products", uploadProductImages, resizerImages, createProduct);

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    port: 3306,
    database: 'pikrush'

});

// check database connection
db.connect(err => {
    if (err) console.log('err', err);
});
app.get('/', (req,res) => {
  res.sendFile("../client/app/dist/app/index.html")
});


app.get('/images', (req, res) => {
    let q = `select * from images`;
    db.query(q, (err, result) => {
        if (err) console.log(err);
        if (result.length > 0) {
            res.send({
                message: 'all images data',
                data: result
            });
        }
    });
});


app.get('/images/:id', (req, res) => {
    const id = req.params.id;
    let q = `select * from images where id = ${id}`;
    db.query(q, (err, result) => {
        if (err) console.log(err);
        if (result.length > 0) {
            res.send({
                message: 'get single image',
                data: result
            });
        }
    });
});

app.post('/image', (req, res) => {
    console.log('data', req.body);
    const name = req.body.name;
    const category = req.body.category;
    const tags = req.body.tags;
    let q = `insert into images (name, category, tags) values('${name}', '${category}', '${tags}')`;
    db.query(q, (err, result) => {
        console.log(result);
        if (err) console.log(err);
        if (result) {
            res.send({
                message: 'inserted successfully',

            });
        }
    });
});



app.listen(3000, () => {
    console.log('server is running in 3000');
});

