# Selotion Cookie Consent

**Simple. Lightweight. Open Source.**

Açık kaynaklı, ücretsiz, hafif ve altyapıdan bağımsız çerez izin yönetim kütüphanesi.
Vanilla JavaScript, harici bağımlılık yok, tek script etiketiyle kurulum, MIT lisansı.

> **Önemli:** Bu kütüphane tek başına KVKK veya GDPR uyumluluğunu garanti etmez ve hukuki danışmanlık sunmaz.
> Çerezlerinizi doğru kategorilere ayırmak, politikalarınızı hazırlamak ve yasal yükümlülüklerinizi yerine getirmek site sahibinin sorumluluğundadır.

## Kurulum

Sitenize yalnızca şu etiketi ekleyin:

```html
<script
  src="https://cdn.selotion.com/cookie-consent/v1/cookie-consent.min.js"
  data-language="tr"
  data-theme="light"
  data-position="bottom"
  defer>
</script>
```

Ayrıca HTML veya CSS yazmanız gerekmez. Üretim sitelerinde sabit sürüm yolunu (`/v1/`) kullanın; `/latest/` yalnızca denemeler içindir.

## Script engelleme

Yalnızca banner göstermek yeterli değildir. İzin gerektiren scriptleri **pasif** tanımlayın:

```html
<!-- Harici script -->
<script type="text/plain"
        data-cookie-category="analytics"
        data-cookie-src="https://example.com/analytics.js"></script>

<!-- Inline script -->
<script type="text/plain" data-cookie-category="marketing">
  console.log("Marketing script activated");
</script>
```

Kategoriler: `analytics`, `marketing`, `preferences`.

Kütüphane:

- Scripti yalnızca ilgili kategoriye izin verildiğinde etkinleştirir.
- Aynı harici scripti birden fazla kez yüklemez.
- Sayfa yenilendiğinde kayıtlı tercihi uygular.
- Sonradan DOM'a eklenen pasif scriptleri de yakalar.
- Yükleme hatasında `cookieconsent:scripterror` olayı yayar; sonraki uygulamada yeniden dener.
- İzin geri çekildiğinde yeni script yüklemelerini durdurur.

### Bilinen sınırlamalar

- **Geri alma yoktur.** Çalışmış bir JavaScript kodunun etkileri veya oluşturduğu çerezler sonradan otomatik silinemez. Bu yüzden izin gerektiren scriptler başlangıçtan itibaren `type="text/plain"` ile pasif tanımlanmalıdır.
- **Kütüphane yalnızca kendi etiketlerinizi yönetir.** Normal `<script>` etiketiyle eklenen, Google Tag Manager veya bir eklenti tarafından enjekte edilen scriptler engellenmez. Bunları da pasif formata taşıyın.
- **Inline stil:** Arayüz stili Shadow DOM içine `<style>` olarak gömülür. Katı bir `style-src` CSP kullanıyorsanız `'unsafe-inline'` veya nonce gerekebilir.

## Yapılandırma

Tüm ayarlar opsiyoneldir.

| Özellik | Değerler | Varsayılan |
|---|---|---|
| `data-language` | `tr`, `en` | `<html lang>` desteklenirse o, yoksa `en` |
| `data-theme` | `light`, `dark`, `auto` | `light` |
| `data-position` | `bottom`, `top` | `bottom` |
| `data-align` | `left`, `center`, `right` | `center` |
| `data-primary-color` | Hex renk (`#FFBC1A`) | `#FFBC1A` |
| `data-brand` | Marka adı | yok |
| `data-logo` | Logo URL | yok |
| `data-privacy-url` | Gizlilik politikası URL | bağlantı gizli |
| `data-cookie-url` | Çerez politikası URL | bağlantı gizli |
| `data-reopen-button` | `true`, `false` | `true` |
| `data-consent-version` | Pozitif tam sayı | `1` |

- Desteklenmeyen dil seçilirse İngilizce kullanılır. Almanca ve Fransızca sonraki sürümlerde eklenecek.
- `data-primary-color` üzerindeki metin rengi (koyu/açık) otomatik seçilir.
- `data-reopen-button`: Karar verildikten sonra köşede görünen küçük "Çerez tercihlerini aç" düğmesi. Kendi bağlantınızı kullanacaksanız `false` yapın.
- `data-consent-version`: Çerez kapsamınız değiştiğinde değeri artırın; tüm ziyaretçilerden yeniden tercih istenir.

## JavaScript API

```js
CookieConsent.showPreferences();      // tercih panelini aç
CookieConsent.acceptAll();            // tümünü kabul et
CookieConsent.rejectAll();            // tümünü reddet
CookieConsent.getPreferences();       // mevcut tercihler (karar yoksa varsayılanlar)
CookieConsent.hasConsent("analytics");// kategori için izin var mı?
CookieConsent.hasDecision();          // ziyaretçi karar verdi mi?
CookieConsent.reset();                // kaydı sil ve banner'ı yeniden göster
```

Herhangi bir öğe `data-cookie-preferences` özelliğiyle paneli açabilir:

```html
<a href="#" data-cookie-preferences>Çerez tercihleri</a>
```

### Olaylar

```js
document.addEventListener("cookieconsent:ready", (e) => {
  // e.detail = { preferences, hasDecision }
});

document.addEventListener("cookieconsent:change", (e) => {
  // e.detail = { preferences, previous, source }
  // source: "accept-all" | "reject-all" | "custom" | "reset" | "sync"
});

document.addEventListener("cookieconsent:scripterror", (e) => {
  // e.detail = { category, src }
});
```

## Tercih verisi

Tercihler yalnızca tarayıcıda, `localStorage` içinde `selotion_cookie_consent` anahtarıyla saklanır. `localStorage` kullanılamazsa birinci taraf cookie'ye düşülür. Hiçbir veri harici sunucuya gönderilmez.

```json
{
  "version": 1,
  "necessary": true,
  "analytics": false,
  "marketing": false,
  "preferences": false,
  "updatedAt": "2026-11-06T09:00:00.000Z"
}
```

Kayıt silinmişse, bozuksa veya `version` güncel değilse ziyaretçiye banner yeniden gösterilir.

## Erişilebilirlik

Klavye navigasyonu, görünür odak halkası, `role="dialog"` ve `aria-modal`, panel açılınca odak yönetimi ve Escape ile kapatma, kapanınca önceki odağa dönüş, `prefers-reduced-motion` desteği ve yalnızca renge bağlı olmayan anahtar durumları (Açık/Kapalı metni).

Kabul ve reddet düğmeleri aynı boyut ve ağırlıktadır; reddetmek için ek adım gerekmez.

## Geliştirme

```bash
npm install
npm run build   # dist/cookie-consent.min.js üretir (CSS ve dil dosyaları pakete gömülür)
npm test        # derler ve jsdom testlerini çalıştırır
```

`examples/basic.html` dosyasını tarayıcıda açarak deneyebilirsiniz (önce `npm run build`).

```
src/
├── cookie-consent.js        giriş noktası ve genel API
├── modules/                 config, storage, preferences, script-manager, renderer, events, accessibility
├── styles/cookie-consent.css
├── templates/cookie-consent.html
└── locales/                 tr.json, en.json
```

### Yeni dil eklemek

`src/locales/` içine `xx.json` ekleyin (`en.json` ile aynı anahtarlar) ve `src/cookie-consent.js` içindeki `LOCALES` nesnesine kaydedin. Eksik anahtarlar İngilizceye düşer.

## Yayın notları

- `dist/cookie-consent.min.js` tek dosyadır; CSS içine gömülüdür, ayrı CSS dosyası gerekmez.
- CDN'e `v1/` altına yükleyin. Yayınlanmış sürüm dosyalarını sonradan değiştirmeyin; `latest/` en güncel kararlı sürümü göstersin.
- Uzun süreli cache + sürüm yolu (`immutable`) önerilir. `latest/` için kısa cache kullanın.

## Lisans

MIT © Selotion