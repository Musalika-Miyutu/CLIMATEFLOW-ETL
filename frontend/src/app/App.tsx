import { RouterProvider } from 'react-router';
import { router } from './routes';

export default function App() {
  return (
    <RouterProvider
      router={router}
      fallbackElement={
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-500">Loading...</p>
        </div>
      }
    />
  );
}