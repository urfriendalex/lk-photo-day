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
    "PASTEL MUSE - это однодневный фотодень для девушек, которым нужен не стандартный студийный сет, а цельная нежная визуальная история.",
    "Мы собираем настроение, стайлинг, макияж и кадр в одну концепцию, чтобы результат выглядел собранно, деликатно и был готов для личного бренда или соцсетей.",
  ],
  infoLines: [
    "PHOTO DAY BY",
    "@liza_karasiova",
    "@lina_tsapova",
    "@takonik.visage",
  ],
  signup: {
    title: "Стоимость — 950 PLN",
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
        "Стайлинг собирает Лиза Карасёва: мягкое pastel-настроение, женственный силуэт и чуть кинематографичная подача вместо агрессивной подиумной драматичности.",
        "Фокус на форме, фактуре и цветовой гармонии, чтобы каждый кадр выглядел цельно еще до того, как начнется съемка.",
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
        "За съемку отвечает Лина Цапова: чистый editorial-взгляд, мягкий контраст и точное чувство портретной композиции.",
        "Кадры будут ощущаться естественно, но собранно: деликатные, современные и сразу пригодные для личного бренда и соцсетей.",
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
        "Макияж создает Таня Таконик в логике Pastel Muse: сияющая кожа, деликатная скульптура и детали, которые красиво читаются в кадре.",
        "Задача не в тяжелой трансформации, а в тонкой, собранной версии образа, которая поддерживает мягкость всей истории.",
      ],
      ctaLabel: "view makeup artist",
      ctaUrl: "https://www.instagram.com/takonik.visage/",
    },
  ],
};
