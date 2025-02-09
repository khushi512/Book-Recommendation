document.addEventListener("DOMContentLoaded", function () {
    const libraryBtn = document.getElementById("libraryBtn");
    const backToHomeBtn = document.getElementById("backToHomeBtn");

    // Opens Library 
    libraryBtn.addEventListener("click", function () {
        document.getElementById("libraryPage").style.display = "block";
        document.getElementById("homePage").style.display = "none";
        document.getElementById("resultsPage").style.display = "none";
        backToHomeBtn.style.display = "block"; // Show Back to Home in Library
        backToHomeBtn.style.position = "absolute";
        backToHomeBtn.style.top = "10px";
        backToHomeBtn.style.right = "20px"; // Moves it to the right corner
        backToHomeBtn.style.left = "auto"; // Ensures it's not aligned to the left
        backToHomeBtn.style.width = "120px"; // Small rectangular size
        backToHomeBtn.style.height = "50px";
        showCategory("inProgress"); // Hide Back to Home in Library

    });
  
    // Go to Home page
    backToHomeBtn.addEventListener("click", function () {
        document.getElementById("libraryPage").style.display = "none";
        document.getElementById("resultsPage").style.display = "none";
        document.getElementById("homePage").style.display = "block";
        backToHomeBtn.style.display = "none";
    });
  
    // Search for Book 
    document.getElementById("searchBtn").addEventListener("click", function () {
        document.getElementById("homePage").style.display = "none";
        document.getElementById("resultsPage").style.display = "block";
        backToHomeBtn.style.display = "block";
        backToHomeBtn.style.position = "absolute";
        backToHomeBtn.style.top = "10px";
        backToHomeBtn.style.right = "10px"; // Moves it to the right corner
        backToHomeBtn.style.left = "auto"; // Ensures it's not aligned to the left
        backToHomeBtn.style.width = "120px"; // Small rectangular size
        backToHomeBtn.style.height = "50px";
        searchBooks();
    });
    document.getElementById("inProgressTab").addEventListener("click", function () {
        showCategory('inProgress');
    });
    document.getElementById("finishedTab").addEventListener("click", function () {
        showCategory('finished');
    });
    document.getElementById("savedTab").addEventListener("click", function () {
        showCategory('saved');
    });
    displayLibraryBooks();
});

window.onload = function () {
    displayLibraryBooks();
    showCategory('inProgress');
};
// Function to update the reading progress
function updateProgress(bookId, progress) {
    let books = JSON.parse(localStorage.getItem("inProgressBooks")) || [];
    let book = books.find(b => b.id === bookId);
    if (book) {
        book.progress = progress;
        localStorage.setItem("inProgressBooks", JSON.stringify(books));
        document.getElementById(`progress-bar-${bookId}`).value = progress;
        document.getElementById(`progress-label-${bookId}`).innerText = `${progress}%`;
    }
}

document.getElementById("searchBtn").addEventListener("click", searchBooks);

// Function to search for books by name or genre
async function searchBooks() {
    try {
        const query = document.getElementById("searchInput").value.trim();  // Get value from the search input field
        const genre = document.getElementById("genreSelect").value;
        const rating = document.getElementById("ratingSelect").value;
        console.log(`Search query: ${query}, Genre: ${genre}, Rating: ${rating}`);

        if (query === "" && genre === "none" && rating === "none") {
            alert("Please enter a book name or select a genre/rating.");
            return;
        }

        let searchQuery = query;
        if (genre !== "none") searchQuery += `+subject:${genre}`;
        if (rating !== "none") searchQuery += `+rating:${rating}`;
        console.log(`Final search query: ${searchQuery}`);

        const googleApiUrl = `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=30`; 
        const googleResponse = await fetch(googleApiUrl);

        if (!googleResponse.ok) {
            throw new Error('Google Books API request failed');
        }

        const googleData = await googleResponse.json();
        console.log("Google Books API response:", googleData);

        if (googleData.items) {
            displayGoogleBooksResults(googleData.items);
        } else {
            alert("No books found from Google Books API. Searching in Open Library...");
            fetchFromOpenLibrary(query, genre, rating);
        }
    } catch (error) {
        console.error("Error fetching Google Books data:", error);
        alert("An error occurred while fetching book data. Please try again.");
    }
}

// Function to display book search results 
function displayGoogleBooksResults(books) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";  // Clear previous results

    books.forEach(book => {
        const bookInfo = book.volumeInfo;
        const bookCard = document.createElement("div");
        bookCard.classList.add("book-card");
    
        bookCard.innerHTML = `
            <img src="${bookInfo.imageLinks?.thumbnail || 'placeholder.jpg'}" alt="Book Cover">
            <div class="book-details">
                <h3>${bookInfo.title}</h3>
                <p><strong>Author:</strong> ${bookInfo.authors?.join(", ") || "Unknown"}</p>
                <p><strong>Published:</strong> ${bookInfo.publishedDate || "N/A"}</p>
                <button class="save-btn">Save to Library</button>
            </div>
        `;
    
        bookCard.querySelector(".save-btn").addEventListener("click", () => saveToLibrary(bookInfo));
        document.getElementById("results").appendChild(bookCard);
    });
    
}

// Function to fetch books from Open Library
async function fetchFromOpenLibrary(query, genre, rating) {
    const openLibraryApiUrl = `https://openlibrary.org/search.json?q=${query}+subject:${genre}&rating=${rating}`;
    try {
        const openLibraryResponse = await fetch(openLibraryApiUrl);
        const openLibraryData = await openLibraryResponse.json();

        if (openLibraryData.docs && openLibraryData.docs.length > 0) {
            displayOpenLibraryResults(openLibraryData.docs);
        } else {
            alert("No results found in Open Library.");
        }
    } catch (error) {
        console.error("Error fetching Open Library data:", error);
    }
}

// Function to display the open library results
function displayOpenLibraryResults(books) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";  // Clear previous results

    books.forEach(book => {
        const bookCard = document.createElement("div");
        bookCard.classList.add("book-card");

        bookCard.innerHTML = `
            <div class="book-details">
                <h3>${book.title}</h3>
                <p><strong>Author:</strong> ${book.author_name?.join(", ") || "Unknown"}</p>
                <p><strong>First Published:</strong> ${book.first_publish_year || "N/A"}</p>
                <button class="save-btn">Save to Library</button>
            </div>
        `;

        bookCard.querySelector(".save-btn").addEventListener("click", () => saveToLibrary(book));
        resultsDiv.appendChild(bookCard);
    });
}

// Function to save to library
function saveToLibrary(book) {
    let savedBooks = JSON.parse(localStorage.getItem("library")) || [];

    if (!book.progress) book.progress = 0; // Default to "In Progress"
    if (!savedBooks.some(savedBook => savedBook.title === book.title)) {
        savedBooks.push(book);
        localStorage.setItem("library", JSON.stringify(savedBooks));
        alert("Book added to your library!");
    } else {
        alert("This book is already in your library.");
    }

    displayLibraryBooks();  // Update library display
}

// Display library books
const inProgressBooksDiv = document.getElementById("inProgressBooks");
const finishedBooksDiv = document.getElementById("finishedBooks");
const savedBooksDiv = document.getElementById("savedBooks");

document.getElementById("inProgressTab").addEventListener("click", () => {
    //console.log("In Progress button clicked!"); 
    inProgressBooksDiv.style.display = "block";
    finishedBooksDiv.style.display = "none";
    savedBooksDiv.style.display = "none";
});


function displayLibraryBooks(activeSection = "all") {
   // console.log("displayLibraryBooks is running!");

    const books = JSON.parse(localStorage.getItem("library")) || [];

    // Get references to sections
    const inProgressBooksDiv = document.getElementById("inProgressBooks");
    const finishedBooksDiv = document.getElementById("finishedBooks");
    const savedBooksDiv = document.getElementById("savedBooks");

    // Clear sections before updating
    inProgressBooksDiv.innerHTML = "";
    finishedBooksDiv.innerHTML = "";
    savedBooksDiv.innerHTML = "";

    let inProgressBooks = 0, finishedBooks = 0, savedBooks = 0;

    books.forEach(book => {
        const progress = Number(book.progress) || 0;
        const bookCard = createBookCard(book);

        if (progress > 0 && progress < 100) {
            if (activeSection === "inProgress" || activeSection === "all") {
                inProgressBooksDiv.appendChild(bookCard);
                inProgressBooks++;
            }
        } else if (progress === 100) {
            if (activeSection === "finished" || activeSection === "all") {
                finishedBooksDiv.appendChild(bookCard);
                finishedBooks++;
            }
        } else if (progress === 0) {
            if (activeSection === "saved" || activeSection === "all") {
                savedBooksDiv.appendChild(bookCard);
                savedBooks++;
            }
        }
    });

    // Display any messages if sections are empty
    if (inProgressBooks === 0 && (activeSection === "inProgress" || activeSection === "all")) {
        inProgressBooksDiv.innerHTML = "<p>No books in this section.</p>";
    }
    if (finishedBooks === 0 && (activeSection === "finished" || activeSection === "all")) {
        finishedBooksDiv.innerHTML = "<p>No books in this section.</p>";
    }
    if (savedBooks === 0 && (activeSection === "saved" || activeSection === "all")) {
        savedBooksDiv.innerHTML = "<p>No books in this section.</p>";
    }
}

const tabs = ["inProgress", "finished", "saved"];

tabs.forEach((tab) => {
    document.getElementById(`${tab}Tab`).addEventListener("click", function () {
        if (tab === "inProgress") console.log("In Progress button clicked!");
        displayLibraryBooks(tab);
    });
});

// Function to move books between sections
function updateBookProgress(title, newProgress) {
    let books = JSON.parse(localStorage.getItem("library")) || [];

    books = books.map(book => {
        if (book.title === title) {
            book.progress = newProgress;
        }
        return book;
    });

    localStorage.setItem("library", JSON.stringify(books));
    displayLibraryBooks(); // Refresh the UI
}

// Function to create a book card for library 
function createBookCard(book) {
    const bookInfo = book.volumeInfo || book;

    const bookCard = document.createElement("div");
    bookCard.classList.add("book-card");

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove from Library";
    removeBtn.classList.add("remove-btn");
    removeBtn.addEventListener("click", () => removeFromLibrary(bookInfo.title));

    let progressBtn = null;

    if (book.progress === 0) {
        progressBtn = document.createElement("button");
        progressBtn.textContent = "Save to In Progress";
        progressBtn.classList.add("save-to-progress-btn");
        progressBtn.addEventListener("click", () => saveToInProgress(bookInfo));
    } else if (book.progress > 0 && book.progress < 100) {
        progressBtn = document.createElement("button");
        progressBtn.textContent = "Save to Finished";
        progressBtn.classList.add("save-to-finished-btn");
        progressBtn.addEventListener("click", () => saveToFinished(bookInfo));
    }

    bookCard.innerHTML = `
        <img src="${bookInfo.imageLinks?.thumbnail || 'placeholder.jpg'}" alt="Book Cover">
        <div class="book-details">
            <h3>${bookInfo.title}</h3>
            <p><strong>Author:</strong> ${bookInfo.authors?.join(", ") || "Unknown"}</p>
            <p><strong>Published:</strong> ${bookInfo.publishedDate || "N/A"}</p>
        </div>
    `;

    if (progressBtn) {
        bookCard.appendChild(progressBtn);
    }
    bookCard.appendChild(removeBtn);

    return bookCard;
}

// Function to save to In Progress
function saveToInProgress(book) {
    let savedBooks = JSON.parse(localStorage.getItem("library")) || [];
    let updatedBook = savedBooks.find(savedBook => savedBook.title === (book.volumeInfo?.title || book.title));
    if (updatedBook) {
        updatedBook.progress = 1; // Ensure progress is set to at least 1
        localStorage.setItem("library", JSON.stringify(savedBooks));
        alert("Book saved to In Progress!");
    } else {
        console.error("Book not found in library.");
    }
    console.log("Updated Library:", JSON.parse(localStorage.getItem("library")));
    displayLibraryBooks(); // Ensure UI updates
}

const library = {
    saved: [],
    inProgress: [],
    finished: []
};
// Function to display books
function updateDisplayedBooks() {
    const sections = ['saved', 'inProgress', 'finished'];
    sections.forEach(section => {
        const container = document.getElementById(section + '-books');
        container.innerHTML = '';
        library[section].forEach(book => {
            const bookElement = document.createElement('div');
            bookElement.classList.add('book');
            bookElement.innerHTML = `
                <p>${book.title}</p>
                <button onclick="removeFromLibrary('${book.id}', '${section}')">REMOVE FROM LIBRARY</button>
            `;
            if (section === 'saved') {
                bookElement.innerHTML += `<button onclick="moveToInProgress('${book.id}')">SAVE TO IN PROGRESS</button>`;
            } else if (section === 'inProgress') {
                bookElement.innerHTML += `<button onclick="moveToFinished('${book.id}')">SAVE TO FINISHED</button>`;
            }
            container.appendChild(bookElement);
        });
    });
}

// Save to Finished
function saveToFinished(book) {
    let savedBooks = JSON.parse(localStorage.getItem("library")) || [];
    const updatedBook = savedBooks.find(savedBook => savedBook.title === book.title);
    if (updatedBook) {
        updatedBook.progress = 100; // Mark the book as finished
        localStorage.setItem("library", JSON.stringify(savedBooks));
        alert("Book saved to Finished!");
    }
    displayLibraryBooks(); // Update library display
}

// Function to remove book from library
function removeFromLibrary(title) {
    let savedBooks = JSON.parse(localStorage.getItem("library")) || [];
    savedBooks = savedBooks.filter(book => book.title !== title);
    localStorage.setItem("library", JSON.stringify(savedBooks));

    displayLibraryBooks();  // Update library display
    alert("Book removed from your library!");
}

// Function to update book progress
function updateBookProgress(title, newProgress) {
    let books = JSON.parse(localStorage.getItem("library")) || [];
    books = books.map(book => {
        if (book.title === title) {
            book.progress = newProgress;
        }
        return book;
    });
    localStorage.setItem("library", JSON.stringify(books));

    // Refresh the UI correctly based on new progress
    if (newProgress > 0 && newProgress < 100) {
        displayLibraryBooks("inProgress");
    } else if (newProgress === 100) {
        displayLibraryBooks("finished");
    } else {
        displayLibraryBooks("saved");
    }
}

// Function to show progress categories
function showCategory(category) {
    console.log(`Showing category: ${category}`); // Debugging log
    document.getElementById("inProgressBooks").style.display = "none";
    document.getElementById("finishedBooks").style.display = "none";
    document.getElementById("savedBooks").style.display = "none";

    let activeSection = document.getElementById(`${category}Books`);
    if (activeSection) {
        activeSection.style.display = "block";
    } else {
        console.error(`Section ${category}Books not found!`);
    }
    displayLibraryBooks(category);
}

function createSaveButton(book) {
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save to Progress"; // Always show "Save to Progress"
    saveButton.classList.add("progress-btn");

    saveButton.addEventListener("click", function() {
        updateReadingProgress(book, 0);  // Set progress to 0 for In Progress
    });
    return saveButton;
}

// Function to create the button for In Progress books to move to "Finished"
function createProgressButton(book) {
    const progressButton = document.createElement("button");
    progressButton.textContent = "Save to Finished"; 
    progressButton.classList.add("progress-btn");
    progressButton.addEventListener("click", function() {
        updateReadingProgress(book, 100);  // Set progress to 100 for Finished
    });
    return progressButton;
}

// Update the book progress and reading progress in the library and save updated state
function updateReadingProgress(book, progress) {
    let savedBooks = JSON.parse(localStorage.getItem("library")) || [];
    const updatedBook = savedBooks.find(savedBook => savedBook.title === book.title);
    if (updatedBook) {
        updatedBook.progress = progress;
        localStorage.setItem("library", JSON.stringify(savedBooks));
        alert("Reading progress updated!");
    }
    displayLibraryBooks();  // Update the display with new progress
}

document.addEventListener("DOMContentLoaded", function () {
    clearSections();
});

function clearSections() {
    document.getElementById("savedBooks").innerHTML = "";
    document.getElementById("inProgressBooks").innerHTML = "";
    document.getElementById("finishedBooks").innerHTML = "";
}

function showSection(sectionId) {
    clearSections();
    let section = document.getElementById(sectionId);
    if (section.children.length === 0) {
        section.innerHTML = "<p>No books in this section</p>";
    }
    section.style.display = "block";
}
