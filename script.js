
// 必要なAPIキーとクライアントIDを直接記述
const API_KEY = 'YOUR_API_KEY';
const CLIENT_ID = 'YOUR_CLIENT_ID';
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

// Google APIの初期化と認証
function gapiLoaded() {
    gapi.load('client:auth2', initializeGapiClient);
}

function initializeGapiClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        scope: SCOPES,
    }).then(() => {
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    });
}

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        listRatings();
    } else {
        gapi.auth2.getAuthInstance().signIn();
    }
}

function listRatings() {
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A2:B',
    }).then(response => {
        const range = response.result;
        const ratingsDiv = document.getElementById('ratings');
        ratingsDiv.innerHTML = '';
        if (range.values && range.values.length > 0) {
            for (let i = 0; i < range.values.length; i++) {
                const row = range.values[i];
                ratingsDiv.innerHTML += `<p>${row[0]}: ${row[1]}</p>`;
            }
        } else {
            ratingsDiv.innerHTML = '<p>No data found.</p>';
        }
    }, response => {
        console.error('Error: ' + response.result.error.message);
    });
}

function updateRating(player1, player2, result) {
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A2:B',
    }).then(response => {
        const range = response.result;
        let player1Data = { name: player1, rating: 1000 };
        let player2Data = { name: player2, rating: 1000 };

        if (range.values && range.values.length > 0) {
            for (let i = 0; i < range.values.length; i++) {
                const row = range.values[i];
                if (row[0] === player1) {
                    player1Data = { name: row[0], rating: parseInt(row[1], 10) };
                }
                if (row[0] === player2) {
                    player2Data = { name: row[0], rating: parseInt(row[1], 10) };
                }
            }
        }

        if (result === 'win') {
            player1Data.rating += 10;
            player2Data.rating -= 10;
        } else {
            player1Data.rating -= 10;
            player2Data.rating += 10;
        }

        const data = [
            [player1Data.name, player1Data.rating],
            [player2Data.name, player2Data.rating],
        ];

        const body = {
            values: data,
        };

        gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A2:B',
            valueInputOption: 'RAW',
            resource: body,
        }).then(response => {
            console.log(`${response.result.updatedCells} cells updated.`);
            listRatings();
        });
    }, response => {
        console.error('Error: ' + response.result.error.message);
    });
}

function submitResult() {
    const player1 = document.getElementById('player1').value;
    const player2 = document.getElementById('player2').value;
    const result = document.getElementById('result').value;

    if (player1 && player2) {
        updateRating(player1, player2, result);
    } else {
        alert('Please enter both player names.');
    }
}

// Google APIクライアントライブラリのロード
gapi.load('client:auth2', gapiLoaded);
