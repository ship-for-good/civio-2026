import contracts from "@/assets/topic-contracts.jpg";
import budgets from "@/assets/topic-budgets.jpg";
import grants from "@/assets/topic-grants.jpg";
import mobility from "@/assets/topic-mobility.jpg";

/** Fonts oficials: https://ajuntament.barcelona.cat/transparencia/ca */
export type PopularArticle = { title: string; source: string; url: string };

export type PopularTopic = {
  id: string;
  title: string;
  desc: string;
  tags: string[];
  img: string;
  /** Mètriques de prototip (no publicades per l'Ajuntament). */
  views: number;
  trend: number;
  reason: string;
  summary: string[];
  articles: PopularArticle[];
};

export const POPULAR_TOPICS: PopularTopic[] = [
  {
    id: "contractacio",
    title: "Contractació pública",
    desc: "Licitacions, adjudicacions i formalitzacions de l'Ajuntament i entitats municipals.",
    tags: ["Contractes", "Licitacions"],
    img: contracts,
    views: 12840,
    trend: 38,
    reason:
      "Destacat al portal de transparència: el perfil de contractant i la cerca avançada a la Plataforma de Serveis de Contractació Pública de Catalunya.",
    summary: [
      "L'Ajuntament i les entitats municipals publiquen licitacions, adjudicacions i formalitzacions a la Plataforma de Serveis de Contractació Pública de Catalunya.",
      "Per cada contracte es poden consultar l'òrgan contractant, l'objecte, el pressupost de licitació, l'import d'adjudicació i la documentació de l'expedient.",
      "La cerca avançada permet filtrar per àmbit «entitats de l'administració local» i òrgan «Ajuntament de Barcelona» (o altres entitats municipals).",
    ],
    articles: [
      {
        title:
          "Contractació de l'Ajuntament: licitacions, adjudicacions, formalitzacions i meses",
        source: "Portal de Transparència — Ajuntament de Barcelona",
        url: "https://ajuntament.barcelona.cat/transparencia/ca/contractacio-de-lajuntament-de-barcelona-licitacions-adjudicacions-formalitzacions-i-meses",
      },
      {
        title: "Cerca avançada d'expedients (Plataforma de Contractació Pública)",
        source: "contractaciopublica.cat",
        url: "https://contractaciopublica.cat/ca/cerca-avancada",
      },
      {
        title: "Gestió econòmica i administrativa — contractació pública",
        source: "Portal de Transparència — Ajuntament de Barcelona",
        url: "https://ajuntament.barcelona.cat/transparencia/ca/gestio-economica-i-administrativa",
      },
    ],
  },
  {
    id: "pressupostos",
    title: "Pressupostos",
    desc: "Pressupostos anuals, execució i situació econòmico-presupostària de l'Ajuntament.",
    tags: ["Pressupost", "Despesa"],
    img: budgets,
    views: 9620,
    trend: 22,
    reason:
      "El portal destaca la proposta de pressupost municipal 2026, que supera els 4.000 M€, dins l'àmbit de gestió pressupostària.",
    summary: [
      "La portada de transparència informa que la proposta de pressupost municipal 2026 supera els 4.000 M€.",
      "L'àmbit de gestió pressupostària inclou pressupostos aprovats i executats, endeutament, autonomia fiscal, comptes de resultats i informes d'auditoria.",
      "Hi ha pressupost vigent, pressupostos d'anys anteriors, consolidats d'entitats instrumentals i informes d'avaluació (p. ex. AIReF sobre pressupostos 2026 de corporacions locals).",
    ],
    articles: [
      {
        title: "Portal de Transparència — inici (pressupost municipal 2026)",
        source: "Portal de Transparència — Ajuntament de Barcelona",
        url: "https://ajuntament.barcelona.cat/transparencia/ca",
      },
      {
        title: "Gestió pressupostària i financera",
        source: "Portal de Transparència — Ajuntament de Barcelona",
        url: "https://ajuntament.barcelona.cat/transparencia/ca/gestio-economica-i-administrativa",
      },
      {
        title: "Acció de govern — programa d'actuació municipal 2023-2027",
        source: "Portal de Transparència — Ajuntament de Barcelona",
        url: "https://ajuntament.barcelona.cat/transparencia/ca/accio-de-govern",
      },
    ],
  },
  {
    id: "subvencions",
    title: "Subvencions",
    desc: "Convocatòries, ajudes concedides i dades obertes de subvencions municipals.",
    tags: ["Subvencions", "Ajudes"],
    img: grants,
    views: 7110,
    trend: 12,
    reason:
      "Ampli ventall de convocatòries 2026 publicades; el bloc de subvencions de districte i ciutat concentra la major part de la dotació.",
    summary: [
      "L'Ajuntament ofereix subvencions des de l'àmbit social fins al comerç, cultura o juventut; el tram de districte i ciutat representa prop del 80% del total.",
      "Al portal de transparència hi ha un buscador de subvencions atorgades (pagaments dels últims cinc anys) i fitxers per a entitats no incloses al buscador (p. ex. Barcelona Activa, habitatge, urbanisme).",
      "La Comissió de Govern va prorrogar el Pla estratègic de subvencions 2021-2023 per a les anualitats 2025-26 (24 d'octubre de 2024).",
    ],
    articles: [
      {
        title: "Subvencions — convocatòries i tràmits",
        source: "Ajuntament de Barcelona",
        url: "https://ajuntament.barcelona.cat/ca/informacio-administrativa/subvencions",
      },
      {
        title: "Gestió econòmica — subvencions i buscador d'atorgades",
        source: "Portal de Transparència — Ajuntament de Barcelona",
        url: "https://ajuntament.barcelona.cat/transparencia/ca/gestio-economica-i-administrativa",
      },
      {
        title: "Subvencions atorgades a entitats (dataset obert)",
        source: "Open Data BCN",
        url: "https://opendata-ajuntament.barcelona.cat/data/ca/dataset/subvencions_entitats_nfge",
      },
    ],
  },
  {
    id: "mobilitat",
    title: "Mobilitat",
    desc: "Plans de mobilitat, infraestructures i informació relacionada amb el transport a la ciutat.",
    tags: ["Mobilitat", "Transport"],
    img: mobility,
    views: 5430,
    trend: -4,
    reason:
      "Publicat al portal d'urbanisme i ecologia el conveni i el pla de mobilitat per als partits al Estadi Olímpic Lluís Companys.",
    summary: [
      "El portal d'urbanisme recull informació sobre obres d'infraestructures i enllaça al servei d'informació d'obres i al cercador «Obras en el plano».",
      "Hi consta el conveni entre l'Ajuntament i el FC Barcelona sobre mobilitat i serveis urbans per als partits a l'Estadi Olímpic (aprovat per la Comissió de Govern el 22 de desembre de 2022).",
      "El pla de mobilitat figura com a annex I d'aquest conveni, en el context de les obres de remodelació del Camp Nou.",
    ],
    articles: [
      {
        title: "Urbanisme i ecologia — plans, obres i mobilitat",
        source: "Portal de Transparència — Ajuntament de Barcelona",
        url: "https://ajuntament.barcelona.cat/transparencia/ca/urbanisme-i-ecologia",
      },
      {
        title: "Mobilitat — informació i serveis",
        source: "barcelona.cat",
        url: "https://www.barcelona.cat/mobilitat/ca",
      },
      {
        title: "Acció de govern — planificació municipal 2023-2027",
        source: "Portal de Transparència — Ajuntament de Barcelona",
        url: "https://ajuntament.barcelona.cat/transparencia/ca/accio-de-govern",
      },
    ],
  },
  {
    id: "medi-ambient",
    title: "Medi ambient",
    desc: "Qualitat de l'aire, soroll, impacte ambiental i informació ambiental municipal.",
    tags: ["Clima", "Sostenibilitat"],
    img: budgets,
    views: 3980,
    trend: 9,
    reason:
      "L'àmbit d'urbanisme i ecologia centralitza informes d'impacte ambiental i enllaços a la qualitat de l'aire i el mapa de soroll.",
    summary: [
      "Els informes d'impacte ambiental avaluen les conseqüències ambientals dels projectes i proposen mesures correctores; s'accedeix des del portal d'informació urbanística.",
      "El portal publica recursos de qualitat de l'aire i mapa de soroll, amb dades també disponibles a Barcelona Dades Obertes.",
      "L'Agència de Salut Pública de Barcelona gestiona, per encàrrec municipal, vigilància epidemiològica, aigua de consum, indústries alimentàries i plagues urbanes.",
    ],
    articles: [
      {
        title: "Qualitat de l'aire",
        source: "Portal de Transparència — Ajuntament de Barcelona",
        url: "https://ajuntament.barcelona.cat/transparencia/ca/qualitat-de-laire",
      },
      {
        title: "Urbanisme i ecologia — impacte ambiental i informació ambiental",
        source: "Portal de Transparència — Ajuntament de Barcelona",
        url: "https://ajuntament.barcelona.cat/transparencia/ca/urbanisme-i-ecologia",
      },
      {
        title: "Barcelona Dades Obertes — recursos geogràfics i ambientals",
        source: "Open Data BCN",
        url: "https://opendata-ajuntament.barcelona.cat/",
      },
    ],
  },
  {
    id: "habitatge",
    title: "Habitatge",
    desc: "Polítiques de vivenda, rehabilitació i subvencions de l'Institut Municipal de l'Habitatge.",
    tags: ["Habitatge", "Lloguer"],
    img: contracts,
    views: 2870,
    trend: 17,
    reason:
      "Les subvencions de l'Institut Municipal de l'Habitatge i la Rehabilitació es publiquen fora del buscador general, amb fitxers dedicats a transparència.",
    summary: [
      "L'Institut Municipal de l'Habitatge i la Rehabilitació (IMHAB) és una de les entitats amb subvencions no incloses al buscador general de transparència.",
      "El web municipal d'habitatge concentra informació sobre polítiques de vivenda, rehabilitació i serveis relacionats.",
      "Les convocatòries de subvencions municipals (incloent línies socials i de barri) es consulten al portal de tràmits de subvencions.",
    ],
    articles: [
      {
        title: "Habitatge i rehabilitació — IMHAB",
        source: "habitatge.barcelona",
        url: "https://www.habitatge.barcelona/ca",
      },
      {
        title: "Subvencions atorgades no incloses al buscador (incl. habitatge)",
        source: "Portal de Transparència — Ajuntament de Barcelona",
        url: "https://ajuntament.barcelona.cat/transparencia/ca/gestio-economica-i-administrativa",
      },
      {
        title: "Convocatòries de subvencions",
        source: "Ajuntament de Barcelona",
        url: "https://ajuntament.barcelona.cat/ca/informacio-administrativa/subvencions",
      },
    ],
  },
];
