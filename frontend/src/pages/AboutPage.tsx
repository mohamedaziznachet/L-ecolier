import { Heart, Award, Users, Target, MapPin, Phone, Mail, Sparkles, ShieldCheck, Truck, ArrowRight } from "lucide-react";
import { useNavigation } from "../context/AppContext";
import Seo from '../components/common/Seo';

const VALUES = [
  {
    icon: Award,
    title: "Qualité & Authenticité",
    description: "100% de nos articles sont certifiés originaux et proviennent des plus grands fabricants mondiaux.",
    color: "#0d2b6b",
    bg: "#eff6ff",
  },
  {
    icon: Heart,
    title: "Passion de l'Éducation",
    description: "Nous conseillons et équipons les familles tunisiennes pour favoriser la réussite scolaire de chaque élève.",
    color: "#e11d48",
    bg: "#fff1f2",
  },
  {
    icon: Truck,
    title: "Service Express & Proximité",
    description: "Expédition soignée en 24h à 48h partout en Tunisie, et accueil chaleureux dans notre boutique à L'Aouina.",
    color: "#059669",
    bg: "#f0fdf4",
  },
  {
    icon: Target,
    title: "Meilleur Rapport Qualité / Prix",
    description: "Des tarifs équitables et transparents tout au long de l'année pour tous vos achats scolaires et de bureau.",
    color: "#d97706",
    bg: "#fffbeb",
  },
];

const BRANDS = ["BIC", "Bomi", "Lojel", "Maped", "Stabilo", "Staedler", "UHU", "Yamama", "Milan", "Oxford"];

export function AboutPage() {
  const { navigateTo } = useNavigation();

  return (
    <div className="page-section" style={{ minHeight: "80vh", paddingBottom: "4rem" }}>
      <Seo title="À propos de nous – Librairie l'Écolier" description="Découvrez l'histoire, la mission et les engagements de la Librairie l'Écolier à Tunis." />
      
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigateTo("home")}>Accueil</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-active">À propos</span>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary via-blue-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 mb-10 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4 border border-white/15">
            <Sparkles size={14} /> Notre Histoire & Mission
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
            Librairie l'Écolier
          </h1>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
            Votre référence de confiance en Tunisie pour les cartables haut de gamme, fournitures scolaires, livres et matériel de bureau professionnel.
          </p>
        </div>
      </div>

      {/* Story & Mission Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 items-center">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-extrabold text-primary mb-3">Notre Histoire</h2>
          <div className="w-12 h-1 bg-amber-400 rounded-full mb-4" />
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Fondée avec la volonté d'offrir le meilleur aux élèves, étudiants et enseignants, <strong>Librairie l'Écolier</strong> s'est rapidement imposée comme une adresse incontournable à Tunis.
          </p>
          <p className="text-slate-600 text-sm leading-relaxed">
            Située au <strong>11 Avenue Mongi Slim à L'Aouina</strong>, notre boutique physique et notre plateforme e-commerce vous permettent de préparer chaque rentrée en toute sérénité avec des articles robustes et adaptés.
          </p>
        </div>

        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base mb-1">Authenticité Garantie</h3>
              <p className="text-slate-500 text-xs leading-relaxed">Tous nos cartables et fournitures sont importés directement auprès des marques et distributeurs agréés.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 pt-3 border-t border-slate-200">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Truck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base mb-1">Expédition sur les 24 Gouvernorats</h3>
              <p className="text-slate-500 text-xs leading-relaxed">De Bizerte à Tataouine, recevez vos commandes à domicile avec paiement en espèces.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Values Grid */}
      <div className="mb-12">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Nos Engagements</h2>
          <p className="text-slate-500 text-xs sm:text-sm">Les 4 piliers qui guident notre travail et notre relation avec chaque client.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {VALUES.map((val) => (
            <div key={val.title} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: val.bg, color: val.color }}
              >
                <val.icon size={24} />
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-2">{val.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{val.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Partner Brands */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 mb-12 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-4 text-center">Nos Marques Partenaires</h2>
        <div className="flex flex-wrap gap-2.5 justify-center">
          {BRANDS.map((b) => (
            <span
              key={b}
              className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:border-primary hover:text-primary transition-colors cursor-default"
            >
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* Store Location & Call to action */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xl">
        <div>
          <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">Venez nous rendre visite</span>
          <h3 className="text-2xl font-black mt-1 mb-2">Boutique Librairie l'Écolier</h3>
          <p className="text-slate-300 text-xs sm:text-sm max-w-md">
            11 Avenue Mongi Slim, L'Aouina, Tunis. Ouvert du Lundi au Dimanche.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigateTo("contact")}
            className="btn-primary flex items-center gap-2"
          >
            <span>Nous Contacter</span>
            <ArrowRight size={16} />
          </button>
          <button
            onClick={() => navigateTo("category", "")}
            className="btn-secondary"
          >
            <span>Parcourir les Rayons</span>
          </button>
        </div>
      </div>
    </div>
  );
}

