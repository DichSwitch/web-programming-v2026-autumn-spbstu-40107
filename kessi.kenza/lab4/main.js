import {Product} from './model.js';

const STORAGE_KEY = 'products';
const ASYNC_DELAY = 2000;

const entityList = document.querySelector('[data-testid="entity-list"]');
const entityForm = document.querySelector('[data-testid="entity-form"]');
const submitButton = entityForm.querySelector('button[type="submit"]');

// Строка состояния для отображения pending / fulfilled / rejected
const statusElement = document.createElement('p');
statusElement.className = 'form-status';
statusElement.setAttribute('role', 'status');
entityForm.appendChild(statusElement);

function showStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle('form-status--error', isError);
}

// --- состояния промисов: что сейчас выполняется асинхронно ---
let addPending = false;
const pendingProductIds = new Set();

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
  return (
    runAsync(() => {
      // повторная проверка внутри асинхронной операции —
      // защита от двойного быстрого submit (race condition)
      if (products.some((item) => item.id === product.id)) {
        throw new Error(`Товар с ID ${product.id} уже существует`);
      }
      products.push(product);
      saveProducts();
      render();
    })
      // fulfilled
      .then(() => showStatus(`Товар «${product.name}» добавлен`))
      // rejected — ошибка показывается пользователю, приложение не падает
      .catch((error) => showStatus(error.message, true))
      // cleanup независимо от исхода
      .finally(() => setAddPending(false))
  );
}

function deleteProductAsync(id) {
  pendingProductIds.add(id); // pending для конкретной карточки
  render(); // чтобы кнопка стала disabled
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
      render();
      showStatus(`Товар «${name}» удалён`);
    })
    .catch((error) => showStatus(error.message, true))
    .finally(() => {
      pendingProductIds.delete(id);
      render();
    });
}

function addCategoryAsync(id, category) {
  pendingProductIds.add(id);
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
    .catch((error) => showStatus(error.message, true))
    .finally(() => {
      pendingProductIds.delete(id);
      render();
    });
}

function removeCategoryAsync(id, category) {
  pendingProductIds.add(id);
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
    .catch((error) => showStatus(error.message, true))
    .finally(() => {
      pendingProductIds.delete(id);
      render();
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
    const isPending = pendingProductIds.has(product.id);
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.testid = 'entity-card';
    card.innerHTML = `
      <h2 class="card__name">${escapeHtml(product.name)}</h2>
      <p class="card__price">Цена: ${product.price}</p>
      <p class="card__meta">Категорий: ${product.categoryCount}</p>
      <div class="card__tags">
        ${product.categories
          .map(
            (category) => `
              <span class="chip">
                ${escapeHtml(category)}
                <button
                  class="btn btn--small"
                  type="button"
                  data-remove-category
                  data-id="${product.id}"
                  data-category="${escapeHtml(category)}"
                  ${isPending ? 'disabled' : ''}
                >
                  Удалить категорию
                </button>
              </span>`,
          )
          .join('')}
      </div>
      <form class="card__category-form" data-id="${product.id}">
        <label>
          Новая категория
          <input name="category" type="text" required />
        </label>
        <button class="btn" type="submit" ${isPending ? 'disabled' : ''}>
          Добавить категорию
        </button>
      </form>
      <button
        class="btn btn--danger"
        type="button"
        data-testid="delete-entity"
        data-id="${product.id}"
        ${isPending ? 'disabled' : ''}
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
    deleteProductAsync(Number(deleteButton.dataset.id));
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
    );
  }
});

entityList.addEventListener('submit', (event) => {
  const form = event.target.closest('.card__category-form');
  if (!form) {
    return;
  }
  event.preventDefault();
  const input = form.elements.category;
  const category = input.value.trim();
  if (category) {
    addCategoryAsync(Number(form.dataset.id), category);
  }
  form.reset();
});

saveProducts();
render();
