// create variable to hold db connection
let db;
// establish IndexedDB called 'budget_tracker' set to v1
const request = indexedDB.open('budget_tracker', 1);

// event to trigger if db version changes
request.onupgradeneeded = function (event) {
    // save a reference to the db
    const db = event.target.result;

    // create an object store, auto increment
    db.createObjectStore('new_ta', { autoIncrement: true });
};

// on successful create or connect
request.onsuccess = function (event) {
    // save reference to db in global variable
    db = event.target.result;

    // if app is online run upload transactions
    if (navigator.onLine) {
        uploadTransactions();
    }
};

// on error, console.log error
request.onerror = function (event) {
    console.log(event.target.errorCode);
};

// function will be executed if we attempt to submit a transaction and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the db with read/write permissions
    const transaction = db.transaction(['new_ta'], 'readwrite');

    // access object store for `new_transaction`
    const transactionObjectStore = transaction.objectStore('new_ta');

    // add record to store with add method
    transactionObjectStore.add(record);
};

function uploadTransactions() {
    // open a transaction on db
    const transaction = db.transaction(['new_ta'], 'readwrite');

    // access object store
    const transactionObjectStore = transaction.objectStore('new_ta');

    // get all records from store and set to a variable
    const getAll = transactionObjectStore.getAll();

    // on successful .getAll()
    getAll.onsuccess = function () {
        // if there is data in indexedDb, send to api server
        if (getAll.result.length > 0) {
            fetch('api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // open another db transaction
                    const transaction = db.transaction(['new_ta'], 'readwrite');
                    // access the new_ta object store
                    const transactionObjectStore = transaction.objectStore('new_ta');
                    // clear items in store
                    transactionObjectStore.clear();

                    alert('All saved transactions have been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }
};

window.addEventListener('online', uploadTransactions)