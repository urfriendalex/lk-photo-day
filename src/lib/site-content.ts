export type TopicKey = "style" | "photo" | "makeup";

export type TopicContent = {
  key: TopicKey;
  label: string;
  person: string;
  personUrl: string;
  description: string[];
  ctaLabel: string;
  ctaUrl: string;
};

export type SiteContent = {
  seo: {
    title: string;
    description: string;
  };
  projectTitle: string;
  location: string;
  date: string;
  /** Short price for the header meta strip (keep in sync with signup pricing). */
  priceLabel: string;
  registerLabel: string;
  introText: string[];
  infoLines: string[];
  signup: {
    title: string;
    /** Shown under the price title, lighter weight (e.g. prepayment terms). */
    titleSubline: string;
    intro: string[];
    fields: {
      nameLabel: string;
      namePlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      instagramLabel: string;
      instagramPlaceholder: string;
    };
    button: string;
    helperText: string;
  };
  topics: TopicContent[];
};

export const siteContent: SiteContent = {
  seo: {
    title: "PASTEL MUSE",
    description:
      "PASTEL MUSE is a one-day photo experience in Warsaw with styling, makeup, and editorial photography for a soft, cohesive visual story built for personal branding and social media.",
  },
  projectTitle: "PASTEL MUSE",
  location: "WARSAW",
  date: "26.04.2026",
  priceLabel: "950 PLN",
  registerLabel: "ЗАРЕГИСТРИРОВАТЬСЯ",
  introText: [
    "26 апреля, STUDIO ISKRA, Czechowicka 4, 04-218 Warszawa.",
    "Фотодень в пастельной эстетике про цвет, настроение и тебя. Нежные оттенки, весенний свет и образы, в которых ты чувствуешь себя по-настоящему красивой.",
    "С тобой работает команда стилиста, визажиста и фотографа. Два образа, собранных индивидуально, макияж, и кадры, к которым захочется возвращаться.",
    "Это день, в котором ты становишься музой.",
    "Стоимость 950 zł",
    "Предоплата 50% для бронирования места. Количество мест строго ограничено.",
  ],
  infoLines: [
    "PHOTO DAY BY",
    "@liza_karasiova",
    "@lina_tsapova",
    "@takonik.visage",
  ],
  signup: {
    title: "Стоимость — 950 PLN",
    titleSubline: "Предоплата — 50%",
    intro: [
      "В стоимость входит съемка, макияж, стайлинг и готовая\u00A0визуальная\u00A0история\u00A0в\u00A0эстетике\u00A0Pastel\u00A0Muse.",
      "После обработки заявки мы свяжемся с вами в Instagram, отправим детали и подскажем следующий шаг.",
    ],
    fields: {
      nameLabel: "Name",
      namePlaceholder: "Name",
      emailLabel: "Email",
      emailPlaceholder: "Email",
      instagramLabel: "Instagram handle",
      instagramPlaceholder: "@yourinstagramhandle",
    },
    button: "ОСТАВИТЬ ЗАЯВКУ",
    helperText: "После заявки мы свяжемся с вами в Instagram.",
  },
  topics: [
    {
      key: "style",
      label: "STYLE",
      person: "@liza_karasiova",
      personUrl: "https://www.instagram.com/liza_karasiova/",
      description: [
        "Это съёмка про нежность, лёгкость и весеннее состояние. Про цвет, который подчёркивает, раскрывает и делает тебя ещё ярче.",
        "У каждой девушки будет два образа, собранных индивидуально, с учётом внешности, настроения и ощущений.",
        "Вещи подбираются под каждую участницу, при желании можно добавить что-то из своего гардероба и сочетать с новыми элементами.",
        "Ниже можно посмотреть примеры, чтобы почувствовать стилистику съёмки.",
        "Все детали обсуждаются лично, чтобы в итоге получилось по-настоящему твоё.",
      ],
      ctaLabel: "view stylist",
      ctaUrl: "https://www.instagram.com/liza_karasiova/",
    },
    {
      key: "photo",
      label: "PHOTO",
      person: "@lina_tsapova",
      personUrl: "https://www.instagram.com/lina_tsapova/",
      description: [
        "Для меня фотография — это не про сантиметры, формы или \"идеальность\". это про энергию, ощущение. про то, что невозможно сыграть.",
        "тебе не нужно быть худой, \"правильной\" или соответствовать каким-то стандартам, чтобы почувствовать себя главной героиней своей истории. Я вижу глубже — и стараюсь уловить именно твою суть, чтобы передать её через призму камеры.",
        "В плёночной фотографии нет бесконечных дублей. Ограниченное число кадров делает процесс честным, живым, настоящим. В результате ты получаешь 15–20 готовых кадров, которые будут напоминать не только о том, как ты выглядишь, но и о том, как ты себя чувствуешь.",
      ],
      ctaLabel: "view photographer",
      ctaUrl: "https://www.instagram.com/lina_tsapova/",
    },
    {
      key: "makeup",
      label: "MAKEUP",
      person: "@takonik.visage",
      personUrl: "https://www.instagram.com/takonik.visage/",
      description: [
        "Вдохновение для макияжа в стилистике Pastel Muse: сияющая кожа, деликатная скульптура и детали, которые красиво читаются в кадре.",
        "Задача не в тяжелой трансформации, а в тонкой, собранной версии образа, которая поддерживает мягкость всей истории.",
      ],
      ctaLabel: "view makeup artist",
      ctaUrl: "https://www.instagram.com/takonik.visage/",
    },
  ],
};
