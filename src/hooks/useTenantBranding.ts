
import { useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';

export function useTenantBranding() {
  const { tenant } = useTenant();

  useEffect(() => {
    if (!tenant) return;

    // Update CSS custom properties for tenant branding
    const root = document.documentElement;
    
    // Convert hex color to HSL for CSS variables
    const hexToHsl = (hex: string) => {
      // Remove the hash if present
      const cleanHex = hex.replace('#', '');
      
      // Convert hex to RGB
      const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
      const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
      const b = parseInt(cleanHex.slice(4, 6), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
      };
    };

    // Get HSL values from the primary color
    const hslColor = hexToHsl(tenant.primaryColor);
    const hslString = `${hslColor.h} ${hslColor.s}% ${hslColor.l}%`;

    // Update all primary color variants
    root.style.setProperty('--primary', hslString);
    root.style.setProperty('--electric-500', hslString);
    
    // Update brand color variables
    root.style.setProperty('--brand-h', hslColor.h.toString());
    root.style.setProperty('--brand-s', `${hslColor.s}%`);
    root.style.setProperty('--brand-l', `${hslColor.l}%`);

    // Update sidebar colors to use the brand color
    root.style.setProperty('--sidebar-primary', hslString);
    root.style.setProperty('--sidebar-accent', `${hslColor.h} ${hslColor.s}% ${Math.max(hslColor.l - 40, 10)}%`);

    // Update ring color for focus states
    root.style.setProperty('--ring', hslString);
    root.style.setProperty('--sidebar-ring', hslString);

    // Apply theme mode from settings
    if (tenant.settings) {
      const themeMode = tenant.settings.theme_mode || 'dark';
      if (themeMode === 'light') {
        root.classList.add('light');
      } else {
        root.classList.remove('light');
      }
    }

    // Update page title
    document.title = `${tenant.name} - ScrimStats Dashboard`;

    // Force a repaint to ensure all styles are applied
    setTimeout(() => {
      document.body.style.display = 'none';
      document.body.offsetHeight; // Trigger reflow
      document.body.style.display = '';
    }, 50);

  }, [tenant]);

  return { tenant };
}
