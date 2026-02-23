
export const environment = {
  // App info
  name: 'ScrimStats Dashboard',
  version: '1.0.0',
  
  // Environment
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Supabase
  supabaseUrl: 'https://tvcgjehreaayfazlhvps.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Y2dqZWhyZWFheWZhemxodnBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5OTUwNTYsImV4cCI6MjA2MzU3MTA1Nn0.Mw722LOzUVJo1SyU7rr_VLw8Jq_ZY4eG87DsuFDqWjI',
  
  // Features
  features: {
    analytics: true,
    monitoring: true,
    errorLogging: true,
    performanceTracking: true,
    debugMode: import.meta.env.DEV
  },
  
  // Limits and thresholds
  limits: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxErrorLogs: 50,
    queryStaleTime: 5 * 60 * 1000, // 5 minutes
    queryGcTime: 10 * 60 * 1000 // 10 minutes
  }
} as const;

export type Environment = typeof environment;
