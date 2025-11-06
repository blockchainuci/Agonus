export const colors = {
    // primary palette
    navy: '#0A2540',
    royalBlue : '#1E3A8A',
    gold: '#FFD700',

    //Interactive states
    navyLight: '#0f3057',
    royalBlueLight: '#2563eb',
    goldDark: '#d4af37',

    // Neutrals
    white: '#FFFFFF',
    gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
    },

    cardBg: 'rgba(31, 41, 55, 0.5)', // gray-800/50
    cardBgHover: 'rgba(31, 41, 55, 0.7)', //gray-800/70
    
} as const; 

//section padding
export const spacing = {
    // section padding
    section:{
    x: 'px-6 sm:px-8 lg:px-12',
    y: 'py-12 sm:py-16 lg:py-20',
    all: 'p-6 sm:p-8 lg:p-12',
    },

// card padding
    card: {
        default: 'p-6',
        sm: 'p-4',
        lg: 'p-8',
    },

    // content spacing
    content: {
        xs: 'space-y-2',
        sm: 'space-y-4',
        md: 'space-y-6',
        lg: 'space-y-8',
        xl: 'space-y-12',
    },

    // section margins
    sectionGap: 'mb-12 sm:mb-16 lg:mb-20',
    titleGap: 'mb-6 sm:mb-8',
    subtitleGap: 'mb-4',
} as const;

export const typography = {
    //headings

    h1: 'text-4xl sm:text-5xl lg:text-6xl font-bold',
    h2: 'text-3xl sm:text-4xl lg:text-5xl font-bold',
    h3: 'text-2xl sm:text-3xl font-bold',
    h4: 'text-xl sm:text-2xl font-semibold',

    //body text
    body: {
        lg: 'text-lg leading-relaxed',
        base: 'text-base leading-relaxed',
        sm: 'text-sm leading-relaxed',
    },

    // other
    tagline: 'text-lg sm:text-xl text-gray-300',
    label: 'text-xs sm:text-sm font-medium uppercase tracking-wide',
} as const;

export const layout = {
    // container max widths
    container: {
        sm: 'max-w-3xl',
        md: 'max-w-4xl',
        lg: 'max-w-5xl',
        xl: 'max-w-6xl',
        '2xl': 'max-w-7xl',
        full: 'max-w-full',
    },

    //grid layouts

    grid: {
        agents: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
        steps: 'space-y-6'
    }, 
} as const;

export const effects = {
    //shadows
    shadow: {
        sm: 'shadow-sm',
        base: 'shadow-md',
        lg: 'shadow-lg',
        xl: 'shadow-xl',
    },

    // border
    rounded: {
        sm: 'rounded-md',
        base: 'rounded-lg',
        lg: 'rounded-xl',
        full: 'roudned-full',
    },

    //transitions

    transition: {
    base: 'transition-all duration-200 ease-in-out',
    slow: 'transition-all duration-300 ease-in-out',
    colors: 'transition-colors duration-200',
    },

    //hover effects
    hover: {
        lift: 'hover:-translate-y-1',
        scale: 'hover:scale-105',
        brighten: 'hover:brightness-110',
    },
} as const;

export const gradients = {
    primary: 'bg-gradient-to-r from-[#1E3A8A] to-[#0A2540]',
    primaryHover: 'hover:from-[#2563eb] hover:to-[#1E3A8A]',
    secondary: 'bg-gradient-to-r from-[#0A2540] to-[#415a77]',
    secondaryHover: 'hover:from-[#1E3A8A] hover:to-[#0A2540]',
    gold: 'bg-gradient-to-r from-[#FFD700] to-[#d4af37]',
    goldHover: 'hover:from-[#d4af37] hover:to-[#b8941f]',
    accent: 'bg-gradient-to-br from-[#1E3A8A] via-[#0A2540] to-[#FFD700]', 
} as const;

export const components = {
    button: {
        base: `inline-flex items-center justify-center gap-x-2 rounded-lg px-6 py-3 text-sm font-semibold ${effects.transition.base} focus-visible:outline-2 focus-visible:outline-offset-2`,
        primary: `${gradients.primary} ${gradients.primaryHover} text-white focus-visible:outline-[#1E3A8A]`,
        secondary: `${gradients.secondary} ${gradients.secondaryHover} text-white focus-visible:outline-[#0A2540]`,
        gold: `${gradients.gold} ${gradients.goldHover} text-[#0A2540] focus-visible:outline-[#FFD700]`,
    },

    card: {
        base: `${effects.rounded.lg} bg-gray-800/50 border border-white/10 ${effects.shadow.base} ${effects.transition.colors}`,
        hover: 'hover:bg-gray-800/70 hover:border-white/20',
        interactive: `${effects.hover.lift} ${effects.shadow.lg}`,
    },

    iconContainer: {
        base: `flex items-center justify-center ${effects.rounded.full} ${gradients.primary}`,
        sizes: {
        sm: 'w-12 h-12',
        md: 'w-16 h-16',
        lg: 'w-20 h-20',
        },
    },
} as const;


export const animations = {
    fadeInUp: {
        initial: {opacity: 0, y:20},
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
    },

    fadeInLeft: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.5 },
    },
  
    scaleIn: {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.4 },
    },
    
    hoverLift: {
        whileHover: { scale: 1.05, y: -10 },
        transition: { duration: 0.2 },
    },
    
    hoverScale: {
        whileHover: { scale: 1.05 },
        transition: { duration: 0.2 },
    }, 
} as const;

