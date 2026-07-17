export const demoCategories = [
  {
    id: 'demo-category-catering',
    name: 'Catering',
    slug: 'catering',
    description: 'Menu planning, live stations, buffet service, and tastings.',
    vendorCount: 3,
  },
  {
    id: 'demo-category-photography',
    name: 'Photography',
    slug: 'photography',
    description: 'Photo, video, albums, drone coverage, and event edits.',
    vendorCount: 2,
  },
  {
    id: 'demo-category-venues',
    name: 'Wedding Halls',
    slug: 'wedding-halls',
    description: 'Banquets, lawns, marquees, and hotel ballrooms.',
    vendorCount: 2,
  },
  {
    id: 'demo-category-decor',
    name: 'Decor and Florals',
    slug: 'decor',
    description: 'Stage design, floral arches, lighting, and table styling.',
    vendorCount: 2,
  },
];

export const demoVendors = [
  {
    id: 'demo-vendor-noor-events',
    businessName: 'Noor Events Studio',
    description:
      'Premium photography and cinematic coverage for Mehndi, Baraat, and Walima events.',
    city: 'Karachi',
    serviceAreas: ['Karachi', 'Hyderabad', 'Lahore'],
    startingPrice: 150000,
    verificationLevel: 'PLATFORM_TRUSTED',
    services: [
      {
        id: 'demo-service-noor-photo',
        title: 'Wedding Photography',
        category: { name: 'Photography', slug: 'photography' },
        description: 'Full-day photo coverage with edited highlights.',
      },
    ],
    packages: [
      {
        id: 'demo-package-noor-signature',
        name: 'Signature Photo Package',
        price: 225000,
        description: 'Two photographers, edited gallery, and premium album.',
      },
    ],
    availability: [
      { id: 'demo-availability-noor', status: 'AVAILABLE', date: '2026-12-12' },
    ],
    trustFactors: {
      trustScore: 94,
      averageRating: 4.9,
      reviewCount: 42,
      trustSignals: [
        { id: 'signal-noor-1', label: 'Verified profile', score: 100 },
        { id: 'signal-noor-2', label: 'Strong reviews', score: 96 },
      ],
    },
    reviews: [
      {
        id: 'demo-review-noor',
        title: 'Beautiful coverage',
        rating: 5,
        comment: 'Team was on time and very professional.',
        customer: { fullName: 'Aisha Khan' },
      },
    ],
    portfolio: [
      {
        id: 'demo-portfolio-noor',
        title: 'Baraat highlights',
        description: 'Cinematic family coverage.',
      },
    ],
  },
  {
    id: 'demo-vendor-zaiqa',
    businessName: 'Zaiqa Caterers',
    description:
      'Desi wedding catering with menu tastings, service staff, live BBQ, and dessert stations.',
    city: 'Islamabad',
    serviceAreas: ['Islamabad', 'Rawalpindi', 'Lahore'],
    startingPrice: 1950,
    verificationLevel: 'BUSINESS_VERIFIED',
    services: [
      {
        id: 'demo-service-zaiqa-catering',
        title: 'Wedding Catering',
        category: { name: 'Catering', slug: 'catering' },
        description: 'Buffet and live station catering for large events.',
      },
    ],
    packages: [
      {
        id: 'demo-package-zaiqa-premium',
        name: 'Premium Buffet',
        price: 2450,
        description:
          'Pakistani mains, BBQ, salads, desserts, and service team.',
      },
    ],
    availability: [
      {
        id: 'demo-availability-zaiqa',
        status: 'PARTIALLY_AVAILABLE',
        date: '2026-12-12',
      },
    ],
    trustFactors: {
      trustScore: 88,
      averageRating: 4.7,
      reviewCount: 31,
      trustSignals: [
        { id: 'signal-zaiqa-1', label: 'Business verified', score: 90 },
        { id: 'signal-zaiqa-2', label: 'Reliable capacity', score: 86 },
      ],
    },
    reviews: [],
    portfolio: [],
  },
  {
    id: 'demo-vendor-pearl-banquet',
    businessName: 'Pearl Banquet',
    description:
      'Elegant indoor venue with valet, bridal room, lighting, and flexible event layouts.',
    city: 'Lahore',
    serviceAreas: ['Lahore', 'Gujranwala'],
    startingPrice: 420000,
    verificationLevel: 'BUSINESS_VERIFIED',
    services: [
      {
        id: 'demo-service-pearl-venue',
        title: 'Banquet Hall',
        category: { name: 'Wedding Halls', slug: 'wedding-halls' },
        description: 'Indoor banquet booking for up to 500 guests.',
      },
    ],
    packages: [],
    availability: [
      {
        id: 'demo-availability-pearl',
        status: 'AVAILABLE',
        date: '2026-12-20',
      },
    ],
    trustFactors: { trustScore: 91, averageRating: 4.8, reviewCount: 27 },
    reviews: [],
    portfolio: [],
  },
  {
    id: 'demo-vendor-gul-decor',
    businessName: 'Gul Decor House',
    description:
      'Jali-inspired stages, floral arches, table decor, entrance styling, and lighting.',
    city: 'Karachi',
    serviceAreas: ['Karachi', 'Lahore'],
    startingPrice: 185000,
    verificationLevel: 'IDENTITY_VERIFIED',
    services: [
      {
        id: 'demo-service-gul-decor',
        title: 'Stage Decor',
        category: { name: 'Decor and Florals', slug: 'decor' },
        description: 'Stage, florals, and event styling.',
      },
    ],
    packages: [],
    availability: [
      { id: 'demo-availability-gul', status: 'AVAILABLE', date: '2026-12-12' },
    ],
    trustFactors: { trustScore: 82, averageRating: 4.6, reviewCount: 18 },
    reviews: [],
    portfolio: [],
  },
];

export function filterDemoVendors(filters: Record<string, string> = {}) {
  const q = filters.q?.toLowerCase();
  const city = filters.city?.toLowerCase();
  const category = filters.category?.toLowerCase();
  const maxPrice = Number(filters.maxPrice || 0);
  const minRating = Number(filters.minRating || 0);

  return demoVendors.filter((vendor) => {
    const categorySlug = vendor.services?.[0]?.category?.slug?.toLowerCase();
    const matchesQ =
      !q ||
      vendor.businessName.toLowerCase().includes(q) ||
      vendor.description.toLowerCase().includes(q) ||
      vendor.services.some((service) =>
        service.title.toLowerCase().includes(q),
      );
    const matchesCity =
      !city ||
      vendor.city.toLowerCase().includes(city) ||
      vendor.serviceAreas.some((area) => area.toLowerCase().includes(city));
    const matchesCategory = !category || categorySlug === category;
    const matchesPrice = !maxPrice || Number(vendor.startingPrice) <= maxPrice;
    const matchesRating =
      !minRating ||
      Number(vendor.trustFactors?.averageRating || 0) >= minRating;

    return (
      matchesQ &&
      matchesCity &&
      matchesCategory &&
      matchesPrice &&
      matchesRating
    );
  });
}

export function getDemoCategoryDetail(slug: string, city = '') {
  const category = demoCategories.find((item) => item.slug === slug) || {
    id: `demo-category-${slug}`,
    name: slug.replaceAll('-', ' '),
    slug,
    description: 'Trusted wedding vendors for this category.',
    vendorCount: 0,
  };

  return {
    category,
    vendors: filterDemoVendors({ category: slug, city }),
  };
}

export function getDemoVendor(vendorId: string) {
  return demoVendors.find((vendor) => vendor.id === vendorId) || null;
}
