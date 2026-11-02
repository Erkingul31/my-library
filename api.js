
const API = 'https://6ae8463a1a7b15aaa50edc35.mockapi.io/books';

const request = async (url, method = 'GET', body) => {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (body !== undefined) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`Ошибка ${response.status}`);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
};

export const getBooks = (query = '') =>
    request(`${API}${query}`);

export const createBook = (book) =>
    request(API, 'POST', book);

export const updateBook = (id, book) =>
    request(`${API}/${id}`, 'PUT', book);

export const deleteBook = (id) =>
    request(`${API}/${id}`, 'DELETE');
