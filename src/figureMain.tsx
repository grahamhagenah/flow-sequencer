import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FigurePage } from './FigurePage';
import '@fontsource-variable/figtree/wght.css';
import '@fontsource-variable/figtree/wght-italic.css';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FigurePage />
  </StrictMode>,
);
