import {useEffect, useMemo, useRef, useState} from 'react';

const STORAGE_KEY = 'notes';

const INITIAL_NOTES = [
  {
    id: 1,
    title: 'Первая заметка',
    content: 'Пример заметки с тегами.',
    tags: ['учёба', 'важное'],
    date: '2026-09-14',
  },
  {
    id: 2,
    title: 'Купить продукты',
    content: 'Молоко, хлеб, кофе.',
    tags: ['личное'],
    date: '2026-09-15',
  },
];

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : INITIAL_NOTES;
  } catch {
    return INITIAL_NOTES;
  }
}

function parseTags(value) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function App() {
  const [notes, setNotes] = useState(loadNotes);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const formRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const allTags = useMemo(
    () => [...new Set(notes.flatMap((note) => note.tags))],
    [notes],
  );

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notes.filter((note) => {
      const matchesSearch =
        !query ||
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query);
      const matchesTag = !tagFilter || note.tags.includes(tagFilter);
      const matchesDate = !dateFilter || note.date === dateFilter;
      return matchesSearch && matchesTag && matchesDate;
    });
  }, [notes, search, tagFilter, dateFilter]);

  const groups = useMemo(() => {
    const result = {};
    for (const tag of allTags) {
      result[tag] = notes.filter((note) => note.tags.includes(tag));
    }
    return result;
  }, [notes, allTags]);

  // Поля формы НЕ контролируются React: их значения читаются напрямую из DOM
  // в момент отправки. Ничто не может их "сбросить" между вводом и кликом.
  function readFormValues() {
    const elements = formRef.current.elements;
    return {
      titleValue: String(elements.title.value).trim(),
      contentValue: String(elements.content.value).trim(),
      tagsValue: String(elements.tags.value),
    };
  }

  function resetForm() {
    setEditingId(null);
    setDraft(null);
    formRef.current.reset();
  }

  function addOrUpdateNote() {
    const {titleValue, contentValue, tagsValue} = readFormValues();
    if (!titleValue) {
      return;
    }
    const noteTags = parseTags(tagsValue);
    if (editingId === null) {
      const note = {
        id: Date.now(),
        title: titleValue,
        content: contentValue,
        tags: noteTags,
        date: new Date().toISOString().slice(0, 10),
      };
      setNotes((prev) => [note, ...prev]);
    } else {
      setNotes((prev) =>
        prev.map((note) =>
          note.id === editingId
            ? {
                ...note,
                title: titleValue,
                content: contentValue,
                tags: noteTags,
              }
            : note,
        ),
      );
    }
    resetForm();
  }

  function handleSubmit(event) {
    event.preventDefault();
    addOrUpdateNote();
  }

  function handleAddClick() {
    addOrUpdateNote();
  }

  function startEdit(note) {
    setEditingId(note.id);
    setDraft(note);
  }

  function deleteNote(id) {
    setNotes((prev) => prev.filter((note) => note.id !== id));
    if (editingId === id) {
      resetForm();
    }
  }

  return (
    <main className="app" data-testid="app">
      <h1>Заметки</h1>

      {/* key={editingId} пересоздаёт форму при входе в режим редактирования,
          чтобы defaultValue подставились данные заметки */}
      <form
        ref={formRef}
        key={editingId ?? 'new'}
        className="note-form"
        onSubmit={handleSubmit}
      >
        <input
          data-testid="note-title"
          name="title"
          placeholder="Заголовок"
          defaultValue={draft ? draft.title : ''}
        />
        <textarea
          data-testid="note-content"
          name="content"
          placeholder="Текст заметки"
          defaultValue={draft ? draft.content : ''}
        />
        <input
          data-testid="note-tags"
          name="tags"
          placeholder="Теги через запятую"
          defaultValue={draft ? draft.tags.join(', ') : ''}
        />
        <button data-testid="note-add" type="button" onClick={handleAddClick}>
          {editingId === null ? 'Добавить заметку' : 'Сохранить изменения'}
        </button>
      </form>

      <section className="filters" aria-label="Фильтры">
        <input
          data-testid="note-search"
          name="search"
          placeholder="Поиск по содержимому"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          data-testid="note-tag-filter"
          name="tag-filter"
          value={tagFilter}
          onChange={(event) => setTagFilter(event.target.value)}
        >
          <option value="">Все теги</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <input
          data-testid="note-date-filter"
          name="date-filter"
          type="date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
        />
      </section>

      <section
        className="note-list"
        data-testid="note-list"
        aria-label="Список заметок"
      >
        {filteredNotes.length === 0 ? (
          <p className="note-list-empty">Заметок не найдено</p>
        ) : (
          filteredNotes.map((note) => (
            <article
              className="note-card"
              data-testid="note-item"
              key={note.id}
            >
              <h2 className="note-card-title">{note.title}</h2>
              <p className="note-card-content">{note.content}</p>
              <p className="note-card-meta">
                <span>{note.date}</span>
                {note.tags.map((tag) => (
                  <span className="note-card-tag" key={tag}>
                    #{tag}
                  </span>
                ))}
              </p>
              <div className="note-card-actions">
                <button type="button" onClick={() => startEdit(note)}>
                  Редактировать
                </button>
                <button type="button" onClick={() => deleteNote(note.id)}>
                  Удалить
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="groups" aria-label="Группы по тегам">
        <h2>Группы по тегам</h2>
        {Object.entries(groups).map(([tag, groupNotes]) => (
          <div className="groups-item" key={tag}>
            <h3>
              #{tag} ({groupNotes.length})
            </h3>
            <ul>
              {groupNotes.map((note) => (
                <li key={note.id}>{note.title}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
