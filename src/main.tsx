import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
// Figtree (SIL Open Font License), bundled with the app rather than loaded from a font service.
import '@fontsource-variable/figtree/wght.css';
import '@fontsource-variable/figtree/wght-italic.css';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
