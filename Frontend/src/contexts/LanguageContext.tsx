import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'hi';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

const translations: Translations = {
  // Navigation
  'nav.browse': { en: 'Browse', hi: 'ब्राउज़ करें' },
  'nav.cart': { en: 'Cart', hi: 'कार्ट' },
  'nav.wishlist': { en: 'Wishlist', hi: 'विशलिस्ट' },
  'nav.library': { en: 'My Library', hi: 'मेरी लाइब्रेरी' },
  'nav.account': { en: 'My Account', hi: 'मेरा खाता' },
  'nav.login': { en: 'Login', hi: 'लॉगिन' },
  'nav.logout': { en: 'Logout', hi: 'लॉगआउट' },
  
  // Hero Section
  'hero.title': { en: 'Quality Notes from Toppers', hi: 'टॉपर्स से गुणवत्ता नोट्स' },
  'hero.subtitle': { en: 'Buy and sell academic notes from your university seniors', hi: 'अपने यूनिवर्सिटी सीनियर्स से एकेडमिक नोट्स खरीदें और बेचें' },
  'hero.search': { en: 'Search notes by subject, university...', hi: 'विषय, यूनिवर्सिटी से नोट्स खोजें...' },
  'hero.cta': { en: 'Browse Notes', hi: 'नोट्स ब्राउज़ करें' },
  'hero.seller_cta': { en: 'Start Selling', hi: 'बेचना शुरू करें' },
  
  // Categories
  'categories.title': { en: 'Browse by Category', hi: 'श्रेणी के अनुसार ब्राउज़ करें' },
  'categories.viewAll': { en: 'View All', hi: 'सभी देखें' },
  
  // Sections
  'section.trending': { en: 'Trending Notes', hi: 'ट्रेंडिंग नोट्स' },
  'section.mostDownloaded': { en: 'Most Downloaded', hi: 'सबसे अधिक डाउनलोड' },
  'section.newArrivals': { en: 'New Arrivals', hi: 'नई आवक' },
  'section.recommended': { en: 'Recommended For You', hi: 'आपके लिए सुझाव' },
  'section.topRated': { en: 'Top Rated', hi: 'टॉप रेटेड' },
  
  // Note Card
  'note.addToCart': { en: 'Add to Cart', hi: 'कार्ट में डालें' },
  'note.buyNow': { en: 'Buy Now', hi: 'अभी खरीदें' },
  'note.preview': { en: 'Preview', hi: 'पूर्वावलोकन' },
  'note.pages': { en: 'pages', hi: 'पृष्ठ' },
  'note.downloads': { en: 'downloads', hi: 'डाउनलोड' },
  'note.semester': { en: 'Semester', hi: 'सेमेस्टर' },
  
  // Cart
  'cart.title': { en: 'Shopping Cart', hi: 'शॉपिंग कार्ट' },
  'cart.empty': { en: 'Your cart is empty', hi: 'आपका कार्ट खाली है' },
  'cart.checkout': { en: 'Proceed to Checkout', hi: 'चेकआउट करें' },
  'cart.subtotal': { en: 'Subtotal', hi: 'उप-योग' },
  'cart.total': { en: 'Total', hi: 'कुल' },
  
  // Checkout
  'checkout.title': { en: 'Checkout', hi: 'चेकआउट' },
  'checkout.payment': { en: 'Payment Method', hi: 'भुगतान विधि' },
  'checkout.pay': { en: 'Pay', hi: 'भुगतान करें' },
  'checkout.upi': { en: 'UPI', hi: 'यूपीआई' },
  'checkout.card': { en: 'Credit/Debit Card', hi: 'क्रेडिट/डेबिट कार्ड' },
  'checkout.netbanking': { en: 'Net Banking', hi: 'नेट बैंकिंग' },
  
  // Auth
  'auth.login': { en: 'Login', hi: 'लॉगिन' },
  'auth.signup': { en: 'Sign Up', hi: 'साइन अप' },
  'auth.email': { en: 'Email', hi: 'ईमेल' },
  'auth.password': { en: 'Password', hi: 'पासवर्ड' },
  'auth.phone': { en: 'Phone Number', hi: 'फोन नंबर' },
  'auth.otp': { en: 'Enter OTP', hi: 'ओटीपी दर्ज करें' },
  'auth.google': { en: 'Continue with Google', hi: 'गूगल से जारी रखें' },
  
  // Common
  'common.save': { en: 'Save', hi: 'सहेजें' },
  'common.cancel': { en: 'Cancel', hi: 'रद्द करें' },
  'common.delete': { en: 'Delete', hi: 'हटाएं' },
  'common.edit': { en: 'Edit', hi: 'संपादित करें' },
  'common.view': { en: 'View', hi: 'देखें' },
  'common.download': { en: 'Download', hi: 'डाउनलोड' },
  'common.share': { en: 'Share', hi: 'साझा करें' },
  'common.search': { en: 'Search', hi: 'खोजें' },
  'common.filter': { en: 'Filter', hi: 'फ़िल्टर' },
  'common.sort': { en: 'Sort', hi: 'क्रमबद्ध करें' },
  
  // Seller
  'seller.dashboard': { en: 'Seller Dashboard', hi: 'सेलर डैशबोर्ड' },
  'seller.upload': { en: 'Upload Notes', hi: 'नोट्स अपलोड करें' },
  'seller.myNotes': { en: 'My Notes', hi: 'मेरे नोट्स' },
  'seller.wallet': { en: 'Wallet', hi: 'वॉलेट' },
  'seller.analytics': { en: 'Analytics', hi: 'एनालिटिक्स' },
  'seller.earnings': { en: 'Total Earnings', hi: 'कुल कमाई' },
  'seller.withdraw': { en: 'Withdraw', hi: 'निकालें' },
  
  // Footer
  'footer.about': { en: 'About Us', hi: 'हमारे बारे में' },
  'footer.contact': { en: 'Contact', hi: 'संपर्क' },
  'footer.privacy': { en: 'Privacy Policy', hi: 'गोपनीयता नीति' },
  'footer.terms': { en: 'Terms of Service', hi: 'सेवा की शर्तें' },
  'footer.refund': { en: 'Refund Policy', hi: 'रिफंड नीति' },
  'footer.newsletter': { en: 'Subscribe to Newsletter', hi: 'न्यूज़लेटर सब्सक्राइब करें' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language] || translation['en'] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
