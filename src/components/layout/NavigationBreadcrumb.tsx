
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export const NavigationBreadcrumb: React.FC = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const getBreadcrumbLabel = (segment: string, index: number) => {
    switch (segment) {
      case 'overview': return 'Overview';
      case 'players': return 'Players';
      case 'scrims': return 'Scrims';
      case 'analytics': return 'Analytics';
      case 'calendar': return 'Calendar';
      case 'soloq': return 'SoloQ Tracker';
      case 'settings': return 'Settings';
      case 'game': return 'Game Details';
      default:
        // For dynamic segments like IDs, show first 8 characters
        if (segment.length > 8) {
          return `${segment.slice(0, 8)}...`;
        }
        return segment.charAt(0).toUpperCase() + segment.slice(1);
    }
  };

  const getBreadcrumbPath = (index: number) => {
    return '/' + pathSegments.slice(0, index + 1).join('/');
  };

  if (pathSegments.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
      <Link 
        to="/overview" 
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {pathSegments.map((segment, index) => {
        const isLast = index === pathSegments.length - 1;
        const path = getBreadcrumbPath(index);
        const label = getBreadcrumbLabel(segment, index);

        return (
          <React.Fragment key={path}>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link 
                to={path}
                className={cn(
                  "hover:text-foreground transition-colors",
                  index === 0 && "font-medium"
                )}
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
