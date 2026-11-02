import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthGate } from './app/AuthGate';
import './styles.css';
import './ux-foundation.css';

createRoot(document.getElementById('root')!).render(<StrictMode><AuthGate /></StrictMode>);
