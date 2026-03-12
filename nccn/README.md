# NCCN Guidelines Downloader

Bu araç, NCCN (National Comprehensive Cancer Network) yönergelerini (Kategori 1'den Kategori 4'e kadar) otomatik olarak tarayan ve "NCCN Guidelines" PDF dosyalarını indiren bir otomasyon betiğidir.

## Nasıl Çalıştırılır?

Bu araç, bir sunucu gerektirmeksizin doğrudan GitHub üzerinde **GitHub Actions** kullanılarak çalıştırılmak üzere tasarlanmıştır.

1.  Bu deponun GitHub sayfasında **Actions** sekmesine gidin.
2.  Sol menüden **"NCCN Guidelines Downloader"** iş akışını (workflow) seçin.
3.  Sağ taraftaki **"Run workflow"** butonuna tıklayın.
4.  Açılan küçük pencerede:
    *   **NCCN Kullanıcı Adı (E-posta):** NCCN hesabınıza kayıtlı e-posta adresinizi girin.
    *   **NCCN Şifresi:** NCCN şifrenizi girin.
5.  Tekrar yeşil **"Run workflow"** butonuna tıklayarak işlemi başlatın.

İşlem tamamlandığında, indirilen PDF dosyaları otomatik olarak bu depoya, `nccn/downloads/` klasörü içerisine eklenecektir. Daha önce indirilmiş dosyalar (aynı isimde olanlar) otomatik olarak atlanır (çift indirme yapılmaz).

## Notlar

*   Kullanıcı bilgileriniz (kullanıcı adı ve şifre) hiçbir yerde kaydedilmez, sadece iş akışı (workflow) çalıştığı anda bellek üzerinde kullanılır.
*   Bu araç web kazıma (web scraping) ve tarayıcı otomasyonu yöntemlerini kullandığı için NCCN sitesinin arayüzünde büyük değişiklikler olması durumunda güncellenmesi gerekebilir.
