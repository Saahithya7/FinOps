import React from 'react';

export const DemoBanner: React.FC<{
  onNavigatePortalHub?: () => void;
  onNavigateHome?: () => void;
}> = () => {
  // In production user experience, the demo persona banner and verification toolbar are removed.
  return null;
};
