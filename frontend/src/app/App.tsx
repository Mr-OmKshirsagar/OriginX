import { RouterProvider } from 'react-router';
import { router } from './routes';
import { DarkModeProvider } from './components/DarkModeContext';

function App() {
  return (
    <DarkModeProvider>
      <RouterProvider router={router} />
    </DarkModeProvider>
  );
}

export default App;
