export const services = [
  {
    id: 1,
    title: 'Website Development',
    description: 'Custom, responsive websites built with cutting-edge technologies for optimal performance and user experience.',
    icon: 'Globe'
  },
  {
    id: 2,
    title: 'UI/UX Design',
    description: 'Beautiful, intuitive interfaces designed with user-centered principles to maximize engagement and conversion.',
    icon: 'Palette'
  },
  {
    id: 3,
    title: 'Mobile App Development',
    description: 'Native and cross-platform mobile applications that deliver seamless experiences across all devices.',
    icon: 'Smartphone'
  },
  {
    id: 4,
    title: 'Digital Marketing',
    description: 'Data-driven marketing strategies to boost your online presence and drive measurable business growth.',
    icon: 'TrendingUp'
  },
  {
    id: 5,
    title: 'Branding & Identity',
    description: 'Comprehensive brand identity solutions that capture your vision and resonate with your target audience.',
    icon: 'Sparkles'
  }
];

export const whyUs = [
  {
    id: 1,
    title: 'Expert Team',
    description: 'Our team consists of seasoned professionals with years of experience in cutting-edge technologies.',
    icon: 'Users'
  },
  {
    id: 2,
    title: 'Quality Assurance',
    description: 'We follow rigorous testing and quality control processes to ensure flawless delivery.',
    icon: 'CheckCircle'
  },
  {
    id: 3,
    title: 'On-Time Delivery',
    description: 'We respect your time and consistently deliver projects within agreed timelines.',
    icon: 'Clock'
  },
  {
    id: 4,
    title: '24/7 Support',
    description: 'Round-the-clock support to address your concerns and keep your projects running smoothly.',
    icon: 'Headphones'
  }
];

export const portfolioProjects = [
  {
    id: 1,
    title: 'E-Commerce Platform',
    description: 'A modern online marketplace with seamless checkout and inventory management.',
    image: 'https://images.unsplash.com/photo-1678690832311-bb6e361989ca?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHx3ZWJzaXRlJTIwZGVzaWdufGVufDB8fHx8MTc2Mjk0MTUwMHww&ixlib=rb-4.1.0&q=85',
    category: 'Website',
    tags: ['React', 'Node.js', 'MongoDB']
  },
  {
    id: 2,
    title: 'FinTech Dashboard',
    description: 'Advanced financial analytics platform with real-time data visualization.',
    image: 'https://images.unsplash.com/photo-1559028012-481c04fa702d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwyfHx3ZWJzaXRlJTIwZGVzaWdufGVufDB8fHx8MTc2Mjk0MTUwMHww&ixlib=rb-4.1.0&q=85',
    category: 'UI/UX',
    tags: ['Figma', 'Design System', 'Analytics']
  },
  {
    id: 3,
    title: 'Healthcare App',
    description: 'Patient management system with appointment scheduling and medical records.',
    image: 'https://images.unsplash.com/photo-1680016661694-1cd3faf31c3a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHx3ZWJzaXRlJTIwZGVzaWdufGVufDB8fHx8MTc2Mjk0MTUwMHww&ixlib=rb-4.1.0&q=85',
    category: 'Mobile',
    tags: ['React Native', 'Healthcare', 'UX']
  },
  {
    id: 4,
    title: 'SaaS Platform',
    description: 'Cloud-based collaboration tool with advanced project management features.',
    image: 'https://images.unsplash.com/photo-1720962158789-9389a4f399da?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwyfHxVSSUyMGludGVyZmFjZXxlbnwwfHx8fDE3NjI5NDE1MDZ8MA&ixlib=rb-4.1.0&q=85',
    category: 'Website',
    tags: ['Next.js', 'TypeScript', 'PostgreSQL']
  },
  {
    id: 5,
    title: 'Brand Identity',
    description: 'Complete brand refresh including logo, color palette, and marketing materials.',
    image: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg',
    category: 'Branding',
    tags: ['Brand Strategy', 'Visual Identity', 'Guidelines']
  },
  {
    id: 6,
    title: 'Marketing Campaign',
    description: 'Multi-channel digital marketing campaign with 300% ROI increase.',
    image: 'https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg',
    category: 'Marketing',
    tags: ['SEO', 'Social Media', 'Analytics']
  }
];

export const testimonials = [
  {
    id: 1,
    name: 'Stepen wang jian',
    role: 'CEO, TechStart Inc',
    content: 'Astra Web Studio transformed our vision into reality. Their attention to detail and technical expertise exceeded our expectations.',
    rating: 5
  },
  {
    id: 2,
    name: 'Faisal sipesel',
    role: 'Founder, Digital Ventures',
    content: 'Working with Astra was seamless. They delivered a stunning website on time and provided exceptional post-launch support.',
    rating: 5
  },
  {
    id: 3,
    name: 'Hafidz Handsome',
    role: 'Marketing Director, GrowthCo',
    content: 'The team\'s creativity and professionalism made the entire process enjoyable. Our new brand identity is absolutely perfect.',
    rating: 5
  }
];

export const pricingPlans = [
  {
    id: 1,
    name: 'Starter',
    price: 'Rp. 100.000 - 1.000.000',
    description: 'Perfect for small businesses and startups',
    features: [
      'Responsive Design',
      'Basic SEO Optimization',
      'Up to 5 Pages',
      'Contact Form Integration',
      '1 Month Support',
      'Mobile Optimized'
    ],
    popular: false
  },
  {
    id: 2,
    name: 'Pro',
    price: 'Rp. > 1.000.000',
    description: 'Ideal for growing businesses',
    features: [
      'All Starter Features',
      'Custom UI/UX Design',
      'Up to 15 Pages',
      'Blog Integration',
      'Social Media Integration',
      'Advanced SEO',
      '3 Months Support',
      'Content Management System'
    ],
    popular: true
  },
  {
    id: 3,
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large-scale projects',
    features: [
      'All Pro Features',
      'E-commerce Functionality',
      'Advanced SEO & Analytics',
      'Unlimited Pages',
      'Dedicated Support Team',
      'Custom Features & Integrations',
      '12 Months Support',
      'Priority Development'
    ],
    popular: false
  }
];