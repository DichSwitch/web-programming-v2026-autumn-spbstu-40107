import React, {StrictMode} from 'react';
import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';
import dostoevsky from '../assets/dostoevsky.jpg';
import faust from '../assets/faust.jpg';
import gamlet from '../assets/gamlet.jpg';
import makiaveli from '../assets/makiaveli.jpg';
import platon from '../assets/platon.jpg';

function Book(id, title, cover, rating, price, description) {
  this.id = id;
  this.title = title;
  this.rating = rating;
  this.cover = cover;
  this.price = price;
  this.description = description;
}

function prepareArray() {
  const dostoevskyBook = new Book(
    1,
    'Преступление и наказание',
    dostoevsky,
    4.8,
    500,
    'Философская и психологическая драма о моральном выборе, угрызениях совести и духовном возрождении человека',
  );

  const faustBook = new Book(
    2,
    'Фауст',
    faust,
    4.6,
    450,
    'Философская трагедия о старом ученом, разочаровавшемся в жизни и заключившем сделку с дьяволом.',
  );

  const gamletBook = new Book(
    3,
    'Гамлет',
    gamlet,
    4.7,
    550,
    'Знаменитая трагедия Уильяма Шекспира, написанная в 1599–1601 годах',
  );

  const makiaveliBook = new Book(
    4,
    'Государь',
    makiaveli,
    4.55,
    400,
    'Знаменитый политический трактат, написанный Никколо Макиавелли в 1513 году.',
  );

  const platonBook = new Book(
    5,
    'Государство',
    platon,
    4.65,
    500,
    'Фундаментальное произведение античной философии, в котором исследуется природа справедливости',
  );

  const books = [];
  books.push(dostoevskyBook);
  books.push(faustBook);
  books.push(gamletBook);
  books.push(makiaveliBook);
  books.push(platonBook);

  return books;
}

const books = prepareArray();

function BookCard({book}) {
  return (
    <article className="book-card" data-testid="book-card">
      <img src={book.cover} alt={book.title} />
      <h3>Название книги: {book.title} </h3>
      <p>Рейтинг: {book.rating}</p>
      <p>Описание: {book.description}</p>
      <p>Цена: {book.price} руб.</p>
    </article>
  );
}

function App() {
  let booksSorted;

  const [sortState, setSort] = useState('не задано');
  const [clickSource, setClickSource] = useState('');

  function sort(button) {
    if (button !== clickSource) {
      setSort('↑');
    } else if (button === clickSource) {
      if (sortState === 'не задано') {
        setSort('↑');
      } else if (sortState === '↑') {
        setSort('↓');
      } else if (sortState === '↓') {
        setSort('не задано');
      }
    }

    setClickSource(button);
  }

  if (sortState === 'не задано') {
    booksSorted = books;
  } else if (sortState === '↑') {
    if (clickSource === 'title') {
      booksSorted = [...books].sort((bookFirst, bookSecond) =>
        bookFirst.title.localeCompare(bookSecond.title),
      );
    } else if (clickSource === 'price') {
      booksSorted = [...books].sort(
        (bookFirst, bookSecond) => bookFirst.price - bookSecond.price,
      );
    } else if (clickSource === 'rating') {
      booksSorted = [...books].sort(
        (bookFirst, bookSecond) => bookFirst.rating - bookSecond.rating,
      );
    }
  } else if (sortState === '↓') {
    if (clickSource === 'title') {
      booksSorted = [...books].sort((bookFirst, bookSecond) =>
        bookSecond.title.localeCompare(bookFirst.title),
      );
    } else if (clickSource === 'price') {
      booksSorted = [...books].sort(
        (bookFirst, bookSecond) => bookSecond.price - bookFirst.price,
      );
    } else if (clickSource === 'rating') {
      booksSorted = [...books].sort(
        (bookFirst, bookSecond) => bookSecond.rating - bookFirst.rating,
      );
    }
  }

  return (
    <div>
      <button
        type="button"
        className={
          clickSource === 'title' && sortState !== 'не задано' ? 'active' : ''
        }
        data-testid="sort-title"
        onClick={() => sort('title')}
      >
        Название
      </button>

      <button
        type="button"
        className={
          clickSource === 'price' && sortState !== 'не задано' ? 'active' : ''
        }
        data-testid="sort-price"
        onClick={() => sort('price')}
      >
        Цена
      </button>

      <button
        type="button"
        className={
          clickSource === 'rating' && sortState !== 'не задано' ? 'active' : ''
        }
        data-testid="sort-rating"
        onClick={() => sort('rating')}
      >
        Рейтинг
      </button>

      <span data-testid="sort-direction"> Порядок сортировки: {sortState}</span>
      <section className="books">
        {booksSorted.map((book) => (
          <BookCard book={book} key={book.id} />
        ))}
      </section>
    </div>
  );
}

const rootElement = document.querySelector('[data-testid="app"]');

if (!rootElement) {
  throw new Error('Корневой элемент приложения не найден.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
