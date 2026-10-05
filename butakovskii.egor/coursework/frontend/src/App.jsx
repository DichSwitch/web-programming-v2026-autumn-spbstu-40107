import {BrowserRouter, Routes, Route, Navigate, Link} from 'react-router-dom';
import {useState, useEffect} from 'react';
import Login from './pages/Login';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import Home from './pages/Home';

const Layout = ({children, isAuth, setAuth}) => {
  const cartItems = JSON.parse(localStorage.getItem('cart') || '{}');
  const cartCount = Object.values(cartItems).reduce(
    (sum, count) => sum + count,
    0,
  );

  return (
    <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
      <header style={{padding: '20px 0', borderBottom: '1px solid #eee'}}>
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link to="/" style={{fontSize: '24px', fontWeight: 'bold'}}>
            <span style={{color: 'var(--primary-blue)'}}>Gadget</span> Hub
          </Link>
          <nav
            style={{
              display: 'flex',
              gap: '30px',
              alignItems: 'center',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            <Link
              to="/catalog"
              style={{display: 'flex', alignItems: 'center', gap: '8px'}}
            >
              <img src="/catalog.svg" alt="" width="16" /> Каталог
            </Link>
            {isAuth ? (
              <>
                <Link
                  to="/cart"
                  style={{display: 'flex', alignItems: 'center', gap: '8px'}}
                >
                  <img src="/card.svg" alt="" width="16" /> Корзина
                  {cartCount > 0 && (
                    <span
                      style={{
                        background: 'var(--pink-accent)',
                        color: '#fff',
                        borderRadius: '50%',
                        padding: '2px 6px',
                        fontSize: '12px',
                      }}
                    >
                      {cartCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => {
                    setAuth(false);
                    localStorage.removeItem('isAuth');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--primary-blue)',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <img src="/profile.svg" alt="" width="16" /> Выйти
                </button>
              </>
            ) : (
              <Link
                to="/login"
                style={{
                  color: 'var(--primary-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <img src="/profile.svg" alt="" width="16" /> Войти
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
        {children}
      </main>

      <footer
        style={{
          background: 'var(--footer-bg)',
          color: '#fff',
          padding: '40px 0',
          marginTop: 'auto',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{margin: '0 0 5px 0', fontSize: '18px'}}>Gadget Hub</h3>
            <p style={{margin: 0, fontSize: '12px', opacity: 0.7}}>
              Магазин надежных гаджетов
            </p>
            <p style={{margin: '20px 0 0 0', fontSize: '12px', opacity: 0.5}}>
              © 2024 ООО "Гаджет Хаб". Все права защищены
            </p>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '50px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <img
                src="/mobile.svg"
                alt=""
                width="16"
                style={{filter: 'brightness(0) invert(1)'}}
              />
              <span style={{fontWeight: '500'}}>8 (800) 678-34-24</span>
            </div>
            <div style={{display: 'flex', gap: '15px'}}>
              <img src="/vk.png" alt="VK" width="24" />
              <img src="/telegram.png" alt="TG" width="24" />
              <img src="/whatsapp.png" alt="WA" width="24" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const ProtectedRoute = ({isAuth, children}) =>
  isAuth ? children : <Navigate to="/login" replace />;

export default function App() {
  const [isAuth, setIsAuth] = useState(
    () => localStorage.getItem('isAuth') === 'true',
  );
  const [cartUpdate, setCartUpdate] = useState(0);

  useEffect(() => {
    const handleStorage = () => setCartUpdate((prev) => prev + 1);
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <BrowserRouter>
      <Layout isAuth={isAuth} setAuth={setIsAuth}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login setAuth={setIsAuth} />} />
          <Route
            path="/catalog"
            element={
              <ProtectedRoute isAuth={isAuth}>
                <Catalog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute isAuth={isAuth}>
                <Cart />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
