import React from 'react';
import { createRoot } from 'react-dom/client';
import { Example } from '../../components/ui/dashboard-with-collapsible-sidebar';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Example />
  </React.StrictMode>,
);