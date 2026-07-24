import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SeoProps {
  title: string;
  description?: string;
  ogImage?: string;
  lang?: 'en' | 'fr' | 'ar';
  structuredData?: object;
}

const Seo: React.FC<SeoProps> = ({ title, description, ogImage, lang = 'fr', structuredData }) => {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <Helmet>
      <html lang={lang} />
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:type" content="website" />
      {currentUrl && <meta property="og:url" content={currentUrl} />}
      {/* Hreflang for multilingual support */}
      {origin && <link rel="alternate" hrefLang="fr" href={`${origin}${pathname}`} />}
      {/* Structured data JSON-LD */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default Seo;
