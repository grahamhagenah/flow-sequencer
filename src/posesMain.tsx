import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PosesPage } from './PosesPage';
import '@fontsource-variable/figtree/wght.css';
import '@fontsource-variable/figtree/wght-italic.css';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PosesPage />
  </StrictMode>,
);
