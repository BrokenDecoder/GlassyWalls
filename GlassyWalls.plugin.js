/**
 * @name GlassyWalls
 * @author NetherDevs
 * @authorId 
 * @version 1.2.0
 * @description A premium BetterDiscord plugin that applies a stunning glassmorphism theme to Discord, scrapes 4kwallpapers.com in real-time to load beautiful backgrounds with a smooth cross-fade, and automatically adjusts theme colors to match the image.
 * @invite 
 * @donate 
 * @patreon 
 * @website 
 * @source https://github.com/BrokenDecoder/GlassyWalls
 * @updateUrl 
 */

const { DOM, UI, Data, Net } = BdApi;

const escapeHTML = (str) => {
    if (!str) return "";
    return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag]));
};

// Curated Unsplash wallpapers used as offline/first-run fallbacks
const WALLPAPERS = [
    {
        name: "Neon City",
        url: "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?q=80&w=1920",
        bgRgb: "20, 16, 28",
        chatRgb: "12, 10, 18",
        headerRgb: "20, 16, 28",
        panelsRgb: "24, 20, 32",
        accentRgb: "255, 102, 204",
        accentHsl: "320, 100%, 70%"
    },
    {
        name: "Emerald Forest",
        url: "https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=1920",
        bgRgb: "12, 24, 18",
        chatRgb: "8, 16, 12",
        headerRgb: "12, 24, 18",
        panelsRgb: "16, 32, 24",
        accentRgb: "23, 207, 115",
        accentHsl: "150, 80%, 45%"
    },
    {
        name: "Deep Space",
        url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1920",
        bgRgb: "10, 14, 26",
        chatRgb: "6, 8, 16",
        headerRgb: "10, 14, 26",
        panelsRgb: "14, 18, 32",
        accentRgb: "51, 204, 255",
        accentHsl: "195, 100%, 60%"
    },
    {
        name: "Pastel Sunset",
        url: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?q=80&w=1920",
        bgRgb: "32, 24, 38",
        chatRgb: "22, 16, 28",
        headerRgb: "32, 24, 38",
        panelsRgb: "38, 30, 46",
        accentRgb: "250, 140, 80",
        accentHsl: "25, 90%, 65%"
    },
    {
        name: "Golden Hour",
        url: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?q=80&w=1920",
        bgRgb: "26, 18, 12",
        chatRgb: "18, 12, 8",
        headerRgb: "26, 18, 12",
        panelsRgb: "32, 22, 14",
        accentRgb: "242, 193, 38",
        accentHsl: "45, 95%, 55%"
    },
    {
        name: "Minimalist Slate",
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920",
        bgRgb: "22, 22, 24",
        chatRgb: "16, 16, 18",
        headerRgb: "22, 22, 24",
        panelsRgb: "28, 28, 32",
        accentRgb: "198, 120, 245",
        accentHsl: "280, 75%, 70%"
    }
];

const THEME_CSS = `
/* GlassyWalls Custom Variable System */
:root {
    --glassy-blur: 15px;
    --glassy-opacity: 0.45;
    --glassy-opacity-chat: calc(var(--glassy-opacity) - 0.1);
    --glassy-opacity-header: calc(var(--glassy-opacity) + 0.1);
    --glassy-opacity-panels: calc(var(--glassy-opacity) + 0.05);
    
    --glassy-bg-rgb: 15, 15, 20;
    --glassy-bg-chat-rgb: 10, 10, 12;
    --glassy-bg-header-rgb: 15, 15, 20;
    --glassy-bg-panels-rgb: 20, 20, 25;
    
    --glassy-accent: 255, 102, 204;
    --glassy-accent-hsl: 320, 100%, 70%;
    
    /* Directional Light Borders */
    --glassy-border-top: rgba(255, 255, 255, 0.12);
    --glassy-border-left: rgba(255, 255, 255, 0.08);
    --glassy-border-right: rgba(255, 255, 255, 0.03);
    --glassy-border-bottom: rgba(255, 255, 255, 0.02);
    
    /* 3D Depth Shadows */
    --glassy-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.35);
    --glassy-inner-shadow: inset 0 0 0 1px rgba(255,255,255,0.03);

    --glassy-text-glow: rgba(var(--glassy-accent), 0.55);
    --glassy-noise-opacity: 0.04;
}

/* Third-Party Theme Integration (ClearVision, BasicBackground, etc.) */
/* Global: suppress external backgrounds, link accent & shading to GlassyWalls */
:root, .theme-dark, .theme-light, .theme-darker, .theme-midnight,
:is(.theme-light, .theme-dark .theme-light),
:is(.theme-dark, .theme-light .theme-dark),
:is(.theme-darker, .theme-light .theme-darker),
:is(.theme-midnight, .theme-light .theme-midnight) {
    /* Kill external theme backgrounds — GlassyWalls owns the wallpaper layer */
    --background-image: none !important;
    --background-filter: none !important;
    --user-popout-image: none !important;
    --user-popout-filter: none !important;
    --user-modal-image: none !important;
    --user-modal-filter: none !important;

    /* Pipe dynamic accent into ClearVision + Discord brand variables */
    --main-color: rgb(var(--glassy-accent)) !important;
    --hover-color: rgba(var(--glassy-accent), 0.75) !important;
    --focus-color: rgba(var(--glassy-accent), 0.5) !important;
    --channel-selected-bg: rgba(var(--glassy-accent), 0.18) !important;
    --channel-unread: rgb(var(--glassy-accent)) !important;
    --channel-unread-hover: rgba(var(--glassy-accent), 0.85) !important;
    --brand-500: rgb(var(--glassy-accent)) !important;
    --brand-560: rgba(var(--glassy-accent), 0.9) !important;
    --brand-600: rgba(var(--glassy-accent), 0.8) !important;

    /* Link ClearVision shading to GlassyWalls dynamic opacity */
    --background-shading: rgba(var(--glassy-bg-rgb), var(--glassy-opacity)) !important;
    --card-shading: rgba(var(--glassy-bg-rgb), calc(var(--glassy-opacity) + 0.08)) !important;
    --popout-shading: rgba(var(--glassy-bg-rgb), calc(var(--glassy-opacity) + 0.2)) !important;
    --modal-shading: rgba(var(--glassy-bg-rgb), calc(var(--glassy-opacity) + 0.15)) !important;
    --input-shading: rgba(0, 0, 0, 0.3) !important;
    --background-shading-percent: 0% !important;
}

/* Plugin-side glassmorphism for overlay surfaces (works without theme) */
/* Context Menus */
[class*="menu_"] {
    background: linear-gradient(145deg,
        rgba(var(--glassy-bg-rgb), calc(var(--glassy-opacity) + 0.25)) 0%,
        rgba(var(--glassy-bg-rgb), calc(var(--glassy-opacity) + 0.15)) 100%) !important;
    backdrop-filter: blur(calc(var(--glassy-blur) + 5px)) saturate(1.4) !important;
    -webkit-backdrop-filter: blur(calc(var(--glassy-blur) + 5px)) saturate(1.4) !important;
    border: 1px solid rgba(255,255,255,0.08) !important;
    border-radius: 12px !important;
    box-shadow: 0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06) !important;
}
[class*="menu_"] [class*="item_"]:hover {
    background: rgba(var(--glassy-accent), 0.12) !important;
    border-radius: 6px !important;
}

/* User Popouts */
[class*="userPopout_"], [class*="userPopoutOuter_"] {
    background: linear-gradient(160deg,
        rgba(var(--glassy-bg-rgb), calc(var(--glassy-opacity) + 0.22)) 0%,
        rgba(var(--glassy-bg-panels-rgb), calc(var(--glassy-opacity) + 0.15)) 100%) !important;
    backdrop-filter: blur(calc(var(--glassy-blur) + 8px)) saturate(1.5) !important;
    -webkit-backdrop-filter: blur(calc(var(--glassy-blur) + 8px)) saturate(1.5) !important;
    border: 1px solid rgba(255,255,255,0.07) !important;
    border-radius: 14px !important;
    box-shadow: 0 16px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05) !important;
}

/* Modals */
[class*="modal_"][class*="root_"], [class*="modalContent_"] {
    background: linear-gradient(140deg,
        rgba(var(--glassy-bg-rgb), calc(var(--glassy-opacity) + 0.22)) 0%,
        rgba(var(--glassy-bg-rgb), calc(var(--glassy-opacity) + 0.12)) 100%) !important;
    backdrop-filter: blur(calc(var(--glassy-blur) + 6px)) saturate(1.3) !important;
    -webkit-backdrop-filter: blur(calc(var(--glassy-blur) + 6px)) saturate(1.3) !important;
    border: 1px solid rgba(255,255,255,0.06) !important;
    border-radius: 16px !important;
    box-shadow: 0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05) !important;
}

/* Emoji / GIF / Sticker Picker */
[class*="emojiPicker_"], [class*="stickerPicker_"], [class*="contentWrapper_"][class*="picker_"] {
    background: linear-gradient(150deg,
        rgba(var(--glassy-bg-rgb), calc(var(--glassy-opacity) + 0.25)) 0%,
        rgba(var(--glassy-bg-rgb), calc(var(--glassy-opacity) + 0.18)) 100%) !important;
    backdrop-filter: blur(calc(var(--glassy-blur) + 8px)) saturate(1.5) !important;
    -webkit-backdrop-filter: blur(calc(var(--glassy-blur) + 8px)) saturate(1.5) !important;
    border: 1px solid rgba(255,255,255,0.06) !important;
    border-radius: 12px !important;
}

/* Autocomplete / Mention dropdown */
[class*="autocomplete_"] {
    background: linear-gradient(160deg,
        rgba(var(--glassy-bg-rgb), calc(var(--glassy-opacity) + 0.3)) 0%,
        rgba(var(--glassy-bg-rgb), calc(var(--glassy-opacity) + 0.2)) 100%) !important;
    backdrop-filter: blur(calc(var(--glassy-blur) + 10px)) saturate(1.6) !important;
    -webkit-backdrop-filter: blur(calc(var(--glassy-blur) + 10px)) saturate(1.6) !important;
    border: 1px solid rgba(255,255,255,0.08) !important;
    border-radius: 12px !important;
    box-shadow: 0 12px 40px rgba(0,0,0,0.5) !important;
}
[class*="autocomplete_"] [class*="selected_"] {
    background: rgba(var(--glassy-accent), 0.15) !important;
}

/* Tooltips */
[class*="tooltip_"] {
    background: rgba(var(--glassy-bg-rgb), 0.85) !important;
    backdrop-filter: blur(12px) !important;
    -webkit-backdrop-filter: blur(12px) !important;
    border: 1px solid rgba(255,255,255,0.06) !important;
    border-radius: 8px !important;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important;
}

/* Embed Cards */
[class*="embedWrapper_"] {
    background: rgba(var(--glassy-bg-rgb), calc(var(--glassy-opacity) + 0.1)) !important;
    border-left: 3px solid rgba(var(--glassy-accent), 0.5) !important;
    border-radius: 8px !important;
}

/* Code Blocks */
[class*="markup_"] pre, [class*="markup_"] code {
    background: rgba(0,0,0,0.35) !important;
    border: 1px solid rgba(255,255,255,0.05) !important;
    border-radius: 8px !important;
}

/* Premium Scrollbars */
::-webkit-scrollbar { width: 6px !important; }
::-webkit-scrollbar-track { background: transparent !important; }
::-webkit-scrollbar-thumb {
    background: rgba(var(--glassy-accent), 0.25) !important;
    border-radius: 6px !important;
}
::-webkit-scrollbar-thumb:hover {
    background: rgba(var(--glassy-accent), 0.45) !important;
}

/* Background layers */
.glassy-wall-bg-1, .glassy-wall-bg-2 {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-size: cover;
    background-position: center;
    z-index: -100;
    pointer-events: none;
    transition: opacity 0.8s ease-in-out;
}

/* Noise texture overlay */
.glassy-noise-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -99;
    pointer-events: none;
    opacity: var(--glassy-noise-opacity);
    mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

/* Global transparent overrides */
.theme-dark, .theme-light,
#app-mount,
body,
[class^="app_"],
[class^="bg_"],
[class*="chat_"],
[class*="container_b2ca13"],
[class*="panels_"] [class*="container_"],
[class*="chatContent_"],
[class*="layer_"],
[class*="base_"],
[class*="userProfileOuter_"],
[class*="userProfileInner_"],
[class*="profilePanel_"],
[class*="userPanel_"],
[class*="membersWrap_"],
[class*="wrapper_"][class*="guilds_"] [class*="scroller_"],
[class*="sidebar_"],
[class*="callContainer_"],
[class*="channelChatWrapper_"] {
    background: transparent !important;
}

/* normal mode with blurs */
html:not(.glassy-performance-mode) [class*="sidebar_"] {
    background: linear-gradient(135deg, rgba(var(--glassy-bg-rgb), var(--glassy-opacity)) 0%, rgba(var(--glassy-bg-rgb), calc(var(--glassy-opacity) - 0.1)) 100%) !important;
    border-right: 1px solid var(--glassy-border-right) !important;
    box-shadow: var(--glassy-shadow), var(--glassy-inner-shadow) !important;
}
html:not(.glassy-performance-mode) [class*="chatContent_"],
html:not(.glassy-performance-mode) aside[class^="chat_"],
html:not(.glassy-performance-mode) [class*="channelChatWrapper_"] {
    background: linear-gradient(135deg, rgba(var(--glassy-bg-chat-rgb), var(--glassy-opacity-chat)) 0%, rgba(var(--glassy-bg-chat-rgb), calc(var(--glassy-opacity-chat) - 0.1)) 100%) !important;
    box-shadow: var(--glassy-inner-shadow) !important;
}
html:not(.glassy-performance-mode) [class*="title_"][class*="container_"] {
    background: linear-gradient(135deg, rgba(var(--glassy-bg-header-rgb), var(--glassy-opacity-header)) 0%, rgba(var(--glassy-bg-header-rgb), calc(var(--glassy-opacity-header) - 0.1)) 100%) !important;
    border-bottom: 1px solid var(--glassy-border-bottom) !important;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2), var(--glassy-inner-shadow) !important;
}
html:not(.glassy-performance-mode) [class*="membersWrap_"],
html:not(.glassy-performance-mode) [class*="members_"],
html:not(.glassy-performance-mode) [class*="userProfileOuter_"],
html:not(.glassy-performance-mode) [class*="profilePanel_"],
html:not(.glassy-performance-mode) [class*="userPanel_"] {
    background: linear-gradient(135deg, rgba(var(--glassy-bg-rgb), var(--glassy-opacity)) 0%, rgba(var(--glassy-bg-rgb), calc(var(--glassy-opacity) - 0.1)) 100%) !important;
    border-left: 1px solid var(--glassy-border-left) !important;
    box-shadow: var(--glassy-shadow), var(--glassy-inner-shadow) !important;
}
html:not(.glassy-performance-mode) [class*="panels_"] {
    background: linear-gradient(135deg, rgba(var(--glassy-bg-panels-rgb), var(--glassy-opacity-panels)) 0%, rgba(var(--glassy-bg-panels-rgb), calc(var(--glassy-opacity-panels) - 0.1)) 100%) !important;
    border-top: 1px solid var(--glassy-border-top) !important;
    box-shadow: var(--glassy-shadow), var(--glassy-inner-shadow) !important;
}
html:not(.glassy-performance-mode) [class*="standardSidebarView_"],
html:not(.glassy-performance-mode) [class*="callContainer_"] {
    background: linear-gradient(135deg, rgba(var(--glassy-bg-rgb), var(--glassy-opacity)) 0%, rgba(var(--glassy-bg-rgb), calc(var(--glassy-opacity) - 0.1)) 100%) !important;
    box-shadow: var(--glassy-inner-shadow) !important;
}

/* performance mode (GPU saver, higher opacity, no blur) */
html.glassy-performance-mode [class*="sidebar_"] {
    background: rgba(var(--glassy-bg-rgb), calc(var(--glassy-opacity) + 0.35)) !important;
    border-right: 1px solid var(--glassy-border-right) !important;
}
html.glassy-performance-mode [class*="chatContent_"],
html.glassy-performance-mode aside[class^="chat_"],
html.glassy-performance-mode [class*="channelChatWrapper_"] {
    background: rgba(var(--glassy-bg-chat-rgb), calc(var(--glassy-opacity-chat) + 0.35)) !important;
}
html.glassy-performance-mode [class*="title_"][class*="container_"] {
    background: rgba(var(--glassy-bg-header-rgb), calc(var(--glassy-opacity-header) + 0.35)) !important;
    border-bottom: 1px solid var(--glassy-border-bottom) !important;
}
html.glassy-performance-mode [class*="membersWrap_"],
html.glassy-performance-mode [class*="members_"],
html.glassy-performance-mode [class*="userProfileOuter_"],
html.glassy-performance-mode [class*="profilePanel_"],
html.glassy-performance-mode [class*="userPanel_"] {
    background: rgba(var(--glassy-bg-rgb), calc(var(--glassy-opacity) + 0.35)) !important;
    border-left: 1px solid var(--glassy-border-left) !important;
}
html.glassy-performance-mode [class*="panels_"] {
    background: rgba(var(--glassy-bg-panels-rgb), calc(var(--glassy-opacity-panels) + 0.35)) !important;
    border-top: 1px solid var(--glassy-border-top) !important;
}
html.glassy-performance-mode [class*="standardSidebarView_"],
html.glassy-performance-mode [class*="callContainer_"] {
    background: rgba(var(--glassy-bg-rgb), calc(var(--glassy-opacity) + 0.35)) !important;
}

[class*="privateChannels_"] {
    background: transparent !important;
}

/* Left-most Guilds column */
[class*="wrapper_"][class*="guilds_"] {
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.4) 100%) !important;
    border-right: 1px solid var(--glassy-border-right) !important;
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3) !important;
}

/* Text Input Box */
[class*="channelTextArea_"] {
    background: rgba(0, 0, 0, 0.3) !important;
    border: 1px solid var(--glassy-border) !important;
    border-radius: 12px !important;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2) !important;
}
[class*="scrollableContainer_"] {
    background: transparent !important;
}

/* Discover/Shop pages */
[class*="peopleColumn_"],
[class*="pageWrapper_"] {
    background: var(--glassy-bg-chat) !important;
}
[class*="sidebarRegion_"] {
    background: rgba(0, 0, 0, 0.2) !important;
}
[class*="contentRegion_"] {
    background: transparent !important;
}

/* Glow effects for active states */
[class*="selected_"] [class*="link_"],
[class*="selected_"] [class*="name_"],
[class*="unreadImportant_"],
[class*="highlighted_"] {
    text-shadow: 0 0 8px var(--glassy-text-glow) !important;
}

/* Hover and active color overrides matching chosen HSL */
.theme-dark, .theme-light {
    --brand-experiment: rgb(var(--glassy-accent)) !important;
    --brand-experiment-500: rgb(var(--glassy-accent)) !important;
    --brand-experiment-600: rgba(var(--glassy-accent), 0.8) !important;
    --brand-experiment-560: rgba(var(--glassy-accent), 0.9) !important;
}

/* Micro-animations for interactive elements */
[class*="interactive_"]:hover,
[class*="channel_"]:hover {
    transform: translateX(4px);
    transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
    background: rgba(var(--glassy-accent), 0.1) !important;
}

/* Windows Title Bar & Branding */
[class*="typeWindows_"] {
    background: #000000 !important; /* Fully opaque */
    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
    z-index: 1000;
}

/* Hide Discord AND ClearVision wordmarks */
[class*="wordmark_"] svg,
[class*="wordmark_"] span,
[class*="wordmark_"] a {
    display: none !important;
    visibility: hidden !important;
}

/* Override ClearVision ::before AND set our ::after */
[class*="wordmark_"]::before {
    content: "" !important;
    display: none !important;
}

[class*="wordmark_"]::after {
    content: "GlassyWalls by xashu/Dev" !important;
    position: absolute !important;
    top: 50% !important;
    left: 8px !important;
    transform: translateY(-50%) !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    font-family: 'Inter', 'Segoe UI', sans-serif !important;
    background: linear-gradient(135deg, #fff 20%, rgb(var(--glassy-accent)) 100%) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    white-space: nowrap !important;
    pointer-events: none !important;
    display: block !important;
    visibility: visible !important;
}

/* Switcher Floating Widget UI styling */
.glassy-switcher-btn {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--interactive-normal, #b9bbbe);
    transition: background-color 0.2s ease, color 0.2s ease;
    margin-right: 4px;
}
.glassy-switcher-btn:hover {
    background-color: var(--background-modifier-hover, rgba(79,84,92,0.16));
    color: var(--interactive-hover, #dcddde);
}
.glassy-switcher-btn svg {
    width: 20px;
    height: 20px;
}

.glassy-menu {
    position: fixed;
    bottom: 60px;
    left: 80px;
    width: 320px;
    background: rgba(15, 15, 20, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255,255,255,0.05);
    backdrop-filter: blur(25px);
    -webkit-backdrop-filter: blur(25px);
    z-index: 9999;
    padding: 18px;
    font-family: 'Inter', 'Segoe UI', sans-serif;
    color: #eef2f3;
    opacity: 0;
    transform: scale(0.9) translateY(20px);
    pointer-events: none;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    max-height: 80vh;
    overflow-y: auto;
}
.glassy-menu::-webkit-scrollbar {
    width: 4px;
}
.glassy-menu::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1);
    border-radius: 4px;
}
.glassy-menu.active {
    opacity: 1;
    transform: scale(1) translateY(0);
    pointer-events: auto;
}

.glassy-menu-title {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 4px;
    background: linear-gradient(135deg, #fff 30%, rgba(var(--glassy-accent), 0.9) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    display: flex;
    align-items: center;
    gap: 8px;
}
.glassy-menu-subtitle {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.4);
    margin-bottom: 16px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
}

.glassy-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 16px;
    max-height: 200px;
    overflow-y: auto;
    padding-right: 4px;
}
.glassy-grid::-webkit-scrollbar {
    width: 4px;
}
.glassy-grid::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1);
    border-radius: 4px;
}

.glassy-card {
    position: relative;
    height: 75px;
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.2s ease;
    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
}
.glassy-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(0,0,0,0.25);
}
.glassy-card.active {
    border-color: rgb(var(--glassy-accent)) !important;
    box-shadow: 0 0 10px rgba(var(--glassy-accent), 0.5);
}
.glassy-card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: brightness(0.6);
    transition: filter 0.2s ease;
}
.glassy-card:hover .glassy-card-img {
    filter: brightness(0.85);
}
.glassy-card-label {
    position: absolute;
    bottom: 8px;
    left: 8px;
    font-size: 10px;
    font-weight: 600;
    color: white;
    text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    right: 20px;
}
.glassy-card-delete {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgba(0,0,0,0.6);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    line-height: 1;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s ease, background-color 0.2s ease;
}
.glassy-card:hover .glassy-card-delete {
    opacity: 1;
}
.glassy-card-delete:hover {
    background: rgba(255, 50, 50, 0.8) !important;
}

.glassy-control-group {
    margin-bottom: 12px;
    border-top: 1px solid rgba(255,255,255,0.06);
    padding-top: 12px;
}
.glassy-control-label {
    font-size: 11px;
    font-weight: 600;
    margin-bottom: 6px;
    color: rgba(255,255,255,0.6);
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.glassy-slider {
    width: 100%;
    -webkit-appearance: none;
    background: rgba(255,255,255,0.1);
    height: 6px;
    border-radius: 3px;
    outline: none;
}
.glassy-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: rgb(var(--glassy-accent));
    cursor: pointer;
    box-shadow: 0 0 5px rgba(var(--glassy-accent), 0.5);
    transition: transform 0.1s ease;
}
.glassy-slider::-webkit-slider-thumb:hover {
    transform: scale(1.25);
}

.glassy-input-url-container {
    display: flex;
    gap: 8px;
    width: 100%;
}
.glassy-input-url {
    flex-grow: 1;
    background: rgba(0,0,0,0.4);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 8px 12px;
    color: white;
    font-size: 11px;
    outline: none;
    box-sizing: border-box;
    transition: all 0.2s ease;
}
.glassy-input-url:focus {
    border-color: rgb(var(--glassy-accent)) !important;
    box-shadow: 0 0 8px rgba(var(--glassy-accent), 0.3);
}

.glassy-preset-add-btn {
    background: rgba(var(--glassy-accent), 0.2);
    border: 1px solid rgba(var(--glassy-accent), 0.4);
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
}
.glassy-preset-add-btn:hover {
    background: rgba(var(--glassy-accent), 0.4);
    box-shadow: 0 0 10px rgba(var(--glassy-accent), 0.5);
}

/* Checkbox and dropdown styles */
.glassy-switch-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}
.glassy-switch {
    position: relative;
    display: inline-block;
    width: 38px;
    height: 20px;
    flex-shrink: 0;
}
.glassy-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}
.glassy-switch-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255,255,255,0.1);
    transition: .3s;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.05);
}
.glassy-switch-slider:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: .3s;
    border-radius: 50%;
}
input:checked + .glassy-switch-slider {
    background-color: rgba(var(--glassy-accent), 0.6);
}
input:checked + .glassy-switch-slider:before {
    transform: translateX(18px);
}

.glassy-dropdown {
    background: rgba(0,0,0,0.4);
    border: 1px solid rgba(255,255,255,0.1);
    color: white;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 11px;
    outline: none;
    cursor: pointer;
}

.glassy-color-group {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}
.glassy-color-picker-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
}
.glassy-color-input {
    -webkit-appearance: none;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    background: transparent;
    padding: 0;
}
.glassy-color-input::-webkit-color-swatch-wrapper {
    padding: 0;
}
.glassy-color-input::-webkit-color-swatch {
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 50%;
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}
.glassy-btn {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.8);
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s ease;
}
.glassy-btn:hover {
    background: rgba(var(--glassy-accent), 0.2);
    border-color: rgba(var(--glassy-accent), 0.4);
    color: white;
}

/* Spinner Animation */
.glassy-loading-spinner {
    grid-column: span 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 120px;
    gap: 12px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 11px;
}
.glassy-loading-spinner svg {
    width: 28px;
    height: 28px;
    animation: rotate 2s linear infinite;
}
.glassy-loading-spinner .path {
    stroke: rgb(var(--glassy-accent));
    stroke-linecap: round;
    animation: dash 1.5s ease-in-out infinite;
}
@keyframes rotate {
    100% { transform: rotate(360deg); }
}
@keyframes dash {
    0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
    50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
    100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
}

/* Tab Switcher */
.glassy-tabs-container {
    display: flex;
    margin-bottom: 15px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.05);
}
.glassy-tab {
    flex: 1;
    text-align: center;
    padding: 8px 0;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
    transition: all 0.2s ease;
}
.glassy-tab.active {
    background: rgba(var(--glassy-accent), 0.3);
    color: white;
}
.glassy-tab:hover:not(.active) {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
}
`;

module.exports = class GlassyWalls {
    constructor() {
        this.bgLayer1 = null;
        this.bgLayer2 = null;
        this.activeLayer = null;
        this.noiseOverlay = null;
        this.switcherBtn = null;
        this.switcherMenu = null;
        
        this.wallpapersLoaded = false;
        this.scrapedWallpapersList = [];
        this.activeFeedType = "images";
        this.rotateIntervalId = null;
        
        // Default saved configurations
        this.settings = {
            activeWallpaper: 0,
            blurStrength: 15,
            customUrl: "",
            customColors: null,
            
            // New settings fields
            glassOpacity: 0.45,
            textureIntensity: 0.04,
            autoRotate: false,
            rotateInterval: 3600000, // 1 hour in ms
            performanceMode: false,
            manualAccent: "",
            myPresets: []
        };
    }

    start() {
        // Load settings
        const savedSettings = Data.load("GlassyWalls", "settings");
        if (savedSettings) {
            this.settings = Object.assign(this.settings, savedSettings);
        }

        // Add core theme styles
        DOM.addStyle("glassyWallsStyles", THEME_CSS);

        // Inject elements
        this.initBackgroundLayers();
        this.initNoiseOverlay();
        this.initSwitcherUI();
        this.initWordmarkOverride();

        // Apply selected config on start
        this.applySelectedWallpaper();
        this.updateAutoRotate();
        this.updatePerformanceModeClass();

        // Apply saved slider values to CSS variables on startup
        document.documentElement.style.setProperty("--glassy-opacity", this.settings.glassOpacity);
        document.documentElement.style.setProperty("--glassy-blur", `${this.settings.blurStrength}px`);
        document.documentElement.style.setProperty("--glassy-noise-opacity", this.settings.textureIntensity);
    }

    saveSettings() {
        Data.save("GlassyWalls", "settings", this.settings);
    }

    stop() {
        // Remove style sheet
        DOM.removeStyle("glassyWallsStyles");

        // Remove intervals
        if (this.rotateIntervalId) {
            clearInterval(this.rotateIntervalId);
            this.rotateIntervalId = null;
        }

        // Stop wordmark and account observers
        if (this.wordmarkObserver) {
            this.wordmarkObserver.disconnect();
            this.wordmarkObserver = null;
        }
        if (this.accountObserver) {
            this.accountObserver.disconnect();
            this.accountObserver = null;
        }

        // Remove DOM nodes
        if (this.bgLayer1) this.bgLayer1.remove();
        if (this.bgLayer2) this.bgLayer2.remove();
        if (this.noiseOverlay) this.noiseOverlay.remove();
        if (this.switcherBtn) this.switcherBtn.remove();
        if (this.switcherMenu) this.switcherMenu.remove();

        // Clean up theme class overrides
        document.body.classList.remove("theme-light", "theme-dark");
        document.documentElement.classList.remove("glassy-performance-mode");
        document.documentElement.style.removeProperty("--text-normal");
        document.documentElement.style.removeProperty("--text-muted");
        document.documentElement.style.removeProperty("--header-primary");

        // Clean up global references
        this.bgLayer1 = null;
        this.bgLayer2 = null;
        this.activeLayer = null;
        this.noiseOverlay = null;
        this.switcherBtn = null;
        this.switcherMenu = null;
    }

    // DOM-based wordmark override that persists over ClearVision
    initWordmarkOverride() {
        const brandText = "GlassyWalls";
        const authorText = "by xashu/Dev";

        const applyWordmark = () => {
            const wordmarkEls = document.querySelectorAll('[class*="wordmark_"]');
            wordmarkEls.forEach(el => {
                // Clear all children (SVGs, spans, etc.)
                el.innerHTML = '';
                el.style.cssText = 'position: relative; display: flex; align-items: center; gap: 5px; overflow: visible;';

                // Create brand span
                const brand = document.createElement('span');
                brand.textContent = brandText;
                brand.className = 'glassy-wordmark-brand';
                brand.style.cssText = `
                    font-size: 12px;
                    font-weight: 800;
                    font-family: 'Inter', 'Segoe UI', sans-serif;
                    background: linear-gradient(135deg, #fff 20%, rgb(var(--glassy-accent)) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    white-space: nowrap;
                    pointer-events: none;
                    letter-spacing: 0.5px;
                `;

                // Create author span
                const author = document.createElement('span');
                author.textContent = authorText;
                author.className = 'glassy-wordmark-author';
                author.style.cssText = `
                    font-size: 10px;
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.4);
                    font-family: 'Inter', 'Segoe UI', sans-serif;
                    white-space: nowrap;
                    pointer-events: none;
                `;

                el.appendChild(brand);
                el.appendChild(author);
            });
        };

        // Apply immediately
        applyWordmark();

        // Observe for ClearVision re-injections
        this.wordmarkObserver = new MutationObserver(() => {
            const wordmarkEls = document.querySelectorAll('[class*="wordmark_"]');
            for (const el of wordmarkEls) {
                if (!el.querySelector('.glassy-wordmark-brand')) {
                    applyWordmark();
                    break;
                }
            }
        });

        this.wordmarkObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    initBackgroundLayers() {
        this.bgLayer1 = document.createElement("div");
        this.bgLayer1.className = "glassy-wall-bg-1";
        this.bgLayer1.style.opacity = "0";

        this.bgLayer2 = document.createElement("div");
        this.bgLayer2.className = "glassy-wall-bg-2";
        this.bgLayer2.style.opacity = "0";

        document.body.appendChild(this.bgLayer1);
        document.body.appendChild(this.bgLayer2);

        this.activeLayer = this.bgLayer1;
    }

    initNoiseOverlay() {
        this.noiseOverlay = document.createElement("div");
        this.noiseOverlay.className = "glassy-noise-overlay";
        document.body.appendChild(this.noiseOverlay);
    }

    initSwitcherUI() {
        // Create switcher floating button
        this.switcherBtn = document.createElement("div");
        this.switcherBtn.className = "glassy-switcher-btn";
        this.switcherBtn.title = "Customize Background & Theme";
        this.switcherBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19C5.03345 19.1749 5.0999 19.4318 5.03154 19.6738C4.85899 20.2847 4.75 20.9168 4.75 21.5C4.75 21.7761 4.97386 22 5.25 22H12Z" />
                <circle cx="7.5" cy="10.5" r="1.5" fill="currentColor"/>
                <circle cx="11.5" cy="7.5" r="1.5" fill="currentColor"/>
                <circle cx="16.5" cy="9.5" r="1.5" fill="currentColor"/>
                <circle cx="15.5" cy="14.5" r="1.5" fill="currentColor"/>
            </svg>
        `;

        // Wait for Account panel to exist and inject using the User Settings button as an anchor
        this.accountObserver = new MutationObserver(() => {
            const settingsBtn = document.querySelector('button[aria-label="User Settings"]');
            if (settingsBtn) {
                const buttonsContainer = settingsBtn.parentElement;
                if (buttonsContainer && !buttonsContainer.querySelector('.glassy-switcher-btn')) {
                    buttonsContainer.insertBefore(this.switcherBtn, buttonsContainer.firstChild);
                }
            }
        });
        this.accountObserver.observe(document.body, { childList: true, subtree: true });

        // Create switcher menu
        this.switcherMenu = document.createElement("div");
        this.switcherMenu.className = "glassy-menu";

        this.switcherMenu.innerHTML = `
            <div class="glassy-menu-title" style="display: flex; justify-content: space-between; align-items: center;">
                <span style="display: flex; align-items: center; gap: 8px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    GlassyWalls
                </span>
                <button id="glassy-refresh-feed-btn" class="glassy-btn" style="padding: 4px 8px; font-size: 10px; display: flex; align-items: center; gap: 4px;" title="Fetch new wallpapers">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                    Refresh
                </button>
            </div>
            <div class="glassy-menu-subtitle">Theme Customizer</div>
            
            <div class="glassy-tabs-container">
                <div class="glassy-tab active" data-tab="images">Images</div>
                <div class="glassy-tab" data-tab="videos">Videos</div>
            </div>
            
            <!-- Grid Container -->
            <div class="glassy-grid" id="glassy-grid-container">
                <div class="glassy-loading-spinner">
                    <svg class="spinner" viewBox="0 0 50 50">
                        <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
                    </svg>
                    <span>Click palette to fetch feed...</span>
                </div>
            </div>

            <!-- Custom URL Input & Preset Save -->
            <div class="glassy-control-group">
                <div class="glassy-control-label">Custom Image URL</div>
                <div class="glassy-input-url-container">
                    <input class="glassy-input-url" id="glassy-custom-url" type="text" placeholder="Paste Unsplash or direct image URL..." value="${this.settings.customUrl || ''}">
                    <button class="glassy-preset-add-btn" id="glassy-add-preset-btn" title="Save current setup as preset">+</button>
                </div>
            </div>

            <!-- Opacity & Texture Sliders -->
            <div class="glassy-control-group">
                <div class="glassy-control-label">
                    <span>Glass Opacity</span>
                    <span id="glassy-opacity-value">${Math.round(this.settings.glassOpacity * 100)}%</span>
                </div>
                <input class="glassy-slider" id="glassy-opacity-slider" type="range" min="10" max="95" value="${Math.round(this.settings.glassOpacity * 100)}">
            </div>

            <div class="glassy-control-group" id="glassy-blur-group">
                <div class="glassy-control-label">
                    <span>Blur Strength</span>
                    <span id="glassy-blur-value">${this.settings.blurStrength}px</span>
                </div>
                <input class="glassy-slider" id="glassy-blur-slider" type="range" min="0" max="30" value="${this.settings.blurStrength}">
            </div>

            <div class="glassy-control-group">
                <div class="glassy-control-label">
                    <span>Glass Texture Intensity</span>
                    <span id="glassy-texture-value">${Math.round(this.settings.textureIntensity * 100)}%</span>
                </div>
                <input class="glassy-slider" id="glassy-texture-slider" type="range" min="0" max="20" value="${Math.round(this.settings.textureIntensity * 100)}">
            </div>

            <!-- Manual Accent Override Color Picker -->
            <div class="glassy-color-group">
                <span class="glassy-control-label" style="margin-bottom:0;">Manual Accent Color</span>
                <div class="glassy-color-picker-wrap">
                    <input type="color" class="glassy-color-input" id="glassy-accent-picker" value="${this.settings.manualAccent || '#ff66cc'}">
                    <button class="glassy-btn" id="glassy-accent-reset">Reset</button>
                </div>
            </div>

            <!-- Auto-Rotate & GPU Saver Switches -->
            <div class="glassy-switch-container">
                <span class="glassy-control-label" style="margin-bottom:0;">Auto-Rotate Slideshow</span>
                <label class="glassy-switch">
                    <input type="checkbox" id="glassy-rotate-mode" ${this.settings.autoRotate ? 'checked' : ''}>
                    <span class="glassy-switch-slider"></span>
                </label>
            </div>

            <div class="glassy-switch-container" id="glassy-interval-group" style="${this.settings.autoRotate ? '' : 'display: none;'}">
                <span class="glassy-control-label" style="margin-bottom:0;">Rotation Interval</span>
                <select class="glassy-dropdown" id="glassy-rotate-interval">
                    <option value="60000" ${this.settings.rotateInterval === 60000 ? 'selected' : ''}>1 Minute</option>
                    <option value="300000" ${this.settings.rotateInterval === 300000 ? 'selected' : ''}>5 Minutes</option>
                    <option value="900000" ${this.settings.rotateInterval === 900000 ? 'selected' : ''}>15 Minutes</option>
                    <option value="3600000" ${this.settings.rotateInterval === 3600000 ? 'selected' : ''}>1 Hour</option>
                    <option value="86400000" ${this.settings.rotateInterval === 86400000 ? 'selected' : ''}>1 Day</option>
                </select>
            </div>

            <div class="glassy-switch-container">
                <span class="glassy-control-label" style="margin-bottom:0; flex-direction:column; align-items:flex-start;">
                    <span>Performance Mode</span>
                    <span style="font-size:9px; color:rgba(255,255,255,0.3); font-weight:normal;">GPU Saver - Removes real-time blurs</span>
                </span>
                <label class="glassy-switch">
                    <input type="checkbox" id="glassy-performance-mode" ${this.settings.performanceMode ? 'checked' : ''}>
                    <span class="glassy-switch-slider"></span>
                </label>
            </div>
        `;
        document.body.appendChild(this.switcherMenu);

        // Click to toggle menu and load wallpapers dynamically
        this.switcherBtn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const isActive = this.switcherMenu.classList.toggle("active");
            if (isActive) {
                await this.loadWallpapersList();
            }
        });

        // Close menu on clicking outside
        document.addEventListener("click", (e) => {
            if (!this.switcherMenu.contains(e.target) && e.target !== this.switcherBtn && !this.switcherBtn.contains(e.target)) {
                this.switcherMenu.classList.remove("active");
            }
        });

        const refreshBtn = this.switcherMenu.querySelector("#glassy-refresh-feed-btn");
        if (refreshBtn) {
            refreshBtn.addEventListener("click", async (e) => {
                e.stopPropagation();
                const svg = refreshBtn.querySelector("svg");
                if (svg) svg.style.animation = "rotate 1s linear infinite";
                await this.loadWallpapersList(true);
                if (svg) svg.style.animation = "";
            });
        }

        const tabs = this.switcherMenu.querySelectorAll(".glassy-tab");
        tabs.forEach(tab => {
            tab.addEventListener("click", async (e) => {
                e.stopPropagation();
                if (tab.classList.contains("active")) return;
                
                tabs.forEach(t => t.classList.remove("active"));
                tab.classList.add("active");
                
                this.activeFeedType = tab.getAttribute("data-tab");
                await this.loadWallpapersList();
            });
        });

        // Setup Opacity Slider
        const opacitySlider = this.switcherMenu.querySelector("#glassy-opacity-slider");
        const opacityValLabel = this.switcherMenu.querySelector("#glassy-opacity-value");
        opacitySlider.addEventListener("input", (e) => {
            const val = parseFloat(e.target.value) / 100;
            opacityValLabel.textContent = `${e.target.value}%`;
            document.documentElement.style.setProperty("--glassy-opacity", val);
            this.settings.glassOpacity = val;
            this.saveSettings();
        });

        // Setup Blur Slider
        const blurSlider = this.switcherMenu.querySelector("#glassy-blur-slider");
        const blurValueLabel = this.switcherMenu.querySelector("#glassy-blur-value");
        blurSlider.addEventListener("input", (e) => {
            const val = parseInt(e.target.value);
            blurValueLabel.textContent = `${val}px`;
            document.documentElement.style.setProperty("--glassy-blur", `${val}px`);
            this.settings.blurStrength = val;
            this.saveSettings();
        });

        // Setup Texture Slider
        const textureSlider = this.switcherMenu.querySelector("#glassy-texture-slider");
        const textureValueLabel = this.switcherMenu.querySelector("#glassy-texture-value");
        textureSlider.addEventListener("input", (e) => {
            const val = parseFloat(e.target.value) / 100;
            textureValueLabel.textContent = `${e.target.value}%`;
            document.documentElement.style.setProperty("--glassy-noise-opacity", val);
            this.settings.textureIntensity = val;
            this.saveSettings();
        });

        // Setup Manual Accent Color Picker
        const colorPicker = this.switcherMenu.querySelector("#glassy-accent-picker");
        colorPicker.addEventListener("input", (e) => {
            const hex = e.target.value;
            this.settings.manualAccent = hex;
            this.saveSettings();
            this.applyManualAccent(hex);
        });

        const resetAccentBtn = this.switcherMenu.querySelector("#glassy-accent-reset");
        resetAccentBtn.addEventListener("click", () => {
            this.settings.manualAccent = "";
            this.saveSettings();
            
            // Reapply colors from active wallpaper
            this.applySelectedWallpaper();
            
            // Sync picker value back in UI
            const activeAccent = getComputedStyle(document.documentElement).getPropertyValue("--glassy-accent").trim();
            if (activeAccent) {
                const rgb = activeAccent.split(",").map(c => parseInt(c.trim()));
                if (rgb.length === 3) {
                    colorPicker.value = this.rgbToHex(rgb[0], rgb[1], rgb[2]);
                }
            }
        });

        // Setup Preset Save (+) Button
        const addPresetBtn = this.switcherMenu.querySelector("#glassy-add-preset-btn");
        const customUrlInput = this.switcherMenu.querySelector("#glassy-custom-url");
        addPresetBtn.addEventListener("click", () => {
            const url = customUrlInput.value.trim();
            if (url) {
                this.saveCurrentSetupAsPreset(url);
            } else {
                UI.showToast("Paste a custom URL first!", {type: "warning"});
            }
        });

        customUrlInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const url = customUrlInput.value.trim();
                if (url) {
                    this.settings.customUrl = url;
                    this.settings.activeWallpaper = -1;
                    this.saveSettings();
                    
                    UI.showToast("Extracting colors and loading wallpaper...", {type: "info"});
                    this.extractColorAndApply(url);
                }
            }
        });

        // Setup Auto-Rotate Checkbox
        const rotateCheckbox = this.switcherMenu.querySelector("#glassy-rotate-mode");
        const intervalGroup = this.switcherMenu.querySelector("#glassy-interval-group");
        rotateCheckbox.addEventListener("change", (e) => {
            const checked = e.target.checked;
            this.settings.autoRotate = checked;
            intervalGroup.style.display = checked ? "" : "none";
            this.saveSettings();
            this.updateAutoRotate();
        });

        // Setup Rotation Interval Dropdown
        const intervalDropdown = this.switcherMenu.querySelector("#glassy-rotate-interval");
        intervalDropdown.addEventListener("change", (e) => {
            const val = parseInt(e.target.value);
            this.settings.rotateInterval = val;
            this.saveSettings();
            this.updateAutoRotate();
        });

        // Setup Performance Mode Checkbox
        const perfCheckbox = this.switcherMenu.querySelector("#glassy-performance-mode");
        const blurGroup = this.switcherMenu.querySelector("#glassy-blur-group");
        perfCheckbox.addEventListener("change", (e) => {
            const checked = e.target.checked;
            this.settings.performanceMode = checked;
            blurGroup.style.display = checked ? "none" : "";
            this.saveSettings();
            this.updatePerformanceModeClass();
        });
    }

    applyManualAccent(hex) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return;
        const [h, s, l] = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        document.documentElement.style.setProperty("--glassy-accent", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
        document.documentElement.style.setProperty("--glassy-accent-hsl", `${h}, ${s}%, ${l}%`);
        document.documentElement.style.setProperty("--glassy-text-glow", `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.55)`);
    }

    saveCurrentSetupAsPreset(url) {
        if (!this.settings.myPresets) this.settings.myPresets = [];
        
        // Find if preset already exists
        const exists = this.settings.myPresets.some(p => p.url === url);
        if (exists) {
            UI.showToast("Preset already saved!", {type: "warning"});
            return;
        }

        const name = `Preset ${this.settings.myPresets.length + 1}`;
        const colors = this.settings.customColors || {
            bgRgb: "22, 22, 24",
            chatRgb: "16, 16, 18",
            headerRgb: "22, 22, 24",
            panelsRgb: "28, 28, 32",
            accentRgb: "198, 120, 245",
            accentHsl: "280, 75%, 70%"
        };

        this.settings.myPresets.push({
            name: name,
            url: url,
            colors: colors,
            isPreset: true
        });

        this.saveSettings();
        UI.showToast(`Saved preset: ${name}`, {type: "success"});

        // Force rebuild of list
        this.wallpapersLoaded = false;
        this.loadWallpapersList();
    }

    deletePreset(presetIdx, event) {
        if (event) event.stopPropagation();
        if (!this.settings.myPresets) return;
        
        const removed = this.settings.myPresets.splice(presetIdx, 1)[0];
        this.saveSettings();
        UI.showToast(`Deleted preset: ${removed.name}`, {type: "info"});

        // Force rebuild of list
        this.wallpapersLoaded = false;
        this.loadWallpapersList();
    }

    updatePerformanceModeClass() {
        if (this.settings.performanceMode) {
            document.documentElement.classList.add("glassy-performance-mode");
        } else {
            document.documentElement.classList.remove("glassy-performance-mode");
        }
    }

    updateAutoRotate() {
        if (this.rotateIntervalId) {
            clearInterval(this.rotateIntervalId);
            this.rotateIntervalId = null;
        }

        if (this.settings.autoRotate) {
            this.rotateIntervalId = setInterval(() => {
                this.cycleWallpaper();
            }, this.settings.rotateInterval);
        }
    }

    cycleWallpaper() {
        let list = this.scrapedWallpapersList.length > 0 ? this.scrapedWallpapersList : WALLPAPERS;
        
        // Merge user presets
        if (this.settings.myPresets && this.settings.myPresets.length > 0) {
            list = [...this.settings.myPresets, ...list];
        }

        if (list.length === 0) return;

        let currentIdx = -1;
        if (this.settings.customUrl) {
            currentIdx = list.findIndex(wp => wp.url === this.settings.customUrl || wp.detailUrl === this.settings.customUrl);
        } else {
            currentIdx = this.settings.activeWallpaper;
        }

        let nextIdx = (currentIdx + 1) % list.length;
        if (nextIdx < 0) nextIdx = 0;

        const wp = list[nextIdx];
        if (wp.isPreset) {
            this.settings.customUrl = wp.url;
            this.settings.customColors = wp.colors;
            this.settings.activeWallpaper = -1;
            this.saveSettings();
            this.applySelectedWallpaper();
        } else if (wp.detailUrl) {
            // Live wallpaper (Wallhaven/Picsum)
            this.handleWallpaperSelect(wp);
        } else {
            // Curated offline wallpaper
            this.settings.customUrl = "";
            this.settings.customColors = null;
            this.settings.activeWallpaper = nextIdx;
            this.saveSettings();
            this.applySelectedWallpaper();
        }

        this.updateActiveCardInUI();
    }

    updateActiveCardInUI() {
        const container = this.switcherMenu?.querySelector("#glassy-grid-container");
        if (!container) return;
        const cards = container.querySelectorAll(".glassy-card");
        cards.forEach(card => {
            card.classList.remove("active");
            
            const isPreset = card.classList.contains("glassy-preset-card");
            if (isPreset) {
                const presetIdx = parseInt(card.getAttribute("data-preset-idx"));
                const p = this.settings.myPresets?.[presetIdx];
                if (p && this.settings.customUrl === p.url) {
                    card.classList.add("active");
                }
            } else {
                const idx = parseInt(card.getAttribute("data-index"));
                const live = card.getAttribute("data-live") === "true";
                if (live) {
                    const wp = this.scrapedWallpapersList?.[idx];
                    if (wp && (this.settings.customUrl === wp.thumbUrl || this.settings.customUrl === wp.url)) {
                        card.classList.add("active");
                    }
                } else {
                    if (!this.settings.customUrl && this.settings.activeWallpaper === idx) {
                        card.classList.add("active");
                    }
                }
            }
        });
    }

    async fetchTextNode(targetUrl) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 seconds timeout limit
        
        try {
            // Use BdApi.Net.fetch to securely bypass CORS without third-party proxies
            const response = await Net.fetch(targetUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            
            return await response.text();
        } catch (e) {
            clearTimeout(timeoutId);
            throw e;
        }
    }

    async scrapeMotionBgs(forceRefresh = false) {
        try {
            const page = forceRefresh ? Math.floor(Math.random() * 5) + 1 : 1;
            const url = page > 1 ? `https://motionbgs.com/${page}/` : `https://motionbgs.com/`;
            const html = await this.fetchTextNode(url);
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            
            // Find wallpaper links. Use getAttribute to avoid baseURI manipulation by Discord
            const linkEls = Array.from(doc.querySelectorAll('a')).filter(a => {
                const href = a.getAttribute('href');
                return href && 
                       href.startsWith('/') &&
                       href.length > 2 && // Not just '/'
                       !href.includes(':') && // categories use tag:name
                       !href.includes('/page') && 
                       !href.includes('4k') && 
                       !href.includes('mobile') && 
                       !href.includes('gifs') &&
                       !href.includes('dl') &&
                       !href.includes('page/') &&
                       a.querySelector('img');
            });
            
            // Filter unique by href
            const uniqueLinkEls = linkEls.filter((link, index, self) => 
                index === self.findIndex((t) => t.getAttribute('href') === link.getAttribute('href'))
            ).slice(0, 16);
            
            if (uniqueLinkEls.length === 0) throw new Error("No videos found on MotionBGs");

            // We must fetch each subpage to find the direct MP4 download link
            const promises = uniqueLinkEls.map(async (link) => {
                try {
                    const thumbImg = link.querySelector('img');
                    const thumbSrc = thumbImg ? (thumbImg.getAttribute('data-src') || thumbImg.getAttribute('src')) : null;
                    const thumbUrl = thumbSrc && thumbSrc.startsWith('http') ? thumbSrc : (thumbSrc ? `https://motionbgs.com${thumbSrc.startsWith('/') ? '' : '/'}${thumbSrc}` : null);
                    
                    const name = thumbImg ? thumbImg.getAttribute('alt') || "MotionBGs Video" : "MotionBGs Video";
                    
                    const hrefAttr = link.getAttribute('href');
                    const fullHref = hrefAttr.startsWith('http') ? hrefAttr : `https://motionbgs.com${hrefAttr.startsWith('/') ? '' : '/'}${hrefAttr}`;
                    
                    const subHtml = await this.fetchTextNode(fullHref);
                    const subDoc = parser.parseFromString(subHtml, "text/html");
                    
                    let dlHref = null;

                    // First try to find a video tag directly
                    const videoTag = subDoc.querySelector('video source') || subDoc.querySelector('video');
                    if (videoTag && videoTag.getAttribute('src')) {
                        dlHref = videoTag.getAttribute('src');
                    } else {
                        // Fallback to /dl/ links
                        const dlLink = Array.from(subDoc.querySelectorAll('a')).find(a => {
                            const h = a.getAttribute('href');
                            return h && h.includes('/dl/');
                        });
                        if (dlLink) dlHref = dlLink.getAttribute('href');
                    }
                    
                    if (!dlHref) return null;
                    
                    const fullDlUrl = dlHref.startsWith('http') ? dlHref : `https://motionbgs.com${dlHref.startsWith('/') ? '' : '/'}${dlHref}`;
                    
                    return {
                        name: name,
                        url: fullDlUrl,
                        thumbUrl: thumbUrl,
                        source: "motionbgs",
                        colors: null
                    };
                } catch (e) {
                    return null;
                }
            });
            
            const results = await Promise.all(promises);
            const validWallpapers = results.filter(w => w !== null);
            
            if (validWallpapers.length === 0) throw new Error("Failed to extract video links");
            
            this.scrapedWallpapersList = validWallpapers;
            return validWallpapers;
        } catch (e) {
            console.error("[GlassyWalls] MotionBGs scrape failed:", e);
            UI.showToast(`Video Scraper: Failed to fetch videos (${e.message})`, {type: "warning"});
            return [];
        }
    }

    async fetchWallpapers(forceRefresh = false) {
        if (this.activeFeedType === "videos") {
            return await this.scrapeMotionBgs(forceRefresh);
        }

        try {
            // 1. Try fetching from Wallhaven.cc API (filtering strictly for Anime!)
            const seed = forceRefresh ? `&seed=${Math.random().toString(36).substring(7)}` : "";
            const sorting = forceRefresh ? "random" : "hot";
            const jsonText = await this.fetchTextNode(`https://wallhaven.cc/api/v1/search?categories=010&sorting=${sorting}&purity=100${seed}`);
            const res = JSON.parse(jsonText);
            if (!res || !res.data || res.data.length === 0) throw new Error("No Wallhaven results");

            // Load 24 trending wallpapers!
            const wallpapers = res.data.slice(0, 24).map(wp => {
                let colors = null;
                if (wp.colors && wp.colors.length > 0) {
                    const hex = wp.colors[0];
                    const rgb = this.hexToRgb(hex);
                    if (rgb) {
                        const [h, s, l] = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
                        const accH = h;
                        const accS = Math.min(100, Math.max(55, s + 15));
                        const accL = Math.max(45, Math.min(70, l));
                        const [accR, accG, accB] = this.hslToRgb(accH / 360, accS / 100, accL / 100);

                        colors = {
                            bgRgb: `${Math.max(10, rgb.r - 30)}, ${Math.max(10, rgb.g - 30)}, ${Math.max(10, rgb.b - 30)}`,
                            chatRgb: `${Math.max(5, rgb.r - 35)}, ${Math.max(5, rgb.g - 35)}, ${Math.max(5, rgb.b - 35)}`,
                            headerRgb: `${Math.max(10, rgb.r - 30)}, ${Math.max(10, rgb.g - 30)}, ${Math.max(10, rgb.b - 30)}`,
                            panelsRgb: `${Math.max(15, rgb.r - 25)}, ${Math.max(15, rgb.g - 25)}, ${Math.max(15, rgb.b - 25)}`,
                            accentRgb: `${accR}, ${accG}, ${accB}`,
                            accentHsl: `${accH}, ${accS}%, ${accL}%`,
                            lightness: l
                        };
                    }
                }

                return {
                    name: `Wallhaven #${wp.id}`,
                    url: wp.path,
                    thumbUrl: wp.thumbs.large,
                    source: "wallhaven",
                    colors: colors
                };
            });

            this.scrapedWallpapersList = wallpapers;
            return wallpapers;
        } catch (e) {
            console.warn("[GlassyWalls] Wallhaven search failed. Trying Picsum Photos directly...", e);
            try {
                // 2. Try fetching from Picsum Photos API DIRECTLY (it supports CORS natively, loading 30 wallpapers!)
                const page = forceRefresh ? Math.floor(Math.random() * 10) + 1 : 1;
                const response = await Net.fetch(`https://picsum.photos/v2/list?limit=30&page=${page}`);
                if (!response.ok) throw new Error(`Picsum HTTP Error: ${response.status}`);
                
                const res = await response.json();
                if (!res || res.length === 0) throw new Error("No Picsum results");

                const wallpapers = res.map(wp => {
                    return {
                        name: `Photo by ${wp.author}`,
                        url: `https://picsum.photos/id/${wp.id}/1920/1080`,
                        thumbUrl: `https://picsum.photos/id/${wp.id}/300/200`,
                        source: "picsum",
                        colors: null // Will be parsed locally when clicked
                    };
                });

                this.scrapedWallpapersList = wallpapers;
                return wallpapers;
            } catch (err2) {
                console.error("[GlassyWalls] All scraping sources failed.", err2);
                UI.showToast(`Live Scraper: Failed to fetch feed (${err2.message})`, {type: "warning"});
                return [];
            }
        }
    }

    async loadWallpapersList(forceRefresh = false) {
        const container = this.switcherMenu?.querySelector("#glassy-grid-container");
        if (!container) return;
        
        if (this.wallpapersLoaded && !forceRefresh) return;

        container.innerHTML = `
            <div class="glassy-loading-spinner">
                <svg class="spinner" viewBox="0 0 50 50">
                    <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
                </svg>
                <span>Loading Wallpapers...</span>
            </div>
        `;

        let list = await this.fetchWallpapers(forceRefresh);
        let isLive = true;
        
        if (list.length === 0) {
            list = WALLPAPERS;
            isLive = false;
        } else {
            this.wallpapersLoaded = true;
        }

        // Render HTML
        let htmlContent = "";

        // First render user presets if any exist
        if (this.settings.myPresets && this.settings.myPresets.length > 0) {
            htmlContent += this.settings.myPresets.map((preset, index) => {
                const isActive = this.settings.customUrl === preset.url;
                const isVideo = preset.url.match(/\.(mp4|webm|ogg)(\?.*)?$/i);
                const mediaElement = isVideo 
                    ? `<video class="glassy-card-img" src="${escapeHTML(preset.url)}" autoplay loop muted playsinline></video>` 
                    : `<img class="glassy-card-img" src="${escapeHTML(preset.url)}" alt="${escapeHTML(preset.name)}">`;
                
                return `
                    <div class="glassy-card glassy-preset-card ${isActive ? 'active' : ''}" data-preset-idx="${index}">
                        ${mediaElement}
                        <div class="glassy-card-label">${escapeHTML(preset.name)}</div>
                        <div class="glassy-card-delete" data-preset-idx="${index}">&times;</div>
                    </div>
                `;
            }).join("");
        }

        // Next render default/scraped list
        htmlContent += list.map((wp, index) => {
            const isActive = (!isLive && this.settings.activeWallpaper === index) || 
                             (isLive && this.settings.customUrl === wp.url);
            const mediaUrl = isLive ? wp.thumbUrl : wp.url;
            const isVideo = mediaUrl.match(/\.(mp4|webm|ogg)(\?.*)?$/i);
            const mediaElement = isVideo
                ? `<video class="glassy-card-img" src="${escapeHTML(mediaUrl)}" autoplay loop muted playsinline></video>`
                : `<img class="glassy-card-img" src="${escapeHTML(mediaUrl)}" alt="${escapeHTML(wp.name)}">`;

            return `
                <div class="glassy-card ${isActive ? 'active' : ''}" data-index="${index}" data-live="${isLive}">
                    ${mediaElement}
                    <div class="glassy-card-label">${escapeHTML(wp.name)}</div>
                </div>
            `;
        }).join("");

        container.innerHTML = htmlContent;

        // Ensure thumbnail videos loop
        const thumbVids = container.querySelectorAll("video.glassy-card-img");
        thumbVids.forEach(v => {
            v.loop = true;
            v.addEventListener("ended", () => {
                v.currentTime = 0;
                v.play().catch(() => {});
            });
        });

        // Setup Card Select Click Listeners
        const cards = container.querySelectorAll(".glassy-card");
        cards.forEach(card => {
            // Delete preset click
            const delBtn = card.querySelector(".glassy-card-delete");
            if (delBtn) {
                delBtn.addEventListener("click", (e) => {
                    const presetIdx = parseInt(delBtn.getAttribute("data-preset-idx"));
                    this.deletePreset(presetIdx, e);
                });
            }

            card.addEventListener("click", (e) => {
                if (e.target.classList.contains("glassy-card-delete")) return;

                cards.forEach(c => c.classList.remove("active"));
                card.classList.add("active");
                
                if (card.classList.contains("glassy-preset-card")) {
                    const presetIdx = parseInt(card.getAttribute("data-preset-idx"));
                    const preset = this.settings.myPresets[presetIdx];
                    
                    this.settings.customUrl = preset.url;
                    this.settings.customColors = preset.colors;
                    this.settings.activeWallpaper = -1;
                    this.saveSettings();
                    this.applySelectedWallpaper();
                } else {
                    const idx = parseInt(card.getAttribute("data-index"));
                    const live = card.getAttribute("data-live") === "true";
                    const wp = list[idx];

                    if (live) {
                        this.settings.customUrl = wp.url;
                        this.settings.activeWallpaper = -1;
                        this.saveSettings();
                        if (wp.colors) {
                            this.settings.customColors = wp.colors;
                            this.applySelectedWallpaper();
                        } else {
                            this.settings.customColors = null;
                            this.extractColorAndApply(wp.url);
                        }
                    } else {
                        this.settings.customUrl = "";
                        this.settings.customColors = null;
                        this.settings.activeWallpaper = idx;
                        this.saveSettings();
                        this.applySelectedWallpaper();
                    }
                }
            });
        });
    }

    ensureValidColors(colors) {
        if (!colors) return null;
        
        // If it is in the old format (has glassColor but no bgRgb)
        if (colors.glassColor && !colors.bgRgb) {
            const extractRgb = (rgbaStr) => {
                if (!rgbaStr) return null;
                const match = rgbaStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                return match ? `${match[1]}, ${match[2]}, ${match[3]}` : null;
            };
            
            colors.bgRgb = extractRgb(colors.glassColor) || "22, 22, 24";
            colors.chatRgb = extractRgb(colors.glassColorChat) || "16, 16, 18";
            colors.headerRgb = extractRgb(colors.glassColorHeader) || "22, 22, 24";
            colors.panelsRgb = extractRgb(colors.glassColorPanels) || "28, 28, 32";
        }
        
        // Make sure it has accentRgb and accentHsl
        if (!colors.accentRgb) colors.accentRgb = "198, 120, 245";
        if (!colors.accentHsl) colors.accentHsl = "280, 75%, 70%";
        
        return colors;
    }

    applySelectedWallpaper() {
        // Apply configurations to CSS variables
        document.documentElement.style.setProperty("--glassy-opacity", this.settings.glassOpacity);
        document.documentElement.style.setProperty("--glassy-blur", `${this.settings.blurStrength}px`);
        document.documentElement.style.setProperty("--glassy-noise-opacity", this.settings.textureIntensity);

        if (this.settings.customUrl) {
            // Validate and migrate colors
            this.settings.customColors = this.ensureValidColors(this.settings.customColors);
            this.saveSettings();

            if (this.settings.customColors) {
                this.applyThemeColors(this.settings.customUrl, this.settings.customColors);
            } else {
                this.extractColorAndApply(this.settings.customUrl);
            }
            return;
        }

        const wp = WALLPAPERS[this.settings.activeWallpaper] || WALLPAPERS[0];
        const colors = {
            bgRgb: wp.bgRgb,
            chatRgb: wp.chatRgb,
            headerRgb: wp.headerRgb,
            panelsRgb: wp.panelsRgb,
            accentRgb: wp.accentRgb,
            accentHsl: wp.accentHsl
        };

        this.applyThemeColors(wp.url, colors);
    }

    applyThemeColors(imageUrl, colors) {
        colors = this.ensureValidColors(colors);
        if (!colors) {
            colors = {
                bgRgb: "22, 22, 24",
                chatRgb: "16, 16, 18",
                headerRgb: "22, 22, 24",
                panelsRgb: "28, 28, 32",
                accentRgb: "198, 120, 245",
                accentHsl: "280, 75%, 70%"
            };
        }

        // Swap background layers with cross-fade
        const inactiveLayer = this.activeLayer === this.bgLayer1 ? this.bgLayer2 : this.bgLayer1;
        const isVideo = imageUrl.match(/\.(mp4|webm|ogg)(\?.*)?$/i);
        
        const fadeLayer = () => {
            inactiveLayer.style.opacity = "1";
            this.activeLayer.style.opacity = "0";
            this.activeLayer = inactiveLayer;
            
            setTimeout(() => {
                if (this.activeLayer === inactiveLayer) {
                    const oldLayer = inactiveLayer === this.bgLayer1 ? this.bgLayer2 : this.bgLayer1;
                    oldLayer.innerHTML = "";
                    oldLayer.style.backgroundImage = "none";
                }
            }, 800);
        };

        if (isVideo) {
            inactiveLayer.innerHTML = `<video autoplay loop muted playsinline style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0;"><source src="${escapeHTML(imageUrl)}"></video>`;
            inactiveLayer.style.backgroundImage = "none";
            
            const vid = inactiveLayer.querySelector("video");
            vid.loop = true;
            vid.addEventListener("ended", () => {
                vid.currentTime = 0;
                vid.play().catch(() => {});
            });
            if (vid.readyState >= 3) {
                fadeLayer();
            } else {
                vid.addEventListener("canplay", fadeLayer, { once: true });
            }
            
            vid.onerror = () => {
                UI.showToast("Failed to load video wallpaper.", {type: "error"});
                // Fallback to fading empty layer to prevent stuck transitions
                fadeLayer();
            };
        } else {
            inactiveLayer.innerHTML = "";
            // Preload image before swapping to avoid blank flash
            const img = new Image();
            img.onload = () => {
                inactiveLayer.style.backgroundImage = `url("${imageUrl}")`;
                fadeLayer();
            };
            img.onerror = () => {
                // If direct URL fails, try proxying through weserv
                const proxied = `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}&w=1920&q=85`;
                console.warn("[GlassyWalls] Direct image load failed, trying proxy:", imageUrl);
                inactiveLayer.style.backgroundImage = `url("${proxied}")`;
                fadeLayer();
            };
            img.src = imageUrl;
        }

        // Apply theme color parameters to CSS properties
        document.documentElement.style.setProperty("--glassy-bg-rgb", colors.bgRgb);
        document.documentElement.style.setProperty("--glassy-bg-chat-rgb", colors.chatRgb);
        document.documentElement.style.setProperty("--glassy-bg-header-rgb", colors.headerRgb);
        document.documentElement.style.setProperty("--glassy-bg-panels-rgb", colors.panelsRgb);

        // Apply manual override if present, else apply extracted values
        if (this.settings.manualAccent) {
            this.applyManualAccent(this.settings.manualAccent);
        } else {
            document.documentElement.style.setProperty("--glassy-accent", colors.accentRgb);
            document.documentElement.style.setProperty("--glassy-accent-hsl", colors.accentHsl);
            document.documentElement.style.setProperty("--glassy-text-glow", `rgba(${colors.accentRgb}, 0.55)`);
        }

        // Apply Day/Night adaptation
        if (colors.lightness !== undefined) {
            this.updateDiscordThemeClass(colors.lightness);
        } else {
            // Curated wallpapers or legacy fallbacks - parse lightness dynamically
            const rgb = colors.bgRgb.split(",").map(c => parseInt(c.trim()));
            if (rgb.length === 3) {
                const [, , l] = this.rgbToHsl(rgb[0], rgb[1], rgb[2]);
                this.updateDiscordThemeClass(l);
            }
        }
    }

    extractColorAndApply(url) {
        return new Promise((resolve) => {
            const isVideo = url.match(/\.(mp4|webm|ogg)(\?.*)?$/i);
            const extractFromSource = (source) => {
                try {
                    const canvas = document.createElement("canvas");
                    canvas.width = 10;
                    canvas.height = 10;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(source, 0, 0, 10, 10);
                    const data = ctx.getImageData(0, 0, 10, 10).data;
                    
                    let r = 0, g = 0, b = 0, count = 0;
                    for (let i = 0; i < data.length; i += 4) {
                        if (data[i + 3] < 128) continue;
                        r += data[i];
                        g += data[i + 1];
                        b += data[i + 2];
                        count++;
                    }
                    
                    if (count === 0) count = 1;
                    r = Math.round(r / count);
                    g = Math.round(g / count);
                    b = Math.round(b / count);

                    const [h, s, l] = this.rgbToHsl(r, g, b);
                    const accentH = h;
                    const accentS = Math.min(100, Math.max(55, s + 15));
                    const accentL = Math.max(45, Math.min(70, l));

                    const [accR, accG, accB] = this.hslToRgb(accentH / 360, accentS / 100, accentL / 100);

                    const colors = {
                        bgRgb: `${Math.max(10, r - 30)}, ${Math.max(10, g - 30)}, ${Math.max(10, b - 30)}`,
                        chatRgb: `${Math.max(5, r - 35)}, ${Math.max(5, g - 35)}, ${Math.max(5, b - 35)}`,
                        headerRgb: `${Math.max(10, r - 30)}, ${Math.max(10, g - 30)}, ${Math.max(10, b - 30)}`,
                        panelsRgb: `${Math.max(15, r - 25)}, ${Math.max(15, g - 25)}, ${Math.max(15, b - 25)}`,
                        accentRgb: `${accR}, ${accG}, ${accB}`,
                        accentHsl: `${accentH}, ${accentS}%, ${accentL}%`,
                        lightness: l
                    };

                    this.settings.customColors = colors;
                    this.saveSettings();

                    this.applyThemeColors(url, colors);
                    UI.showToast("Theme generated successfully!", {type: "success"});
                    resolve();
                } catch (e) {
                    console.error("[GlassyWalls] Canvas extraction error:", e);
                    this.applyFallbackColors(url);
                    resolve();
                }
            };

            if (isVideo) {
                const vid = document.createElement("video");
                vid.crossOrigin = "anonymous";
                vid.muted = true;
                vid.autoplay = true;
                vid.onloadeddata = () => {
                    extractFromSource(vid);
                    vid.remove();
                };
                vid.onerror = () => {
                    console.error("[GlassyWalls] Video load failed for extraction.");
                    this.applyFallbackColors(url);
                    resolve();
                };
                vid.src = url;
            } else {
                const img = new Image();
                img.crossOrigin = "anonymous";
                // Route images through weserv.nl to allow CORS-exempt pixel analysis in canvas
                img.src = url.startsWith("data:") ? url : `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=150`;
                
                img.onload = () => extractFromSource(img);
                img.onerror = () => {
                    console.error("[GlassyWalls] Image load failed.");
                    this.applyFallbackColors(url);
                    resolve();
                };
            }
        });
    }

    applyFallbackColors(url) {
        const fallback = {
            bgRgb: "22, 22, 24",
            chatRgb: "16, 16, 18",
            headerRgb: "22, 22, 24",
            panelsRgb: "28, 28, 32",
            accentRgb: "198, 120, 245",
            accentHsl: "280, 75%, 70%",
            lightness: 10
        };
        this.settings.customColors = fallback;
        this.saveSettings();
        this.applyThemeColors(url, fallback);
        UI.showToast("Loaded image (accent color defaulted due to CORS limit).", {type: "info"});
    }

    updateDiscordThemeClass(lightness) {
        const isLight = lightness > 60;
        const el = document.body;
        if (isLight) {
            el.classList.remove("theme-dark");
            el.classList.add("theme-light");
            
            // Set text light-theme variables
            document.documentElement.style.setProperty("--text-normal", "#1e1f22");
            document.documentElement.style.setProperty("--text-muted", "#4e5058");
            document.documentElement.style.setProperty("--header-primary", "#060607");
        } else {
            el.classList.remove("theme-light");
            el.classList.add("theme-dark");
            
            // Remove text color overrides so Discord applies dark theme text color variables
            document.documentElement.style.removeProperty("--text-normal");
            document.documentElement.style.removeProperty("--text-muted");
            document.documentElement.style.removeProperty("--header-primary");
        }
    }

    // Helper functions for color spaces
    rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    }

    hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    rgbToHex(r, g, b) {
        const toHex = (c) => {
            const hex = c.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        };
        return "#" + toHex(r) + toHex(g) + toHex(b);
    }
};
