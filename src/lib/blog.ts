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
  },
  {
    slug: 'reducing-battery-replacement-costs-lfp-nigeria',
    title: 'Reducing Battery Replacement Costs: Why LFP is the Gold Standard in Nigeria',
    description: 'A deep dive into the thermal characteristics and cycle lifetimes of LiFePO4 (LFP) vs. traditional Gel Lead-Acid batteries in sub-Saharan climates.',
    date: 'June 2, 2026',
    readTime: '7 min read',
    author: 'Engr. Babajide Alao',
    category: 'Battery Tech',
    pillar: 'Battery Tech',
    image: 'https://images.unsplash.com/photo-1548613053-220ef358109a?q=80&w=800&auto=format&fit=crop',
    answerFirst: 'Lithium Iron Phosphate (LiFePO4/LFP) batteries deliver over 4,000 charge-discharge cycles at 80% Depth of Discharge, lasting 10+ years even in high ambient Nigerian temperatures. Compared to deep-cycle Gel batteries which fail in 1.5 to 2.5 years due to grid-charge heat degradation, LFP arrays reduce the levelized cost of energy storage by 68% over their lifetime.',
    summaryPoints: [
      'LFP chemistry can withstand continuous operation up to 45°C without thermal runaway.',
      'Gel batteries suffer capacity drop and plate sulfation when left partially uncharged during grid blackouts.',
      'An LFP pack has a 10-year total cost of ownership that is less than half of equivalent Gel battery replacements.',
      'Built-in BMS (Battery Management System) prevents cell imbalance and overcharge failure.'
    ],
    sections: [
      {
        title: 'Thermal Degradation of Energy Storage in Nigeria',
        content: [
          'The performance and longevity of solar storage banks are heavily dependent on operating temperature. In cities like Lagos, Abuja, and Port Harcourt, ambient indoor temperatures often hover around 30°C to 35°C. For lead-acid and Gel batteries, every 8°C rise above the standard 25°C rating cuts the battery lifespan exactly in half.',
          'Under these thermal stresses, Gel batteries dry out and expand, leading to premature capacity degradation within 18 to 24 months. Lithium Iron Phosphate (LiFePO4) chemistry, however, has a much higher thermal threshold, preserving structural integrity and safety without active air conditioning.'
        ]
      },
      {
        title: 'Cycle Count Economics: LFP vs. Gel',
        content: [
          'Let us compare the mathematical lifecycles. A standard 200Ah 12V Gel battery costs roughly ₦220,000 and provides about 600 cycles at 50% Depth of Discharge. A 48V 100Ah (4.8kWh) LiFePO4 battery pack costs roughly ₦1,800,000 but delivers 4,000 cycles at 80% Depth of Discharge.',
          'To supply equivalent usable energy over 10 years, an installer would need to buy 4 full sets of Gel batteries, resulting in recurring purchase costs, labor expenses, and downtime. LFP requires only a single purchase, making it the most economical choice for long-term power stability.'
        ]
      }
    ],
    faqs: [
      {
        question: 'Do Lithium batteries require a special solar charger?',
        answer: 'Yes, lithium batteries must be paired with charge controllers and hybrid inverters that support custom lithium profiles or communicate directly via CAN/RS485 BMS protocols. Using a standard lead-acid charging profile will damage the lithium cells and void the manufacturer warranty.'
      },
      {
        question: 'Can I mix old and new lithium batteries in the same system?',
        answer: 'It is highly discouraged to mix lithium batteries of different ages, capacities, or manufacturers. Doing so creates voltage imbalances, forcing the internal BMS of the weaker pack to shut down early, which reduces the total output of the entire system.'
      }
    ],
    widgetType: 'compliance-checklist',
    schema: {
      headline: 'Reducing Battery Replacement Costs: Why LFP is the Gold Standard in Nigeria',
      description: 'An analysis of chemical safety, temperature tolerances, and cycle lifetimes of lithium LFP vs Gel batteries in Nigeria.',
      faqList: [
        { q: 'Do Lithium batteries require a special solar charger?', a: 'Yes, they require custom lithium profiles or direct BMS communication to charge safely.' },
        { q: 'Can I mix old and new batteries?', a: 'No, mixing packs causes imbalance and triggers BMS safety cut-offs.' }
      ]
    }
  },
  {
    slug: 'scaling-solar-sales-roi-pitching-nigeria',
    title: 'Scaling Solar Sales: How to Pitch ROI in 3 Minutes',
    description: 'Learn the exact narrative framework successful Nigerian solar installers use to address client sticker shock, translate kVA into household comfort, and close deals.',
    date: 'May 30, 2026',
    readTime: '4 min read',
    author: 'Mr. Tunde (Lekki Solar Group)',
    category: 'Sales Growth',
    pillar: 'Installer Growth',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=800&auto=format&fit=crop',
    answerFirst: 'Closing a solar contract in Nigeria requires shifting the client\'s focus from the initial capital expense to the immediate generator fuel displacement. By demonstrating that a ₦45,000 monthly software-backed proposal saves over ₦150,000 in monthly petrol, sales reps establish a clear 3-minute ROI pitch that drives a 75% contract sign-off rate.',
    summaryPoints: [
      'Pitch fuel offsets first, not hardware specifications or panel wattages.',
      'Map system capacities directly to household comfort (e.g. running the fridge vs. AC).',
      'Use professional, branded PDFs instead of informal WhatsApp text quotes to command higher pricing.',
      'Offer simple staging plans, allowing clients to add panels later while keeping the core inverter and batteries.'
    ],
    sections: [
      {
        title: 'Overcoming the Initial CapEx Sticker Shock',
        content: [
          'The primary obstacle for any solar sales representative in Nigeria is the upfront cost. When a homeowner is quoted ₦4,500,000 for a 5kVA system, their immediate reaction is to compare that price to a ₦350,000 petrol generator. The sales rep must immediately flip this perspective.',
          'Show the client that the generator is not a ₦350,000 purchase; it is a ₦200,000 monthly subscription to fuel stations, oil mechanics, and noise pollution. By contrast, a solar system is an asset that pays for itself in 24 months, turning a variable liability into a fixed, depreciating capital asset.'
        ]
      },
      {
        title: 'The 3-Minute Sizing Script that Converts Leads',
        content: [
          'Do not bore your customers with details about polycrystalline cells or MPPT charge algorithms. Instead, speak in terms of household utility: "This 5kVA system is designed to keep your double-door freezer running continuously so food never spoils, while powering all fans, lighting, and your home office. During the day, it runs your main living room AC completely off the sun."',
          'Using SolarPro\'s real-time Naira calculator on-site allows you to show them their exact grid and fuel savings curves right on your screen, which makes the investment feel tangible and secure.'
        ]
      }
    ],
    faqs: [
      {
        question: 'Should I offer discounts to close solar deals?',
        answer: 'Instead of lowering your margins, offer value-add warranties, a free first-year service check, or a complimentary surge protector. Branded, transparent proposals with detailed BOM costs help clients understand the quality of your hardware, reducing the urge to haggle.'
      }
    ],
    widgetType: 'roi-calculator',
    schema: {
      headline: 'Scaling Solar Sales: How to Pitch ROI in 3 Minutes',
      description: 'A sales training guide for solar installers in Nigeria, focusing on overcoming pricing objections and presenting clear payback curves.',
      faqList: [
        { q: 'Should I discount standard pricing?', a: 'Focus on value additions like complimentary service checks rather than cutting margins.' }
      ]
    }
  },
  {
    slug: 'case-study-acme-solar-lagos',
    title: 'Case Study: How Acme Solar Grew Revenue by 300% in 12 Months',
    description: 'A detailed breakdown of how a small Lagos-based installation team scaled from 5 to 40+ proposals monthly, resolved tenant-landlord friction, and closed a ₦5M deal using SolarPro.',
    date: 'May 28, 2026',
    readTime: '5 min read',
    author: 'SolarExpress Admin',
    category: 'Case Studies',
    pillar: 'Installer Growth',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop',
    answerFirst: 'Acme Solar achieved a 300% revenue growth by standardizing their proposal pipeline on SolarPro. By replacing manual excel bills with automated Naira ROI charts, Lagos safety compliance permits, and one-click WhatsApp PDF sharing, they increased client trust and shortened the sales cycle from 18 days to under 48 hours.',
    summaryPoints: [
      'Acme Solar automated site surveys, producing professional quotes in under 3 minutes.',
      'Landlord addendums helped secure approvals for Lekki-based rental tenants.',
      'Sharing interactive Web links via WhatsApp increased client engagement by 4x.',
      'Closed their largest ₦5,000,000 residential project within one week of upgrading to SolarPro Pro.'
    ],
    sections: [
      {
        title: 'The Challenge: Slow Turnarounds and Missed Leads',
        content: [
          'In early 2025, Acme Solar was a team of two installers based in Gbagada, Lagos. Despite strong engineering skills, they struggled with sales operations. Site surveys required taking notes, returning to the office, calculating electrical loads in Excel, and manually designing a PDF quote. This turnaround took 3 to 5 days.',
          'During this delay, hot leads would cool off or buy from larger competitors who responded faster. Acme Solar was closing less than 15% of their site surveys, capping their monthly revenue at roughly ₦1,200,000.'
        ]
      },
      {
        title: 'The Transformation: Going Pro with SolarPro',
        content: [
          'Acme Solar adopted SolarPro\'s Professional plan, enabling their team to run complete load calculations and size solar arrays directly on-site using their mobile phones—even offline. They could configure standard hardware packages, add custom markup margins, and generate a branded proposal link in under 3 minutes.',
          'By immediately sharing this proposal link over WhatsApp with the client, they kept momentum high. The inclusion of LSEB compliance permits and Landlord Addendums resolved structural and property disputes instantly, doubling their close rate to over 45%.'
        ]
      }
    ],
    faqs: [
      {
        question: 'What plan did Acme Solar use to scale?',
        answer: 'Acme Solar started on the Starter plan and upgraded to the Professional plan to access team accounts, advanced generator ROI charts, and water-mark free PDF exports as their installation volume grew.'
      }
    ],
    widgetType: 'roi-calculator',
    schema: {
      headline: 'Case Study: How Acme Solar Grew Revenue by 300% in 12 Months',
      description: 'A real-world case study analyzing the operational efficiency and revenue growth of a Lagos-based solar installation firm using SolarPro.',
      faqList: [
        { q: 'What plan did Acme Solar use to scale?', a: 'They upgraded from Starter to the Professional plan to unlock team features and advanced ROI charts.' }
      ]
    }
  }
];

