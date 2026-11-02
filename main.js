
import {
    getBooks,
    createBook,
    updateBook,
    deleteBook
} from './api.js';

const booksContainer = document.getElementById('books-container');
const searchInput = document.getElementById('search-input');
const readFilter = document.getElementById('read-filter');
const sortBy = document.getElementById('sort-by');
const sortOrder = document.getElementById('sort-order');
const loadMoreButton = document.getElementById('load-more');
const bookForm = document.getElementById('book-form');
const addButton = document.getElementById('add-button');

let currentPage = 1;
const limit = 5;
let latestRequest = 0;
let searchTimer;

function renderBook(book) {
    const card = document.createElement('div');
    card.classList.add('book-card');

    const title = document.createElement('h2');
    title.textContent = book.title;

    const author = document.createElement('p');
    author.textContent = `Автор: ${book.author}`;

    const year = document.createElement('p');
    year.textContent = `Год: ${book.year}`;

    const status = document.createElement('p');
    status.textContent = book.isRead
        ? 'Статус: Прочитана'
        : 'Статус: Не прочитана';

    const editButton = document.createElement('button');
    editButton.textContent = 'Редактировать';
    editButton.addEventListener('click', () => editBook(book));

    const statusButton = document.createElement('button');
    statusButton.textContent = book.isRead
        ? 'Отметить как непрочитанную'
        : 'Отметить как прочитанную';

    statusButton.addEventListener('click', () => changeReadStatus(book));

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Удалить';
    deleteButton.addEventListener('click', () => removeBook(book.id));

    card.append(
        title,
        author,
        year,
        status,
        editButton,
        statusButton,
        deleteButton
    );

    return card;
}

function createQuery(page = currentPage) {
    const params = new URLSearchParams();

    if (searchInput.value.trim()) {
        params.append('search', searchInput.value.trim());
    }

    if (readFilter.value !== '') {
        params.append('isRead', readFilter.value);
    }

    if (sortBy.value !== '') {
        params.append('sortBy', sortBy.value);
        params.append('order', sortOrder.value);
    }

    params.append('page', page);
    params.append('limit', limit);

    return `?${params.toString()}`;
}

async function loadBooks(more = false) {
    const requestId = ++latestRequest;
    const nextPage = more ? currentPage + 1 : 1;

    if (!more) {
        currentPage = 1;
        booksContainer.innerHTML = '<p>Загрузка книг...</p>';
    }

    loadMoreButton.hidden = true;

    try {
        const query = createQuery(nextPage);

        console.log('GET:', query);

        const books = await getBooks(query);

        if (requestId !== latestRequest) return;

        if (!more) {
            booksContainer.innerHTML = '';
        }

        if (books.length === 0) {
            if (!more) {
                booksContainer.innerHTML =
                    '<p class="empty">Ничего не найдено</p>';
            }
            return;
        }

        books.forEach(book => {
            booksContainer.append(renderBook(book));
        });

        currentPage = nextPage;

        loadMoreButton.hidden = books.length < limit;

    } catch (error) {
        if (requestId !== latestRequest) return;

        if (error.message.includes('404')) {
            if (!more) {
                booksContainer.innerHTML =
                    '<p class="empty">Ничего не найдено</p>';
            }
        } else {
            if (!more) {
                booksContainer.innerHTML =
                    '<p class="empty">Ошибка загрузки книг</p>';
            }

            console.error('Ошибка загрузки:', error);
        }
    }
}

async function editBook(book) {
    const title = prompt('Введите название книги:', book.title);
    if (title === null) return;

    const author = prompt('Введите автора:', book.author);
    if (author === null) return;

    const year = prompt('Введите год издания:', book.year);
    if (year === null) return;

    const updatedBook = {
        ...book,
        title: title.trim(),
        author: author.trim(),
        year: Number(year)
    };

    if (
        !updatedBook.title ||
        !updatedBook.author ||
        !Number.isInteger(updatedBook.year) ||
        updatedBook.year <= 0
    ) {
        alert('Проверьте название, автора и год!');
        return;
    }

    try {
        await updateBook(book.id, updatedBook);
        await loadBooks();

        console.log('Книга обновлена!');
    } catch (error) {
        console.error('Ошибка редактирования:', error);
    }
}

async function changeReadStatus(book) {
    try {
        const updatedBook = {
            ...book,
            isRead: !book.isRead
        };

        await updateBook(book.id, updatedBook);
        await loadBooks();

        console.log('Статус книги изменён!');
    } catch (error) {
        console.error('Ошибка изменения статуса:', error);
    }
}

async function removeBook(id) {
    try {
        await deleteBook(id);
        await loadBooks();

        console.log('Книга удалена!');
    } catch (error) {
        console.error('Ошибка удаления:', error);
    }
}

bookForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (addButton.disabled) return;

    const formData = new FormData(bookForm);
    const data = Object.fromEntries(formData.entries());

    console.log('Данные формы:', data);

    data.title = data.title.trim();
    data.author = data.author.trim();
    data.year = Number(data.year);
    data.isRead = formData.has('isRead');

    if (
        !data.title ||
        !data.author ||
        !Number.isInteger(data.year) ||
        data.year <= 0
    ) {
        alert('Заполните все поля корректно!');
        return;
    }

    addButton.disabled = true;

    try {
        await createBook(data);

        bookForm.reset();

        searchInput.value = '';
        readFilter.value = '';
        sortBy.value = '';
        sortOrder.value = 'asc';

        await loadBooks();

        console.log('Книга успешно добавлена!');
    } catch (error) {
        console.error('Ошибка добавления:', error);
        alert('Не удалось добавить книгу!');
    } finally {
        addButton.disabled = false;
    }
});

searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {
        loadBooks();
    }, 400);
});

readFilter.addEventListener('change', () => loadBooks());
sortBy.addEventListener('change', () => loadBooks());
sortOrder.addEventListener('change', () => loadBooks());

loadMoreButton.addEventListener('click', () => {
    loadBooks(true);
});

loadBooks();
