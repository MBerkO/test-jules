# NCCN Rehber İndirici

Bu uygulama, NCCN (National Comprehensive Cancer Network) rehberlerini (Kategori 1-4 arası ana profesyonel PDF dosyalarını) otomatik olarak indirmeye yarayan bir araçtır. Hash kontrolleri sayesinde aynı dosyalar tekrar indirilmez.

## Kurulum ve Çalıştırma

Öncelikle projenin olduğu klasöre terminalden girin ve bağımlılıkları indirin (eğer inmediyse):

```bash
cd nccn
npm install
npx playwright install chromium
```

Daha sonra sunucuyu başlatın:

```bash
npm start
```

Tarayıcınızdan `http://localhost:3000` adresine gidin. NCCN kullanıcı adı ve şifrenizi, ayrıca dosyaların kaydedilmesini istediğiniz bilgisayarınızdaki tam klasör yolunu (örneğin: `C:\Users\KullaniciAdi\Desktop\NCCN`) yazarak "İndirmeye Başla" butonuna basın.

İşlem arka planda tarayıcıyı gizlice açarak ilerler ve durum loglarını aynı sayfadan canlı olarak takip edebilirsiniz.
