export interface BlogArticle {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  author: string;
  category: string;
  pillar: 'ROI Math' | 'Sizing & Grid' | 'Battery Tech' | 'Lagos Compliance' | 'Installer Growth';
  image: string;
  answerFirst: string;
  summaryPoints: string[];
  sections: {
    title: string;
    content: string[];
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
  widgetType: 'roi-calculator' | 'grid-vs-solar' | 'compliance-checklist';
  schema: {
    headline: string;
    description: string;
    faqList: { q: string; a: string }[];
  };
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: 'diesel-generator-vs-solar-roi-nigeria',
    title: 'Diesel Generator Cost vs. Solar ROI: Sizing a 5kVA System for a Lagos Home',
    description: 'A mathematical comparison of running a petrol/diesel generator versus installing a 5kVA solar system in Lagos, including payback period, maintenance, and lifetime savings.',
    date: 'May 25, 2026',
    readTime: '6 min read',
    author: 'Engr. Babajide Alao',
    category: 'Solar ROI',
    pillar: 'ROI Math',
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=800&auto=format&fit=crop',
    answerFirst: 'A standard 5kVA solar inverter system in Lagos costs between ₦4,200,000 and ₦5,500,000. It replaces up to 95% of monthly petrol or diesel generator expenses. For homes spending ₦150,000 monthly on generator fuel (averaging ₦1,150 per liter), the solar system reaches full financial payback within 2.3 to 2.8 years, delivering over ₦15,000,000 in net savings over its 10-year operational life.',
    summaryPoints: [
      'Petrol/Diesel costs in Lagos have risen past ₦1,000/liter, making generators highly inefficient.',
      'A 5kVA system easily runs a double-door fridge, chest freezer, home office, fans, and 1 inverter AC.',
      'The initial capital expenditure pays for itself in under 30 months.',
      'Lithium batteries (LiFePO4) offer 4,000+ lifecycles, lasting over 10 years without capacity degradation.'
    ],
    sections: [
      {
        title: 'The Real Cost of Generator Fuel in 2026',
        content: [
          'Running a typical standard generator in Lagos has transitioned from a mild inconvenience to a severe financial burden. With premium motor spirit (PMS/petrol) and automotive gas oil (AGO/diesel) trading above ₦1,000 to ₦1,200 per liter depending on the local station, a property running a generator for just 6 hours daily consumes roughly 150 liters monthly.',
          'At ₦1,100 per liter, that amounts to ₦165,000 monthly in pure fuel costs, completely ignoring engine oil changes, spark plug replacements, filters, sound mufflers, and mechanical wear. Over 5 years, this adds up to over ₦9,900,000 spent on fossil fuel energy with zero residual value.'
        ]
      },
      {
        title: 'What a 5kVA Solar System Powers Comfortably',
        content: [
          'A common point of confusion for Lagos homeowners is whether a 5kVA system can run a standard modern household. The answer is yes, provided high-load appliances are managed correctly. A standard 5kVA inverter has a continuous output limit of roughly 4,000W to 4,500W and a peak surge limit of 10,000W.',
          'With a properly configured battery bank (e.g., 10kWh Lithium or 8x 200Ah Gel Batteries) and an 8x 450W solar panel array, you can comfortably power: 1x 1.5HP Inverter Air Conditioner (during peak sun hours), 1x Standard Double-Door Refrigerator (250W runtime), 1x Deep Chest Freezer (350W runtime), 6x LED ceiling lights, 4x standing or ceiling fans, 2x Smart LCD TVs with decoders, and laptops or phone chargers.'
        ]
      },
      {
        title: 'Breaking Down the 2.3-Year Payback Period',
        content: [
          'Let us analyze the financial economics. A premium 5kVA system with a 10kWh Lithium battery bank, high-frequency smart MPPT inverter, and NERC-certified surge protections costs roughly ₦4,800,000 fully installed.',
          'Replacing a monthly ₦165,000 fuel bill yields an annual energy savings of ₦1,980,000. Dividing the ₦4,800,000 setup cost by ₦1,980,000 yields exactly 2.42 years. Beyond the 29th month, every single kilowatt-hour generated is completely free. Over a 10-year period, this represents a net saving of over ₦15,000,000, representing a massive return on investment.'
        ]
      }
    ],
    faqs: [
      {
        question: 'Can a 5kVA solar system run an air conditioner (AC)?',
        answer: 'Yes, a 5kVA system can power one 1.0HP or 1.5HP inverter air conditioner, preferably during the daytime when solar panels are producing peak electricity. Running an AC at night requires a massive lithium battery capacity (at least 10kWh to 15kWh) to avoid fully depleting batteries before sunrise.'
      },
      {
        question: 'What is the lifespan of Lithium vs. Gel batteries in Nigeria?',
        answer: 'Gel batteries typically last 1.5 to 3 years (about 500 to 800 cycles at 50% depth of discharge) under Nigerian heat conditions. LiFePO4 Lithium batteries last 8 to 12 years (3,000 to 5,000 cycles at 80% depth of discharge), making lithium far more cost-effective despite the higher initial purchase price.'
      },
      {
        question: 'Does SolarPro handle installation directly?',
        answer: 'SolarPro is an engineering workspace and design modeler utilized by certified solar installers across Nigeria. We connect homeowners with NERC-certified solar professionals who use our software to generate accurate physical survey assessments and transparent proposals.'
      }
    ],
    widgetType: 'roi-calculator',
    schema: {
      headline: 'Diesel Generator Cost vs. Solar ROI: Sizing a 5kVA System for a Lagos Home',
      description: 'A mathematical ROI comparison of petrol/diesel generator expenses versus a 5kVA solar system in Lagos, including payback schedule and lithium battery lifetimes.',
      faqList: [
        { q: 'Can a 5kVA solar system run an air conditioner (AC)?', a: 'Yes, a 5kVA system can power one 1.5HP inverter AC, preferably during peak daytime sun hours. Night AC requires extensive battery banks.' },
        { q: 'What is the lifespan of Lithium vs. Gel batteries in Nigeria?', a: 'Gel batteries last 1.5 to 3 years. LiFePO4 Lithium batteries last 8 to 12 years, offering superior ROI despite initial capital cost.' }
      ]
    }
  },
  {
    slug: 'nigeria-band-a-tariffs-vs-solar-roi',
    title: 'Nigeria Grid Band A Tariffs vs. Solar: Is Utility Power Officially More Expensive?',
    description: 'Following the NERC Band A tariff hikes, we analyze the cost per kWh of grid electricity compared to levelized cost of solar energy (LCOE) in Nigeria.',
    date: 'May 20, 2026',
    readTime: '5 min read',
    author: 'Chidi Okonkwo (Energy Analyst)',
    category: 'Grid Analysis',
    pillar: 'Sizing & Grid',
    image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=800&auto=format&fit=crop',
    answerFirst: 'With Nigeria Band A grid tariffs settled at ₦225 per kWh, utility power has officially become more expensive than solar energy. A levelized cost analysis shows that a high-efficiency residential solar system produces clean electricity at a levelized cost of roughly ₦85 to ₦110 per kWh over its lifetime. For any property consuming more than 400 kWh of grid electricity monthly, switching to solar provides an immediate 55% reduction in long-term power expenses.',
    summaryPoints: [
      'Band A tariff rates represent a 300% hike, drastically raising bills for serviced residential estates.',
      'Levelized Cost of Energy (LCOE) for residential solar is under ₦100/kWh.',
      'Grid voltage drops and erratic surges frequently damage household electronics, a risk mitigated by pure sine wave solar inverters.',
      'A hybrid system combining minimal Band A grid off-peak charging with daytime solar provides the absolute cheapest energy mix.'
    ],
    sections: [
      {
        title: 'The Shock of Band A Tariff Restructuring',
        content: [
          'Under the Nigerian Electricity Regulatory Commission (NERC) service-reflective tariff guidelines, residential estates receiving an average of 20 hours or more of daily power have been reclassified under Band A. While grid availability has improved in these premium pockets, the tariff rate has climbed to ₦225 per kWh.',
          'For a medium-sized 3-bedroom residence, a standard consumption profile averages 20 kWh daily (running a chest freezer, refrigerator, standard lighting, fans, three TVs, and water pumping). At ₦225 per kWh, this results in a daily grid cost of ₦4,500, translating directly to a staggering monthly bill of ₦135,000.'
        ]
      },
      {
        title: 'Levelized Cost of Solar (LCOE) Mathematically Explained',
        content: [
          'Levelized Cost of Energy (LCOE) measures the total cost of installing, operating, and maintaining an energy system divided by its cumulative lifetime output in kilowatt-hours. Let us calculate this for a standard 3kVA hybrid system.',
          'A premium 3kVA system costs roughly ₦2,600,000 fully installed, utilizing a 5kWh lithium battery and a 4x 450W panel array. Over a guaranteed 10-year lifespan, this system generates roughly 32,850 kWh of electricity (averaging 9 kWh daily). Taking the ₦2,600,000 investment plus ₦200,000 lifetime maintenance (fuse checks, panel cleaning) and dividing by 32,850 kWh yields exactly ₦85.20 per kWh.',
          'Comparing ₦85.20 per kWh (Solar) to ₦225.00 per kWh (Band A grid) proves that solar power is not a luxury alternative—it is the most cost-effective source of primary energy in modern Nigeria.'
        ]
      }
    ],
    faqs: [
      {
        question: 'Should I completely disconnect from the NEPA/IKEDC/EKEDC grid?',
        answer: 'No, a hybrid solar setup is highly recommended. You can keep your grid connection active to act as a fallback charger for your batteries during long rainy weeks in July, while letting solar power handle your heavy daytime load and routine nighttime lighting.'
      },
      {
        question: 'Are there hidden maintenance costs for home solar?',
        answer: 'Solar panels require simple cleaning every 3 to 6 months to wash off dust and soot, which can block sunlight and reduce efficiency by 15%. Inverter dust filters should be blown clean annually. Beyond these minor tasks, modern solid-state lithium systems have zero moving parts and require virtually no routine mechanical intervention.'
      }
    ],
    widgetType: 'grid-vs-solar',
    schema: {
      headline: 'Nigeria Grid Band A Tariffs vs. Solar: Is Utility Power Officially More Expensive?',
      description: 'An economic analysis comparing the cost per kWh of NERC Band A grid power to levelized cost of residential solar setups.',
      faqList: [
        { q: 'Should I disconnect from the grid fully?', a: 'No, keeping a hybrid connection allows for quick grid charging during rainy seasons while relying on solar for daily cost savings.' },
        { q: 'What is the LCOE of residential solar in Nigeria?', a: 'Residential solar offers a levelized cost of energy under ₦95/kWh, compared to over ₦200/kWh for Band A grid rates.' }
      ]
    }
  },
  {
    slug: 'lagos-solar-permitting-compliance-checklist',
    title: 'Lagos Solar Permitting & Landlord Approvals: The Complete Installer Compliance Guide',
    description: 'A structural and regulatory safety manual for installing solar systems on residential roofs, rental properties, and multi-tenant blocks in Lagos State.',
    date: 'May 15, 2026',
    readTime: '5 min read',
    author: 'Engr. Tunde Williams (LSEB Advisor)',
    category: 'Lagos Safety',
    pillar: 'Lagos Compliance',
    image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?q=80&w=800&auto=format&fit=crop',
    answerFirst: 'Lagos solar installations must adhere to the structural roof bearing limit of 15kg per square meter for aluminum roofs to prevent roof structural sag during high winds. Under current Lagos State Electricity Board (LSEB) guidelines, grid-tied setups exceeding 5kVA must register for safety certification. For tenanted properties, a signed landlord consent letter identifying structural mounting points and system ownership transfer rights is legally required before installation begins.',
    summaryPoints: [
      'Standard aluminum roofing sheets require mounting brackets secured directly to timber or steel purlins, never the sheet alone.',
      'Tenants must draft a formal tenancy agreement addendum defining solar asset ownership.',
      'High wind shear in coastal areas like Lekki, Victoria Island, and Ikorodu requires heavy-duty ballast mounts for flat concrete roofs.',
      'LSEB registrations prevent safety audits, utility disputes, and unauthorized grid feed-in penalties.'
    ],
    sections: [
      {
        title: 'Roof Structural Audits: Wind Shear & Weight Limits',
        content: [
          'Lagos is experiencing increasingly erratic coastal weather, leading to severe windstorms in Lekki, Ajah, and Ikeja. A standard 450W solar panel measures roughly 2 square meters and weighs approximately 22 kilograms. When accounting for anodized aluminum rails, mounting clamps, and ballast, the dead load on a roof climbs quickly.',
          'Before placing solar arrays, installers must conduct a structural timber or truss inspection. Standard light-gauge aluminum roofing sheets cannot sustain point loads. Mounting screws must pierce through the crown of the sheet and lock directly into structural purlins. Ballast systems on concrete deck roofs must have wind deflector shields to prevent dangerous uplift forces during thunderstorms.'
        ]
      },
      {
        title: 'The Landlord-Tenant Solar Friction: Who Owns the Inverter?',
        content: [
          'A primary barrier to solar adoption in rental estates like Gbagada, Surulere, and Yaba is tenant-landlord friction regarding property alterations and asset ownership. Solar components—inverters, battery banks, and solar panels—are expensive investments that tenants naturally wish to retain.',
          'To avoid disputes, a dedicated Tenancy Agreement Addendum must be drafted. This document must state: 1) The solar system is a removable personal asset belonging fully to the tenant; 2) The tenant is permitted to route cables through standard conduit points without structural penalty; 3) Upon tenancy termination, the tenant is responsible for restoring the roof to a watertight condition using standard liquid silicone sealants (such as Abro or Sika).'
        ]
      }
    ],
    faqs: [
      {
        question: 'Do I need a permit from LSEB for a small home solar system?',
        answer: 'Small off-grid residential systems under 5kVA do not require formal registration or permits from the Lagos State Electricity Board (LSEB). However, grid-tied hybrid systems or commercial installations exceeding 10kVA must undergo a basic safety audit and registry log to safeguard grid operations.'
      },
      {
        question: 'How do I prevent roof leaks after solar panel installation?',
        answer: 'Always use EPDM rubber washers on mounting hanger bolts and apply high-grade polyurethane sealant (like SikaFlex) directly around every roof penetration. Never let installers use cheap domestic silicone sealants, which degrade under intense Lagos UV heat in less than 6 months.'
      }
    ],
    widgetType: 'compliance-checklist',
    schema: {
      headline: 'Lagos Solar Permitting & Landlord Approvals: The Complete Installer Compliance Guide',
      description: 'Safety guidelines, landlord consent frameworks, and structural audit specifications for residential solar installers in Lagos State.',
      faqList: [
        { q: 'Is a permit required for residential solar in Lagos?', a: 'Off-grid setups under 5kVA do not require permits. Larger grid-interactive installations must register for basic safety compliance.' },
        { q: 'How do installers prevent roof leaks on aluminum sheets?', a: 'By securing mounting brackets to purlins with EPDM washers and applying heavy-duty polyurethane sealants rather than standard silicone.' }
      ]
    }
  }
];
