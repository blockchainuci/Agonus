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

    // glass and more translucency
    cardBg: 'rgba(31, 41, 55, 0.4)', // gray-800/50
    cardBgHover: 'rgba(31, 41, 55, 0.6)', //gray-800/70
    glassBg: 'rgba(255, 255, 255, 0.05)', // Subtle glass effect
    glassBgStrong: 'rgba(255, 255, 255, 0.1)',
    
} as const; 

//section padding
export const spacing = {

    
    section:{
    x: 'px-8 sm:px-12 lg:px-16 xl:px-20',
    y: 'py-16 sm:py-20 lg:py-24 xl:py-28',  
    all: 'p-8 sm:p-12 lg:p-16',
    hero: 'py-20 sm:py-24 lg:py-32 xl:py-36',  
    },

    card: {
        default: 'p-6',
        sm: 'p-4',
        lg: 'p-8',
        xl: 'p-10',
    },

    content: {
        xs: 'space-y-3',
        sm: 'space-y-5',
        md: 'space-y-8',
        lg: 'space-y-12',
        xl: 'space-y-16',
    },

    sectionGap: 'mb-16 sm:mb-20 lg:mb-24', 
    titleGap: 'mb-8 sm:mb-10 lg:mb-12',
    subtitleGap: 'mb-6 sm:mb-8',
    elementGap: 'mt-12 sm:mt-14 lg:mt-16',
} as const;

export const typography = {
    //headings

    h1: 'text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight',
    h2: 'text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight',
    h3: 'text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight',
    h4: 'text-2xl sm:text-3xl font-semibold',

    //body text
    body: {
        lg: 'text-xl sm:text-2xl leading-relaxed',
        base: 'text-lg sm:text-xl leading-relaxed',
        sm: 'text-base sm:text-lg leading-relaxed',
    },

    // other
    tagline: 'text-2xl sm:text-3xl lg:text-4xl text-gray-300 leading-relaxed font-light',
    label: 'text-sm sm:text-base font-medium uppercase tracking-wider',
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
        agents: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12',
        steps: 'space-y-10 lg:space-y-12'
    }, 
} as const;

export const effects = {
    //shadows
    shadow: {
        sm: 'shadow-sm',
        base: 'shadow-[0_2px_8px_rgba(0,0,0,0.08)]',
        md: 'shadow-[0_4px_12px_rgba(0,0,0,0.12)]',
        lg: 'shadow-[0_8px_24px_rgba(0,0,0,0.15)]',
        xl: 'shadow-[0_12px_32px_rgba(0,0,0,0.18)',
        '2xl': 'shadow-[0_16px_48px_rgba(0,0,0,0.22)]',

        //subtle colored shadows
        gold: 'shadow-[0_4px_16px_rgba(255,215,0,0.15)]', 
        goldStrong: 'shadow-[0_8px_24px_rgba(255,215,0,0.25)]',
        blue: 'shadow-[0_4px_16px_rgba(30,58,138,0.15)]',
    },

    // border
    rounded: {
        sm: 'rounded-lg',
        base: 'rounded-xl',
        lg: 'rounded-2xl',
        xl: 'rounded-3xl',
        full: 'rounded-full',
    },

    //transitions

    transition: {
    base: 'transition-all duration-300 ease-in-out',
    slow: 'transition-all duration-500 ease-in-out',
    colors: 'transition-colors duration-300',
    shadow: 'transition-shadow duration-300',
    },

    //hover effects
    hover: {
        lift: 'hover:-translate-y-1',
        shadow: 'hover:shadow-xl',
        scale: 'hover:scale-105',
        brighten: 'hover:brightness-105',
        opacity: 'hover:opacity-90'
    },

    //glass effects
    glass: {
        light: 'bg-white/5 backdrop-blur-sm',
        medium: 'bg-white/10 backdrop-blur-md',
        strong: 'bg-white/15 backdrop-blur-lg',
    },

    outline: {
        gold: 'ring-2 ring-[#FFD700] ring-offset-2 ring-offset-[#0A2540]',
        goldHover: 'hover:ring-[#FFF4CC] hover:ring-offset-4',
        blue: 'ring-2 ring-[#2563eb] ring-offset-2 ring-offset-[#0A2540]',
        white: 'ring-1 ring-white/20',
        whiteStrong: 'ring-2 ring-white/30',
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

    // subtle background gradeints
    sectionBg: 'bg-gradient-to-b from-[#0a1929] via-[#0f2744] to-[#0a1929',
    sectionBgAlt: 'bg-gradient-to-b from-[#0f2744] via-[#0a1929] to-[#0f2744]',
} as const;

export const components = {
    button: {
        base: `inline-flex items-center justify-center gap-x-3 rounded-2xl px-12 py-6 text-xl font-semibold ${effects.transition.base} focus-visible:outline-2 focus-visible:outline-none`,
       
        // blue outline
        primary: `${gradients.primary} ${effects.outline.blue} ${effects.shadow.blue}`,
        
        // gold outline and shine
        gold: `${gradients.gold} text-[#0A2540] ${effects.outline.gold} ${effects.shadow.goldStrong} 
               relative overflow-hidden
               before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent 
               before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700`,

        ghost: 'bg-transparent text-white ${effects.outline.white} hover:bg-white/5',
    },

    card: {
        base: `${effects.rounded.xl} ${effects.glass.light}border-white/10 ${effects.shadow.md} ${effects.transition.base}`,
        hover: 'hover:${effects.glass.medium} hover:border-white/20 ${effects.hover.shadow',
        interactive: `${effects.hover.lift}`,

        strong: `${effects.rounded.xl} ${effects.glass.strong} border-2 border-white/20 ${effects.shadow.lg}`,
    },

    iconContainer: {
        base: `flex items-center justify-center ${effects.rounded.full} ${gradients.primary} ${effects.shadow.base}`,
        sizes: {
        sm: 'w-14 h-14',
        md: 'w-20 h-20',
        lg: 'w-24 h-24',
        xl: 'w-28 h-28'
        },
    },
} as const;


export const animations = {
    fadeIn:{
        initial: {opacity: 0},
        animate: {opacity: 1},
        transition: {duration: 0.6, ease: [0.4, 0, 0.2,1]},
    },

    fadeInUp: {
        initial: {opacity: 0, y:20},
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: [0.4, 0, 0.2,1] },
    },

    fadeInLeft: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.5 },
    },
  
    scaleIn: {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.5, ease:[0.4, 0, 0.2, 1] },
    },
    
    hoverLift: {
        whileHover: { scale: 1.05, y: -10 },
        transition: { duration: 0.2 },
    },
    
    hoverScale: {
        whileHover: { y: -4},
        transition: { duration: 0.2, ease: 'easeOut' },
    }, 
} as const;

