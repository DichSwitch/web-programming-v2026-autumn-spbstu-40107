import {Product} from './model.js';

const STORAGE_KEY = 'products';
const ASYNC_DELAY = 2000;

const entityList = document.querySelector('[data-testid="entity-list"]');
const entityForm = document.querySelector('[data-testid="entity-form"]');
const submitButton = entityForm.querySelector('button[type="submit"]');

// Строка состояния: pending / fulfilled / rejected
const statusElement = document.createElement('p');
statusElement.className = 'form-status';
statusElement.setAttribute('role', 'status');
entityForm.appendChild(statusElement);

function showStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle('form-status-error', isError);
}

let addPending = false;

function setAddPending(pending) {
  addPending = pending;
  submitButton.disabled = pending;
  submitButton.textContent = pending ? 'Добавление…' : 'Добавить товар';
}

function createDefaultProducts() {
  return [
    new Product(1, 'Ноутбук', ['Электроника'], 50000),
    new Product(2, 'Кофе', ['Продукты'], 500),
  ];
}

function isValidProductData(data) {
  return (
    data !== null &&
    typeof data === 'object' &&
    typeof data.id === 'number' &&
    typeof data.name === 'string' &&
    Array.isArray(data.categories) &&
    typeof data.price === 'number' &&
    data.price >= 0
  );
}

function loadProducts() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // localStorage недоступен (приватный режим и т.п.)
    showStatus(
      'localStorage недоступен: товары не будут сохраняться между сессиями',
      true,
    );
    return createDefaultProducts();
  }
  if (!raw) {
    return createDefaultProducts();
  }
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      showStatus(
        'Сохранённые данные имеют неверный формат — загружен список по умолчанию',
        true,
      );
      return createDefaultProducts();
    }
    const valid = data.filter(isValidProductData);
    if (valid.length !== data.length) {
      showStatus('Часть сохранённых данных была повреждена и отброшена', true);
    }
    return valid.map(
      (item) => new Product(item.id, item.name, item.categories, item.price),
    );
  } catch {
    showStatus(
      'Сохранённые данные повреждены — загружен список по умолчанию',
      true,
    );
    return createDefaultProducts();
  }
}

let products = loadProducts();

function saveProducts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch {
    // нет места или storage недоступен — приложение продолжает работать в памяти
    showStatus('Не удалось сохранить данные в localStorage', true);
  }
}

// промис может перейти и в rejected: ошибка из action ловится и reject'ится
function runAsync(action) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(action());
      } catch (error) {
        reject(error);
      }
    }, ASYNC_DELAY);
  });
}

function addProductAsync(product) {
  setAddPending(true); // pending
  showStatus('Добавление товара…');
  return runAsync(() => {
    // повторная проверка внутри асинхронной операции —
    // защита от двойного быстрого submit (race condition)
    if (products.some((item) => item.id === product.id)) {
      throw new Error(`Товар с ID ${product.id} уже существует`);
    }
    products.push(product);
    saveProducts();
  })
    .then(() => {
      render(); // UI обновляется только здесь — после задержки
      showStatus(`Товар «${product.name}» добавлен`);
    })
    .catch((error) => showStatus(error.message, true))
    .finally(() => setAddPending(false));
}

function deleteProductAsync(id, button) {
  button.disabled = true; // pending: блокируем только нажатую кнопку
  return runAsync(() => {
    const product = products.find((item) => item.id === id);
    if (!product) {
      throw new Error(`Товар с ID ${id} не найден`);
    }
    products = products.filter((item) => item.id !== id);
    saveProducts();
    return product.name;
  })
    .then((name) => {
      render(); // список меняется только после setTimeout — асинхронно
      showStatus(`Товар «${name}» удалён`);
    })
    .catch((error) => {
      render();
      showStatus(error.message, true);
    });
}

function addCategoryAsync(id, category, button) {
  button.disabled = true;
  return runAsync(() => {
    const product = products.find((item) => item.id === id);
    if (!product) {
      throw new Error(`Товар с ID ${id} не найден`);
    }
    product.addCategory(category);
    saveProducts();
  })
    .then(() => {
      render();
      showStatus(`Категория «${category}» добавлена`);
    })
    .catch((error) => {
      render();
      showStatus(error.message, true);
    });
}

function removeCategoryAsync(id, category, button) {
  button.disabled = true;
  return runAsync(() => {
    const product = products.find((item) => item.id === id);
    if (!product) {
      throw new Error(`Товар с ID ${id} не найден`);
    }
    product.removeCategory(category);
    saveProducts();
  })
    .then(() => {
      render();
      showStatus(`Категория «${category}» удалена`);
    })
    .catch((error) => {
      render();
      showStatus(error.message, true);
    });
}

// экранирование перед вставкой в innerHTML — защита от XSS
function escapeHtml(value) {
  const entities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return String(value).replace(/[&<>"']/g, (char) => entities[char]);
}

function render() {
  entityList.innerHTML = '';
  for (const product of products) {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.testid = 'entity-card';
    card.innerHTML = `
      <h2 class="card-name">${escapeHtml(product.name)}</h2>
      <p class="card-price">Цена: ${product.price}</p>
      <p class="card-meta">Категорий: ${product.categoryCount}</p>
      <div class="card-tags">
        ${product.categories
          .map(
            (category) => `
              <span class="chip">
                ${escapeHtml(category)}
                <button
                  class="btn btn-small"
                  type="button"
                  data-remove-category
                  data-id="${product.id}"
                  data-category="${escapeHtml(category)}"
                >
                  Удалить категорию
                </button>
              </span>`,
          )
          .join('')}
      </div>
      <form class="card-category-form" data-id="${product.id}">
        <label>
          Новая категория
          <input name="category" type="text" required />
        </label>
        <button class="btn" type="submit">Добавить категорию</button>
      </form>
      <button
        class="btn btn-danger"
        type="button"
        data-testid="delete-entity"
        data-id="${product.id}"
      >
        Удалить товар
      </button>
    `;
    entityList.appendChild(card);
  }
}

entityForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (addPending) {
    return; // защита от повторного submit, пока идёт операция
  }
  const formData = new FormData(entityForm);
  const id = Number(formData.get('id'));
  const name = String(formData.get('name')).trim();
  const price = Number(formData.get('price'));
  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !name ||
    /^\d/.test(name) ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    return;
  }
  if (products.some((product) => product.id === id)) {
    showStatus(`Товар с ID ${id} уже существует`, true);
    return;
  }
  entityForm.reset();
  addProductAsync(new Product(id, name, [], price));
});

entityList.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('[data-testid="delete-entity"]');
  if (deleteButton) {
    if (deleteButton.disabled) {
      return;
    }
    deleteProductAsync(Number(deleteButton.dataset.id), deleteButton);
    return;
  }
  const categoryButton = event.target.closest('[data-remove-category]');
  if (categoryButton) {
    if (categoryButton.disabled) {
      return;
    }
    removeCategoryAsync(
      Number(categoryButton.dataset.id),
      categoryButton.dataset.category,
      categoryButton,
    );
  }
});

entityList.addEventListener('submit', (event) => {
  const form = event.target.closest('.card-category-form');
  if (!form) {
    return;
  }
  event.preventDefault();
  const input = form.elements.category;
  const category = input.value.trim();
  if (category) {
    addCategoryAsync(
      Number(form.dataset.id),
      category,
      event.submitter || form.querySelector('button[type="submit"]'),
    );
  }
  form.reset();
});

saveProducts();
render();
