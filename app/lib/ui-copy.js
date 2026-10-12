import { defaultLanguage, normalizeLanguage } from "./languages";

const copy = {
  pl: {
    locale: "pl-PL",
    languageName: "Polski",
    home: {
      eyebrow: "BHP - wybierz typ rejestracji",
      title: "Rejestracja BHP",
      subtitle: "Przygotuj się do bezpiecznej wizyty w zakładzie.",
      guestDescription: "Rejestracja i szkolenie przed wizytą w zakładzie.",
      subcontractorDescription: "Rejestracja i szkolenie przed rozpoczęciem prac.",
      start: "Rozpocznij rejestrację",
      languageLabel: "Język szkolenia",
      guest: "Dla gości",
      subcontractor: "Dla podwykonawców",
    },
    training: {
      progressLabel: "Etapy szkolenia",
      steps: ["Dane", "Film", "Quiz", "Gotowe"],
      audience: {
        guest: "gości",
        subcontractor: "podwykonawców",
      },
      chip: ({ audienceLabel }) => `BHP dla ${audienceLabel} zakładu`,
      pageTitle: {
        guest: "BHP Goście",
        subcontractor: "BHP Podwykonawcy",
      },
      languageVersion: ({ languageLabel }) => `Wersja językowa: ${languageLabel}`,
      visitorFallback: "Gosciu",
      form: {
        eyebrow: "Krok 1",
        title: {
          guest: "Dane gościa",
          subcontractor: "Dane podwykonawcy",
        },
        firstName: "Imię",
        lastName: "Nazwisko",
        phone: "Nr telefonu",
        phoneHint: "Np. +48 (123) 456-789. Cyfry, spacje i znaki ( ) + -.",
        phoneError: "Numer telefonu musi zawierać cyfrę. Dozwolone są tylko cyfry, spacje i znaki ( ) + -.",
        company: "Nazwa firmy",
        visitPurpose: "Cel przyjazdu",
        visitPurposePlaceholder: "Np. serwis, dostawa, spotkanie",
        submit: "Rozpocznij szkolenie",
      },
      video: {
        unavailable: "Film szkoleniowy jest niedostępny. Skontaktuj się z pracownikiem BHP.",
        eyebrow: "Krok 2",
        title: "Film szkoleniowy",
        fullscreen: "Pelny ekran",
        loadingQuiz: "Losowanie pytan...",
        goToQuiz: "Przejdz do quizu",
        demoAria: "Demonstracyjne szkolenie BHP",
        demoSlides: [
          "Poruszaj sie tylko wyznaczonymi ciagami komunikacyjnymi.",
          "Stosuj srodki ochrony osobistej wymagane w danej strefie.",
          "Nie dotykaj maszyn, instalacji ani materialow bez zgody opiekuna.",
          "W razie alarmu przerwij wizyte i kieruj sie do punktu zbiorki.",
          "Kazdy wypadek, uraz lub zagrozenie zglos natychmiast opiekunowi.",
        ],
        inProgress: "Trwa szkolenie...",
        completed: "Szkolenie zakonczone.",
      },
      quiz: {
        eyebrow: "Krok 3",
        title: "Quiz BHP",
        subtitle:
          "Aby zostac dopisanym do bazy, odpowiedz poprawnie na 5 pytan.",
        notEnoughQuestions:
          "Dla tej wersji jezykowej trzeba dodac minimum 5 pytan w panelu admina.",
        result: ({ score }) =>
          `Wynik: ${score}/5. Quiz trzeba zaliczyc bezblednie.`,
        submit: "Sprawdz odpowiedzi",
      },
      success: {
        eyebrow: "Gotowe",
        title: ({ visitorName }) => `${visitorName}, szkolenie zostalo zaliczone`,
        subtitle:
          "Dane zostaly zapisane w bazie. Ochrona zobaczy wpis w panelu wejsc.",
        blacklist: ({ reason }) =>
          `Ta osoba jest oznaczona na black list. Powod: ${reason}.`,
        noReason: "brak opisu",
        validUntil: "Wazna do",
        reset: "Zarejestruj kolejnego goscia",
      },
    },
  },
  en: {
    locale: "en-US",
    languageName: "English",
    home: {
      eyebrow: "H&S - choose registration type",
      title: "H&S Registration",
      subtitle: "Prepare for a safe visit to the site.",
      guestDescription: "Register and complete your training before visiting the site.",
      subcontractorDescription: "Register and complete your training before starting work.",
      start: "Start registration",
      languageLabel: "Training language",
      guest: "For guests",
      subcontractor: "For subcontractors",
    },
    training: {
      progressLabel: "Training steps",
      steps: ["Details", "Video", "Quiz", "Complete"],
      audience: {
        guest: "site guests",
        subcontractor: "subcontractors",
      },
      chip: ({ audienceLabel }) => `H&S training for ${audienceLabel}`,
      pageTitle: {
        guest: "H&S Guests",
        subcontractor: "H&S Subcontractors",
      },
      languageVersion: ({ languageLabel }) => `Language version: ${languageLabel}`,
      visitorFallback: "Guest",
      form: {
        eyebrow: "Step 1",
        title: {
          guest: "Guest details",
          subcontractor: "Subcontractor details",
        },
        firstName: "First name",
        lastName: "Last name",
        phone: "Phone number",
        phoneHint: "E.g. +48 (123) 456-789. Digits, spaces and ( ) + - only.",
        phoneError: "The phone number must contain a digit. Only digits, spaces and ( ) + - are allowed.",
        company: "Company name",
        visitPurpose: "Purpose of visit",
        visitPurposePlaceholder: "E.g. service, delivery, meeting",
        submit: "Start training",
      },
      video: {
        unavailable: "The training video is unavailable. Please contact the safety team.",
        eyebrow: "Step 2",
        title: "Training video",
        fullscreen: "Full screen",
        loadingQuiz: "Selecting questions...",
        goToQuiz: "Go to quiz",
        demoAria: "Demo H&S training",
        demoSlides: [
          "Move only along designated walkways.",
          "Use the personal protective equipment required in each area.",
          "Do not touch machines, installations or materials without permission.",
          "If an alarm sounds, stop your visit and go to the assembly point.",
          "Report every accident, injury or hazard to your host immediately.",
        ],
        inProgress: "Training in progress...",
        completed: "Training completed.",
      },
      quiz: {
        eyebrow: "Step 3",
        title: "H&S Quiz",
        subtitle: "To be added to the database, answer all 5 questions correctly.",
        notEnoughQuestions:
          "At least 5 questions must be added in the admin panel for this language version.",
        result: ({ score }) =>
          `Score: ${score}/5. The quiz must be passed without mistakes.`,
        submit: "Check answers",
      },
      success: {
        eyebrow: "Done",
        title: ({ visitorName }) => `${visitorName}, the training has been passed`,
        subtitle:
          "The details have been saved in the database. Security will see the entry in the gate panel.",
        blacklist: ({ reason }) =>
          `This person is marked on the blacklist. Reason: ${reason}.`,
        noReason: "no description",
        validUntil: "Valid until",
        reset: "Register another guest",
      },
    },
  },
  de: {
    locale: "de-DE",
    languageName: "Deutsch",
    home: {
      eyebrow: "Arbeitsschutz - Registrierungsart wählen",
      title: "Arbeitsschutz-Registrierung",
      subtitle: "Bereiten Sie sich auf einen sicheren Besuch im Werk vor.",
      guestDescription: "Registrierung und Schulung vor Ihrem Besuch im Werk.",
      subcontractorDescription: "Registrierung und Schulung vor Beginn der Arbeiten.",
      start: "Registrierung starten",
      languageLabel: "Schulungssprache",
      guest: "Für Gäste",
      subcontractor: "Für Subunternehmer",
    },
    training: {
      progressLabel: "Schulungsschritte",
      steps: ["Daten", "Video", "Quiz", "Eintrag"],
      audience: {
        guest: "Gaeste",
        subcontractor: "Subunternehmer",
      },
      chip: ({ audienceLabel }) => `Arbeitsschutz fuer ${audienceLabel}`,
      pageTitle: {
        guest: "Arbeitsschutz Gaeste",
        subcontractor: "Arbeitsschutz Subunternehmer",
      },
      languageVersion: ({ languageLabel }) =>
        `Sprachversion: ${languageLabel}`,
      visitorFallback: "Gast",
      form: {
        eyebrow: "Schritt 1",
        title: {
          guest: "Gaestedaten",
          subcontractor: "Daten des Subunternehmers",
        },
        firstName: "Vorname",
        lastName: "Nachname",
        phone: "Telefonnummer",
        phoneHint: "Z. B. +49 (123) 456-789. Nur Ziffern, Leerzeichen und ( ) + -.",
        phoneError: "Die Telefonnummer muss eine Ziffer enthalten. Erlaubt sind nur Ziffern, Leerzeichen und ( ) + -.",
        company: "Firmenname",
        visitPurpose: "Zweck des Besuchs",
        visitPurposePlaceholder: "Z. B. Service, Lieferung, Besprechung",
        submit: "Schulung starten",
      },
      video: {
        unavailable: "Das Schulungsvideo ist nicht verfügbar. Bitte wenden Sie sich an das Sicherheitsteam.",
        eyebrow: "Schritt 2",
        title: "Schulungsvideo",
        fullscreen: "Vollbild",
        loadingQuiz: "Fragen werden ausgewaehlt...",
        goToQuiz: "Zum Quiz",
        demoAria: "Demo-Arbeitsschutzschulung",
        demoSlides: [
          "Bewegen Sie sich nur auf den gekennzeichneten Wegen.",
          "Tragen Sie die in der jeweiligen Zone vorgeschriebene Schutzausruestung.",
          "Beruehren Sie Maschinen, Anlagen oder Materialien nicht ohne Erlaubnis.",
          "Bei Alarm beenden Sie den Besuch und gehen Sie zum Sammelpunkt.",
          "Melden Sie jeden Unfall, jede Verletzung oder Gefahr sofort Ihrem Ansprechpartner.",
        ],
        inProgress: "Schulung laeuft...",
        completed: "Schulung abgeschlossen.",
      },
      quiz: {
        eyebrow: "Schritt 3",
        title: "Arbeitsschutz-Quiz",
        subtitle:
          "Um in die Datenbank eingetragen zu werden, beantworten Sie alle 5 Fragen richtig.",
        notEnoughQuestions:
          "Fuer diese Sprachversion muessen im Admin-Panel mindestens 5 Fragen hinzugefuegt werden.",
        result: ({ score }) =>
          `Ergebnis: ${score}/5. Das Quiz muss fehlerfrei bestanden werden.`,
        submit: "Antworten pruefen",
      },
      success: {
        eyebrow: "Fertig",
        title: ({ visitorName }) =>
          `${visitorName}, die Schulung wurde bestanden`,
        subtitle:
          "Die Daten wurden in der Datenbank gespeichert. Der Sicherheitsdienst sieht den Eintrag im Eingangspanel.",
        blacklist: ({ reason }) =>
          `Diese Person ist auf der Blacklist markiert. Grund: ${reason}.`,
        noReason: "keine Beschreibung",
        validUntil: "Gueltig bis",
        reset: "Weiteren Gast registrieren",
      },
    },
  },
  tr: {
    locale: "tr-TR",
    languageName: "Türkçe",
    home: {
      eyebrow: "ISG - kayit turunu secin",
      title: "ISG Kaydi",
      subtitle: "Tesise güvenli bir ziyaret için hazırlanın.",
      guestDescription: "Tesisi ziyaret etmeden önce kayıt olun ve eğitimi tamamlayın.",
      subcontractorDescription: "Çalışmaya başlamadan önce kayıt olun ve eğitimi tamamlayın.",
      start: "Kaydı başlat",
      languageLabel: "Eğitim dili",
      guest: "Ziyaretciler icin",
      subcontractor: "Alt yukleniciler icin",
    },
    training: {
      progressLabel: "Eğitim adımları",
      steps: ["Bilgiler", "Video", "Quiz", "Kayit"],
      audience: {
        guest: "ziyaretciler",
        subcontractor: "alt yukleniciler",
      },
      chip: ({ audienceLabel }) => `${audienceLabel} icin ISG egitimi`,
      pageTitle: {
        guest: "ISG Ziyaretciler",
        subcontractor: "ISG Alt Yukleniciler",
      },
      languageVersion: ({ languageLabel }) => `Dil versiyonu: ${languageLabel}`,
      visitorFallback: "Ziyaretci",
      form: {
        eyebrow: "Adim 1",
        title: {
          guest: "Ziyaretci bilgileri",
          subcontractor: "Alt yuklenici bilgileri",
        },
        firstName: "Ad",
        lastName: "Soyad",
        phone: "Telefon numarasi",
        phoneHint: "Örn. +90 (123) 456-789. Yalnızca rakam, boşluk ve ( ) + -.",
        phoneError: "Telefon numarası en az bir rakam içermelidir. Yalnızca rakam, boşluk ve ( ) + - kullanılabilir.",
        company: "Sirket adi",
        visitPurpose: "Ziyaret amaci",
        visitPurposePlaceholder: "Orn. servis, teslimat, toplanti",
        submit: "Egitimi baslat",
      },
      video: {
        unavailable: "Eğitim videosu kullanılamıyor. Lütfen iş güvenliği ekibiyle iletişime geçin.",
        eyebrow: "Adim 2",
        title: "Egitim videosu",
        fullscreen: "Tam ekran",
        loadingQuiz: "Sorular seciliyor...",
        goToQuiz: "Quize gec",
        demoAria: "Demo ISG egitimi",
        demoSlides: [
          "Sadece belirlenmis yaya yollarini kullanin.",
          "Her bolgede gerekli olan kisisel koruyucu ekipmani kullanin.",
          "Izin almadan makinelere, tesisatlara veya malzemelere dokunmayin.",
          "Alarm durumunda ziyareti durdurun ve toplanma noktasina gidin.",
          "Her kazayi, yaralanmayi veya tehlikeyi hemen sorumlu kisiye bildirin.",
        ],
        inProgress: "Egitim devam ediyor...",
        completed: "Egitim tamamlandi.",
      },
      quiz: {
        eyebrow: "Adim 3",
        title: "ISG Quizi",
        subtitle: "Veri tabanina eklenmek icin 5 sorunun tamamini dogru cevaplayin.",
        notEnoughQuestions:
          "Bu dil versiyonu icin admin panelinde en az 5 soru eklenmelidir.",
        result: ({ score }) =>
          `Sonuc: ${score}/5. Quiz hatasiz gecilmelidir.`,
        submit: "Cevaplari kontrol et",
      },
      success: {
        eyebrow: "Tamam",
        title: ({ visitorName }) => `${visitorName}, egitim basariyla tamamlandi`,
        subtitle:
          "Bilgiler veri tabanina kaydedildi. Guvenlik giris panelinde kaydi gorecek.",
        blacklist: ({ reason }) =>
          `Bu kisi black list olarak isaretlenmis. Sebep: ${reason}.`,
        noReason: "aciklama yok",
        validUntil: "Gecerlilik tarihi",
        reset: "Yeni ziyaretci kaydet",
      },
    },
  },
};

export function getUiCopy(language) {
  return copy[normalizeLanguage(language)] || copy[defaultLanguage];
}
