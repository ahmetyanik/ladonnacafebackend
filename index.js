
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
const path=require('path');

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();
// cors : farklı klasördeki uygulamaları birbirine bağlar
app.use(express.static(__dirname + "/public"));

if(process.env.NODE_ENV==='production'){
  app.use(express.static('client/build'));

  app.get('*',(req,res)=>{

    res.sendFile(path.resolve(__dirname,'client','build','index.html'));
  })
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const cors = require("cors");

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,HEAD, PUT, PATCH, POST, DELETE",
    credentials: true,
  })
);
app.use(fileUpload());

const CONNECTION_URL =
  "mongodb+srv://ladonna:ladonna3623@cluster0.5vnmn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

const Schema = mongoose.Schema;

mongoose.connect(CONNECTION_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(()=>app.listen(PORT,()=>console.log(`Server running: ${PORT}`)))
.catch((error)=>console.log(error.message));

mongoose.set("useFindAndModify",false);
app.use(
  session({
    secret: "Techproeducation - WebDeveloper",
    resave: true,
    saveUninitialized: true,
    name: "kullanici_bilgileri",
    proxy: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

///////// MONGODB ŞEMALARI - BAŞLANGIÇ
const urunSema = {
  isim: String,
  kategori: String,
  kategori_url: String,
  resim: String,
  aciklama: String,
  fiyat: Number,
  alerjenler: String,
};

const kategoriSema = {
  kategori_isim: String,
  kategori_url: String,
  kategori_sira:Number
};

const kullaniciSema = new mongoose.Schema({
  isim: String,
  soyisim: String,
  email: String,
  sifre: String,
  adres: String,
  telefon: String,
  engel: Number,
  rol: String,
});

kullaniciSema.plugin(passportLocalMongoose, {
  usernameField: "email",
  passwordField: "sifre",
});

///////// MONGODB ŞEMALARI - BİTİŞ

///////// MONGODB MODELLERİ - BAŞLANGIÇ
const Urun = mongoose.model("Urun", urunSema);
const Kategori = mongoose.model("Kategori", kategoriSema);
const Kullanici = mongoose.model("Kullanici", kullaniciSema);
passport.use(Kullanici.createStrategy());

// Tarayıcıda cookie oluşturacak
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

// Tarayıcıdan cookie alıp kullanıcı kontrol işlemi gerçekleştireceğiz.
passport.deserializeUser(function (id, done) {
  Kullanici.findById(id, function (err, user) {
    done(err, user);
  });
});

///////// MONGODB MODELLERİ - BİTİŞ

app.get("/", function (req, res) {
  res.send("Başarılı..");
});

//////////////////////////                  URUN              /////////////////////////////
app.post("/api/urun/olusturma", function (req, res) {
  var urun = new Urun({
    isim: "Incirli Kek",
    kategori: "Organische Produkte",
    kategori_url: "organische_produkte",
    resim: "/resimler/incir.jpg",
    aciklama:
      "Papatya çayı, antioksidanlarla dolu bir çay türüdür. Papatya çayın en önemli sağlık yararları arasında uykuyu düzenleme, cildi koruma ve adet kramplarını yatıştırma yeteneği bulunur. Anti-enflamatuar etkisi nedeniyle, ayrıca ishal ve şişkinliği gidermeye de yardımcı olur. Peki, Papatya çayının faydaları nelerdir? Bilinmesi gerekenleri haberimizde sizler için derledik…",
    fiyat: 49.99,
  });

  urun.save(function (err) {
    if (!err) {
      res.send([
        {
          sonuc: "başarılı",
        },
      ]);
    } else {
      res.send([
        {
          sonuc: "hata",
        },
      ]);
    }
  });
});

app.get("/api/urun/detay/:id", function (req, res) {
  Urun.find({ _id: req.params.id }, function (err, gelenVeri) {
    if (!err) {
      res.send(gelenVeri);
    } else {
      res.send([
        {
          sonuc: "hata",
        },
      ]);
    }
  });
});

/////////////////////////////   KATEGORİ API     ///////////////

app.post("/api/kategori_bireysel/olustur", function (req, res) {
  var kategori = new Kategori({
    kategori_isim: req.body.isim,
    kategori_url: req.body.url,
    kategori_sira:req.body.sira
  });

  kategori.save(function (err, gelenVeri) {
    if (!err) {
      res.send(gelenVeri);
    } else {
      res.send(err);
    }
  });
});

app.get("/api/kategori_bireysel/:kategori_url", function (req, res) {
  Kategori.find(
    { kategori_url: req.params.kategori_url },
    function (err, gelenVeri) {
      if (!err) {
        res.send(gelenVeri);
      } else {
        res.send([
          {
            sonuc: "hata",
          },
        ]);
      }
    }
  );
});

app.get("/api/kategori_liste", function (req, res) {
  Kategori.find({}, function (err, gelenVeri) {
    if (!err) {
      res.send(gelenVeri);
    } else {
      res.send([
        {
          sonuc: "hata",
        },
      ]);
    }
  }).sort({
    kategori_sira: +1,
  });
});

app.get("/kategori/:kategori_url", function (req, res) {
  Urun.find(
    { kategori_url: req.params.kategori_url },
    function (err, gelenVeri) {
      if (!err) {
        res.send(gelenVeri);
      } else {
        res.send([
          {
            sonuc: "hata",
          },
        ]);
      }
    }
  );
});

app.get("/urun/:kategori_url/:urun_adi", function (req, res) {
  Urun.find(
    {
      isim: req.params.urun_adi,
    },
    function (err, gelenVeri) {
      if (!err) {
        res.send(gelenVeri);
      } else {
        res.send([
          {
            sonuc: "hata",
          },
        ]);
      }
    }
  );
});

app.get("/api/urun/benzerurunler/:kategori_url/:urunid", function (req, res) {
  Urun.find(
    {
      kategori_url: req.params.kategori_url,
      _id: { $nin: req.params.urunid },
    },
    function (err, gelenVeri) {
      if (!err) {
        res.send(gelenVeri);
      } else {
        res.send([
          {
            sonuc: "hata",
          },
        ]);
      }
    }
  ).limit(4);
});

////////////////////////              KULLANICI İŞLEMLERİ     //////////////////////////////
app.post("/api/kullanici/olusturma", function (req, res) {
  Kullanici.register(
    {
      isim: req.body.isim,
      soyisim: req.body.soyisim,
      email: req.body.email,
      rol: "admin",
      engel: 0,
    },
    req.body.sifre,
    function (err, gelenVeri) {
      if (err) {
        if (err.name === "UserExistsError") {
          res.send({ sonuc: "email" });
        } else {
          res.send({ sonuc: "hata" });
        }
      } else {
        passport.authenticate("local")(req, res, function () {
          res.send({ sonuc: "başarılı" });
        });
      }
    }
  );
});

app.post("/api/kullanici/giris", function (req, res) {
  const kullanici = new Kullanici({
    email: req.body.email,
    sifre: req.body.sifre,
  });

  req.login(kullanici, function (err) {
    if (err) {
      res.send({
        sonuc: false,
      });
    } else
      passport.authenticate("local")(req, res, function () {
        if (req.user.engel === 1) {
          req.logout();
          res.send({
            sonuc: false,
          });
        } else {
          res.send({
            sonuc: true,
          });
        }
      });
  });
});

app.get("/api/kullanici/cikis", function (req, res) {
  req.logout();
  res.send({ sonuc: "başarılı" });
});

app.get("/api/kullanici/giriskontrol", function (req, res) {
  console.log(req.isAuthenticated());
  if (req.isAuthenticated()) {
    res.send({
      sonuc: true,
      isim: req.user.isim,
      id: req.user._id,
      rol: req.user.rol,
    });
  } else {
    res.send({ sonuc: false });
  }
});

app.get("/api/kullanici/bilgiler", function (req, res) {});

//////////////////////////             YENİ ÜRÜNLER             ///////////////////////////////
app.get("/api/yeniurunler", function (req, res) {
  Urun.find({}, function (err, gelenVeri) {
    if (!err) {
      res.send(gelenVeri);
    } else {
      res.send([
        {
          sonuc: "hata",
        },
      ]);
    }
  })
    .sort({ _id: -1 })
    .limit(4);
});

////////////////////////    PROFİL İŞLEMLERİ      ////////

app.get("/api/profil/bilgiler", function (req, res) {
  res.send(req.user);
});

app.patch("/api/profil/bilgiler", function (req, res) {
  Kullanici.updateOne(
    { _id: req.user._id },
    {
      $set: req.body,
    },
    function (err) {
      if (err) {
        res.send({ sonuc: false });
      } else {
        res.send({ sonuc: true });
      }
    }
  );
});

app.post("/api/profil/sifreguncelle", function (req, res) {
  var email = req.user.email;
  var newPasswordString = req.body.sifre;

  Kullanici.findByUsername(email).then(
    function (sanitizedUser) {
      if (sanitizedUser) {
        sanitizedUser.setPassword(newPasswordString, function () {
          sanitizedUser.save();
          res.status(200).json({ sonuc: true });
        });
      } else {
        res.status(500).json({ sonuc: false });
      }
    },
    function (err) {
      res.status(500).json({ sonuc: false });
    }
  );
});

///////////////////////     ADMİN PANELİ   ////////////////

app.delete("/admin/api/urunsil", function (req, res) {
  Urun.deleteOne({ _id: req.query.id }, function (err, gelenVeri) {
    if (!err) {
      res.send({ sonuc: true });
    } else {
      res.send({ sonuc: false });
    }
  });
});

app.post("/admin/api/urunolustur", async function (req, res) {
  const tarih = new Date();
  const rastgeleSayi = tarih.getTime();

  if (!req.files) {
    return console.log("Resim Eklenmeli");
  }

  var dosya1isim = rastgeleSayi + "-" + req.body.kategori_url + "-1.jpg";

  await req.files.dosya1.mv(
    `${__dirname}/public/dosyalar/resimler/${dosya1isim}`
  );

  var urun = new Urun({
    isim: req.body.isim,
    kategori: req.body.kategori,
    kategori_url: req.body.kategori_url,
    resim: "http://localhost:5000/dosyalar/resimler/" + dosya1isim,
    aciklama: req.body.aciklama,
    fiyat: req.body.fiyat,
    alerjenler: req.body.alerjenler,
  });

  urun.save(function (err) {
    if (!err) {
      res.send({
        sonuc: "başarılı",
      });
    } else {
      res.send({
        sonuc: "hata",
      });
    }
  });
});

app.patch("/api/kategori_bireysel/guncelle", function (req, res) {
  console.log(req.query.id);
  console.log(req.body);
  Kategori.updateOne(
    { _id: req.query.id },
    {
      $set: req.body,
    },
    function (err) {
      if (err) {
        res.send({ sonuc: false });
      } else {
        res.send({ sonuc: true });
      }
    }
  );
});

app.delete("/api/kategori_bireysel/sil", function (req, res) {
  Kategori.deleteOne({ _id: req.query.id }, function (err, gelenVeri) {
    if (!err) {
      res.send({ sonuc: true });
    } else {
      res.send({ sonuc: false });
    }
  });
});

app.get("/admin/api/tum_kullanicilar", function (req, res) {
  if (req.isAuthenticated() && req.user.rol === "admin") {
    Kullanici.find({}, function (err, gelenVeri) {
      if (!err) {
        res.send(gelenVeri);
      } else {
        res.send({
          sonuc: "hata",
        });
      }
    });
  } else {
    res.send({ sonuc: "Giriş yapmanız girekiyor." });
  }
});

app.patch("/admin/api/kullanici_engel", function (req, res) {
  if (req.isAuthenticated() && req.user.rol === "admin") {
    Kullanici.updateOne(
      { _id: req.body.id },
      { $set: req.body },
      function (err, gelenVeri) {
        if (!err) {
          res.send(gelenVeri);
        } else {
          res.send({
            sonuc: "hata",
          });
        }
      }
    );
  } else {
    res.send({
      sonuc: "Giriş yapmanız gerekiyor.",
    });
  }
});

app.patch("/admin/api/urunguncelle", async function (req, res) {
  const tarih = new Date();
  const rastgeleSayi = tarih.getTime();

  var dosya1isim = "";
  console.log(req.body.res1);

  if (req.body.res1 !== "") {
    dosya1isim = req.body.res1;
    
  } else {
    eklenecek = rastgeleSayi + "-" + req.body.kategori_url + "-1.jpg";
    await req.files.dosya1.mv(
      `${__dirname}/public/dosyalar/resimler/${eklenecek}`
    );

    dosya1isim = "http://localhost:5000/dosyalar/resimler/" + eklenecek;
  }

  Urun.updateOne(
    { _id: req.body.id },
    {
      $set: {
        isim: req.body.isim,
        kategori: req.body.kategori,
        kategori_url: req.body.kategori_url,
        resim: dosya1isim,
        aciklama: req.body.aciklama,
        fiyat: req.body.fiyat,
        alerjenler: req.body.alerjenler,
        
      },
      
    },
    
    function (err, gelenVeri) {
      if (!err) {
        res.send({ sonuc: "Basari ile kaydedildi" });
      }else{
        res.send({sonuc:"Hata"})
      }
    }
  );
  console.log("resim",dosya1isim);
});



app.post("/admin/api/kullanici_giris", function (req, res) {
  const kullanici = new Kullanici({
    email: req.body.email,
    sifre: req.body.sifre,
  });

  req.login(kullanici, function (err) {
    if (err) {
      res.send({
        sonuc: false,
      });
    } else
      passport.authenticate("local")(req, res, function () {
        if (req.user.rol !== "admin") {
          req.logout();
          res.send({
            sonuc: false,
          });
        } else {
          res.send({
            sonuc: true,
          });
        }
      });
  });
});

////////////////////////////      TÜM ÜRÜNLER       //////////////////////////////////////////////

app.get("/api/tumurunler", function (req, res) {
  Urun.find({}, function (err, gelenVeri) {
    if (!err) {
      res.send(gelenVeri);
    } else {
      res.send([
        {
          sonuc: "hata",
        },
      ]);
    }
  });
});

let port = process.env.PORT;
if(port == "" || port == null){
  port = 5000;
}
app.listen(port, function(){
  console.log("port : " + port);
});
