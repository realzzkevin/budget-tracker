
let db;

const request = window.indexedDB.open('Budget_db');

request.onupgradeneeded = function (event) {
    console.log('upgrade in indexDB');
    console.log(event);

    db = event.target.result;
    if (db.objectStoreNames.length === 0) {
        db.createObjectStore('budgets', { autoIncrement: true });
    }
}

request.onsucess = function (event) {
    db = event.target.result;
    if (navigator.onLine) {
        console.log("back online check database");
        checkDatabase();
    }
}

request.onerror = function (event) {
    console.log(`Error!+ ${event.target.errorcode}`);
}

function saveRecord(record) {
    db = request.result;
    console.log('app offline, save record at local');
    const transaction = db.transaction(["budgets"], "readwrite");
    const budgets = transaction.objectStore("budgets");
    budgets.add(record);
}

function checkDatabase() {
    db = request.result;
    const transaction = db.transaction(["budgets"], "readwrite");
    const budgets = transaction.objectStore("budgets");
    const allRecords = budgets.getAll();

    allRecords.onsuccess = () => {
        if (allRecords.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(allRecords.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                },
            })
                .then((response) => response.json())
                .then((res) => {
                    console.log('res');
                    console.log('upload success');
                    if (res.length !== 0) {
                        const trans = db.transaction(["budgets"], "readwrite");
                        const localStore = trans.objectStore("budgets");
                        localStore.clear();
                        console.log('objectStore cleared');
                    }
                });
        }
    };
}

window.addEventListener('online', checkDatabase);