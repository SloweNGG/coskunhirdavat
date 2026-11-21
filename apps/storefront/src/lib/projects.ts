/**
 * "Ne yapacaksınız?" job guides: a shopping list and short steps per job.
 * Each item links to a product search (`query`). Once real products exist an
 * item can also point at a product handle for one-click add to cart.
 */
export type ProjectItem = {
  name: string
  note?: string
  query: string
}

export type Project = {
  slug: string
  title: string
  summary: string
  icon: string
  difficulty: "Kolay" | "Orta" | "Zor"
  duration: string
  items: ProjectItem[]
  steps: string[]
  warning?: string
}

export const PROJECTS: Project[] = [
  {
    slug: "duvara-raf-asma",
    title: "Duvara raf asacağım",
    summary:
      "Betona, tuğlaya ya da alçıpana sağlam bir raf asmak için gereken her şey.",
    icon: "tools",
    difficulty: "Kolay",
    duration: "30 dk",
    items: [
      { name: "Darbeli matkap", note: "Beton ve tuğla için darbeli mod şart", query: "matkap" },
      { name: "Matkap ucu (6-8 mm)", note: "Dübel çapıyla aynı olmalı", query: "matkap ucu" },
      { name: "Plastik dübel", note: "Alçıpan için alçıpan dübeli seçin", query: "dübel" },
      { name: "Vida", note: "Dübele uygun boy ve kalınlıkta", query: "vida" },
      { name: "Raf konsolu", note: "Rafın taşıyacağı yüke göre", query: "konsol" },
      { name: "Su terazisi", query: "su terazisi" },
      { name: "Şerit metre", query: "şerit metre" },
    ],
    steps: [
      "Rafın yerini ölçün, kurşun kalemle işaretleyin.",
      "Duvarda kablo ya da boru olmadığından emin olun.",
      "Dübel çapında uçla, dübel boyundan biraz derin delin.",
      "Dübelleri yerleştirin, konsolları vidalayın.",
      "Su terazisiyle kontrol edip rafı oturtun.",
    ],
  },
  {
    slug: "musluk-degistirme",
    title: "Musluğu değiştireceğim",
    summary:
      "Damlatan ya da eskiyen lavabo veya mutfak musluğunu kendiniz yenileyin.",
    icon: "wrench",
    difficulty: "Orta",
    duration: "1 saat",
    items: [
      { name: "Musluk / batarya", note: "Lavabo ya da eviye tipine göre", query: "batarya" },
      { name: "Ara musluk (ara vana)", query: "ara musluk" },
      { name: "Flex hortum", note: "Uzunluğu eskisini ölçerek seçin", query: "flex hortum" },
      { name: "Teflon bant", query: "teflon bant" },
      { name: "Conta seti", query: "conta" },
      { name: "Ayarlı anahtar", query: "ayarlı anahtar" },
      { name: "Su pompa pensesi", query: "pense" },
    ],
    steps: [
      "Ana vanayı ya da ara muslukları kapatın.",
      "Eski bataryanın hortumlarını ve bağlantı somununu sökün.",
      "Dişlere saat yönünde 6-8 tur teflon bant sarın.",
      "Yeni bataryayı yerleştirip hortumları bağlayın.",
      "Suyu açıp bağlantı noktalarında sızıntı kontrol edin.",
    ],
  },
  {
    slug: "oda-boyama",
    title: "Odamı boyayacağım",
    summary:
      "Temiz ve düzgün bir boya işi için hazırlıktan son kata kadar liste.",
    icon: "swatch",
    difficulty: "Kolay",
    duration: "1 gün",
    items: [
      { name: "İç cephe boyası", note: "1 litre yaklaşık 8-10 m² (tek kat)", query: "iç cephe boya" },
      { name: "Astar", note: "Yeni sıva ya da koyu renk üstü için", query: "astar" },
      { name: "Boya rulosu ve tava", query: "rulo" },
      { name: "Fırça", note: "Köşeler ve kenarlar için", query: "fırça" },
      { name: "Maskeleme bandı", query: "maskeleme bandı" },
      { name: "Koruyucu örtü / naylon", query: "örtü" },
      { name: "Alçı / macun ve spatula", note: "Çatlak ve delikler için", query: "macun" },
      { name: "Zımpara", query: "zımpara" },
    ],
    steps: [
      "Eşyaları örtün, kenarları maskeleme bandıyla kapatın.",
      "Çatlakları macunlayın, kuruyunca zımparalayın.",
      "Gerekiyorsa bir kat astar sürün.",
      "Önce kenarları fırçayla, sonra yüzeyleri ruloyla boyayın.",
      "İlk kat kuruduktan sonra ikinci katı atın.",
    ],
  },
  {
    slug: "priz-anahtar-degistirme",
    title: "Priz ya da anahtar değiştireceğim",
    summary:
      "Kırılan veya eskiyen priz ve elektrik anahtarlarını güvenle yenileyin.",
    icon: "plug",
    difficulty: "Orta",
    duration: "20 dk",
    items: [
      { name: "Priz / anahtar", note: "Mevcut seriyle uyumlu olsun", query: "priz" },
      { name: "Kontrol kalemi", query: "kontrol kalemi" },
      { name: "İzoleli tornavida seti", query: "izoleli tornavida" },
      { name: "Kablo soyma pensesi", query: "kablo soyma" },
      { name: "Klemens", query: "klemens" },
      { name: "İzole bant", query: "izole bant" },
    ],
    steps: [
      "Sigortayı kapatın, kontrol kalemiyle elektrik olmadığını doğrulayın.",
      "Kapak ve vidaları sökün, kabloların yerini fotoğraflayın.",
      "Kabloları yeni prize aynı sırayla bağlayın.",
      "Prizi kutuya oturtup kapağı takın.",
      "Sigortayı açıp çalıştığını kontrol edin.",
    ],
    warning:
      "Elektrik işlerinde emin değilseniz mutlaka bir elektrikçiye danışın. Sigortayı kapatmadan çalışmayın.",
  },
  {
    slug: "bahce-sulama",
    title: "Bahçeye sulama kuracağım",
    summary:
      "Bahçeniz ya da saksılarınız için hortumdan damla sulamaya kadar.",
    icon: "sun",
    difficulty: "Kolay",
    duration: "2 saat",
    items: [
      { name: "Bahçe hortumu", query: "hortum" },
      { name: "Hortum bağlantı seti / rakor", query: "rakor" },
      { name: "Damla sulama borusu", query: "damla sulama" },
      { name: "Damlatıcı", query: "damlatıcı" },
      { name: "Sulama zamanlayıcısı", note: "Tatilde bile otomatik sulama", query: "zamanlayıcı" },
      { name: "Fıskiye", query: "fıskiye" },
    ],
    steps: [
      "Sulanacak alanı ölçüp hortum güzergâhını belirleyin.",
      "Musluğa zamanlayıcıyı, ona ana hortumu bağlayın.",
      "Damla borusunu bitki sıralarının yanından geçirin.",
      "Damlatıcıları bitkilerin dibine gelecek şekilde takın.",
      "Suyu açıp tüm hattı kontrol edin.",
    ],
  },
  {
    slug: "kapi-kilidi-degistirme",
    title: "Kapı kilidini değiştireceğim",
    summary:
      "Taşınma sonrası ya da anahtar kaybında barel kilidi kendiniz değiştirin.",
    icon: "key",
    difficulty: "Kolay",
    duration: "15 dk",
    items: [
      { name: "Barel (silindir) kilit", note: "İki taraf ölçüsünü ayrı ayrı alın", query: "barel" },
      { name: "Tornavida", query: "tornavida" },
      { name: "Kumpas ya da şerit metre", query: "kumpas" },
      { name: "Yağlayıcı sprey", query: "yağlayıcı sprey" },
    ],
    steps: [
      "Kapının yan yüzündeki barel vidasını sökün.",
      "Anahtarı hafif çevirerek bareli dışarı çekin.",
      "Bareli ortadaki vidadan iki yöne ölçün (ör. 30/40 mm).",
      "Aynı ölçüdeki yeni bareli takıp vidayı sıkın.",
      "Anahtarla birkaç kez deneyip kilidi yağlayın.",
    ],
  },
]

export const getProject = (slug: string) =>
  PROJECTS.find((project) => project.slug === slug)
