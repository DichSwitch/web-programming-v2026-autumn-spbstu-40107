import {useState} from 'react';
import {useNavigate} from 'react-router-dom';

export default function Login({setAuth}) {
  const [form, setForm] = useState({username: '', password: ''});
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setServerError('');

    let hasError = false;
    const newErrors = {};

    if (!form.username.trim()) {
      newErrors.username = true;
      hasError = true;
    }
    if (!form.password.trim()) {
      newErrors.password = true;
      hasError = true;
    }

    if (hasError) return setErrors(newErrors);

    try {
      const res = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        setAuth(true);
        localStorage.setItem('isAuth', 'true');
        navigate('/');
      } else {
        setServerError(
          'Такого пользователя нет, возможно неправильный логин или пароль проверьте данные',
        );
      }
    } catch (err) {
      setServerError('Ошибка соединения с сервером');
    }
  };

  return (
    <div
      style={{
        flex: 1,
        background: 'url(/login-bg.png) center/cover no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: '40px',
          borderRadius: '12px',
          width: '380px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          textAlign: 'center',
        }}
      >
        <h2 style={{margin: '0 0 30px 0', fontSize: '22px'}}>
          Добро пожаловать!
        </h2>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            textAlign: 'left',
          }}
        >
          <div>
            <label
              style={{
                fontSize: '12px',
                fontWeight: '500',
                display: 'block',
                marginBottom: '5px',
              }}
            >
              Логин <span style={{color: 'var(--pink-accent)'}}>*</span>
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({...form, username: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--bg-gray)',
                outline: errors.username ? '1px solid red' : 'none',
              }}
            />
            {errors.username && (
              <div style={{color: 'red', fontSize: '12px', marginTop: '5px'}}>
                Заполните обязательное поле
              </div>
            )}
          </div>

          <div>
            <label
              style={{
                fontSize: '12px',
                fontWeight: '500',
                display: 'block',
                marginBottom: '5px',
              }}
            >
              Пароль <span style={{color: 'var(--pink-accent)'}}>*</span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({...form, password: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--bg-gray)',
                outline: errors.password ? '1px solid red' : 'none',
              }}
            />
            {errors.password && (
              <div style={{color: 'red', fontSize: '12px', marginTop: '5px'}}>
                Заполните обязательное поле
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{marginTop: '10px'}}
          >
            Войти
          </button>

          {serverError && (
            <div style={{color: 'red', fontSize: '12px', textAlign: 'center'}}>
              {serverError}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
