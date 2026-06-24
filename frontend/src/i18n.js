import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "nav": {
        "home": "Home",
        "events": "Events",
        "dashboard": "Dashboard",
        "search": "Search",
        "login": "Login",
        "register": "Register"
      },
      "home": {
        "hero_title": "Discover Unforgettable Experiences",
        "hero_subtitle": "Find, book, and create events that leave lasting memories.",
        "search_btn": "Find Events",
        "create_btn": "Create Event",
        "browse_category": "Browse by Category",
        "recommended": "Recommended for You",
        "trending": "Trending Events",
        "featured": "Featured Events",
        "latest": "Latest Events",
        "view_all": "View All",
        "no_trending": "No trending events yet.",
        "no_featured": "No featured events yet. Admins can feature events from the dashboard.",
        "no_events": "No events yet. Be the first to create one!"
      }
    }
  },
  es: {
    translation: {
      "nav": {
        "home": "Inicio",
        "events": "Eventos",
        "dashboard": "Panel",
        "search": "Buscar",
        "login": "Iniciar Sesión",
        "register": "Registrarse"
      },
      "home": {
        "hero_title": "Descubre Experiencias Inolvidables",
        "hero_subtitle": "Encuentra, reserva y crea eventos que dejan recuerdos duraderos.",
        "search_btn": "Buscar Eventos",
        "create_btn": "Crear Evento",
        "browse_category": "Buscar por Categoría",
        "recommended": "Recomendado para Ti",
        "trending": "Eventos en Tendencia",
        "featured": "Eventos Destacados",
        "latest": "Últimos Eventos",
        "view_all": "Ver Todo",
        "no_trending": "Aún no hay eventos en tendencia.",
        "no_featured": "Aún no hay eventos destacados.",
        "no_events": "Aún no hay eventos. ¡Sé el primero en crear uno!"
      }
    }
  },
  fr: {
    translation: {
      "nav": {
        "home": "Accueil",
        "events": "Événements",
        "dashboard": "Tableau de Bord",
        "search": "Rechercher",
        "login": "Se Connecter",
        "register": "S'inscrire"
      },
      "home": {
        "hero_title": "Découvrez des Expériences Inoubliables",
        "hero_subtitle": "Trouvez, réservez et créez des événements qui laissent des souvenirs durables.",
        "search_btn": "Trouver des Événements",
        "create_btn": "Créer un Événement",
        "browse_category": "Parcourir par Catégorie",
        "recommended": "Recommandé pour Vous",
        "trending": "Événements Tendances",
        "featured": "Événements en Vedette",
        "latest": "Derniers Événements",
        "view_all": "Voir Tout",
        "no_trending": "Pas d'événements tendances pour l'instant.",
        "no_featured": "Pas d'événements en vedette pour l'instant.",
        "no_events": "Pas d'événements pour le moment. Soyez le premier à en créer un !"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
