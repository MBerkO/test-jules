# Projelerim

Bu depo, projelerinizi klasörler halinde düzenleyip tek bir minimalist giriş sayfası üzerinden erişebilmeniz için tasarlanmıştır.

Giriş sayfası otomatik olarak oluşturulmaktadır.

## Nasıl Yeni Proje Eklenir?

1. Yeni projeniz için repo ana dizininde bir klasör oluşturun. (Örnek: `mkdir yeniproje`)
2. `node generate.js` komutunu çalıştırarak `index.html` (Giriş Sayfası) dosyasını güncelleyin.
3. Yeni klasörünüz artık giriş sayfasında listelenecektir!

## Özellikler

*   Son derece minimalist tasarım
*   Açık ve Koyu mod desteği (Sistem tercihini algılar ve manuel olarak değiştirilebilir)
*   Otomatik listeleme (Gizli dizinler ve `node_modules` gibi özel dizinler yoksayılır)
