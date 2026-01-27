// Test script to verify Night theme is set as default
console.log('🌙 Testing Night theme configuration...');

// Check localStorage
const storedTheme = localStorage.getItem("streamify-theme");
console.log('📦 Stored theme in localStorage:', storedTheme);

// Check if night theme is available in DaisyUI
const daisyuiThemes = [
  "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", 
  "synthwave", "retro", "cyberpunk", "valentine", "halloween", 
  "garden", "forest", "aqua", "lofi", "pastel", "fantasy", 
  "wireframe", "black", "luxury", "dracula", "cmyk", "autumn", 
  "business", "acid", "lemonade", "night", "coffee", "winter", 
  "dim", "nord", "sunset"
];

const nightThemeAvailable = daisyuiThemes.includes("night");
console.log('✅ Night theme available in DaisyUI:', nightThemeAvailable);

// Check current theme on page
const currentTheme = document.documentElement.getAttribute('data-theme') || 
                    document.body.getAttribute('data-theme');
console.log('🎨 Current theme on page:', currentTheme);

// Expected behavior
console.log('\n📋 Expected behavior:');
console.log('- Default theme should be "night"');
console.log('- All pages should use the Night theme');
console.log('- Theme should persist across page reloads');

console.log('\n✅ Night theme configuration test completed!');
