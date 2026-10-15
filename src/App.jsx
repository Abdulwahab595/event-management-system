import { Navigate, Route, Routes } from 'react-router';
import Navbar from './components/Navbar';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import MyEvents from './pages/MyEvents';
import NotFound from './pages/NotFound';

function App() {
  return (
    <div className="app">
      <Navbar />

      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/events" replace />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:eventId" element={<EventDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/my-events" element={<MyEvents />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer>
        Abdul Wahab | 22i-1714 | Web Programming Assignment 2
      </footer>
    </div>
  );
}

export default App;
