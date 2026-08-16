// client/src/App.tsx
import React, { Suspense } from "react";

// Core layout and providers
import { Header } from "./layouts/Header";
import { Footer } from "./layouts/Footer";
import { AppProviders, useNavigation } from "./context/AppContext";
import { LayoutProvider } from "./context/LayoutContext";
import { AdminProvider, useAdmin } from "./context/AdminContext";

// Presentational components for the home view
import { Hero } from "./components/Hero";
import { Categories } from "./components/Categories";
import { BestSellers } from "./components/BestSellers";
import { NewCollection } from "./components/NewCollection";
import { Stats } from "./components/Stats";
import { Testimonials } from "./components/Testimonials";

// Lazily‑loaded main pages (for bundle chunk splitting and performance)
const ProductCatalog = React.lazy(() => import("./pages/ProductCatalog").then(module => ({ default: module.ProductCatalog })));
const CartPage = React.lazy(() => import("./pages/CartPage").then(module => ({ default: module.CartPage })));
const AuthPage = React.lazy(() => import("./pages/AuthPage").then(module => ({ default: module.AuthPage })));
const ProductDetailPage = React.lazy(() => import("./pages/ProductDetailPage").then(module => ({ default: module.ProductDetailPage })));
const AdminLayout = React.lazy(() => import("./features/admin/AdminLayout").then(module => ({ default: module.AdminLayout })));

// Lazily‑loaded secondary pages
const AboutPage = React.lazy(() => import("./pages/AboutPage").then(module => ({ default: module.AboutPage })));
const ContactPage = React.lazy(() => import("./pages/ContactPage").then(module => ({ default: module.ContactPage })));
const TermsPage = React.lazy(() => import("./pages/TermsPage").then(module => ({ default: module.TermsPage })));
const OrderHistoryPage = React.lazy(() => import("./pages/OrderHistoryPage").then(module => ({ default: module.OrderHistoryPage })));
const PrivacyPage = React.lazy(() => import("./pages/PrivacyPage").then(module => ({ default: module.PrivacyPage })));
const WishlistPage = React.lazy(() => import("./pages/WishlistPage").then(module => ({ default: module.WishlistPage })));

const PageLoader = () => (
  <div className="flex items-center justify-center p-12 min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

function MainAppContent() {
  const { currentView, activeCategory, selectedProductId, pageNumber, navigateTo } = useNavigation();
  const { isAdmin, loading: adminLoading } = useAdmin();

  // Automatically scroll to the top of the page when navigating between views
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentView, activeCategory, selectedProductId, pageNumber]);

  // Admin access will render AdminLayout when currentView is "admin"
  if (currentView === "admin") {
    if (adminLoading) {
      return (
        <div className="app-container">
          <main>
            <PageLoader />
          </main>
        </div>
      );
    }
    
    if (!isAdmin) {
      return (
        <div className="app-container">
          <Header />
          <main className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 py-16">
            <div className="relative mb-6">
              <h1 className="text-[150px] leading-none font-extrabold text-gray-100 tracking-widest drop-shadow-sm select-none">404</h1>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-primary text-white px-3 py-1 text-sm font-semibold rounded shadow-md transform -rotate-12 uppercase tracking-wide">Introuvable</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Oups ! Cette page n'existe pas.</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-10 text-lg">
              Le lien que vous avez suivi est peut-être rompu, ou la page a été déplacée ou supprimée.
            </p>
            <button 
              className="px-8 py-3 bg-primary text-white rounded-full font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300" 
              onClick={() => navigateTo('home')}
            >
              Retourner à l'accueil
            </button>
          </main>
          <Footer />
        </div>
      );
    }

    return (
      <div className="app-container">
        <main>
          <Suspense fallback={<PageLoader />}>
            <AdminLayout />
          </Suspense>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header />
      <main>
        {/* Home view */}
        {currentView === "home" && (
          <>
            <Hero />
            <Categories />
            <BestSellers />
            <NewCollection />
            <Stats />
            <Testimonials />
          </>
        )}

        {/* E‑commerce & Info views wrapped in Suspense for dynamic lazy-loading */}
        <Suspense fallback={<PageLoader />}>
          {currentView === "category" && <ProductCatalog />}
          {currentView === "cart" && <CartPage />}
          {currentView === "auth" && <AuthPage />}
          {currentView === "product" && <ProductDetailPage />}
          {currentView === "orders" && <OrderHistoryPage />}
          {currentView === "wishlist" && <WishlistPage />}

          {/* Lazily loaded informational pages */}
          {currentView === "about" && <AboutPage />}
          {currentView === "contact" && <ContactPage />}
          {currentView === "terms" && <TermsPage />}
          {currentView === "privacy" && <PrivacyPage />}
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

import { Provider as ReduxProvider } from "react-redux";
import { store } from "./store";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  return (
    <ReduxProvider store={store}>
      <ErrorBoundary>
        <AppProviders>
          <LayoutProvider>
            <AdminProvider>
              <MainAppContent />
            </AdminProvider>
          </LayoutProvider>
        </AppProviders>
      </ErrorBoundary>
    </ReduxProvider>
  );
}
